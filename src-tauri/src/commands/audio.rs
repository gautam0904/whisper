use crate::error::AppError;
use crate::AppAudioState;
use tauri::State;

#[cfg(target_os = "macos")]
pub async fn check_mac_audio() -> Result<bool, AppError> {
    let output = std::process::Command::new("system_profiler")
        .arg("SPAudioDataType")
        .output()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    let is_installed = stdout.contains("BlackHole") 
        || std::path::Path::new("/Library/Audio/Plug-Ins/HAL/BlackHole.driver").exists()
        || std::path::Path::new("/Library/Audio/Plug-Ins/HAL/BlackHole2ch.driver").exists();
        
    Ok(is_installed)
}

#[cfg(target_os = "windows")]
pub async fn check_win_audio() -> Result<bool, AppError> {
    use cpal::traits::{DeviceTrait, HostTrait};
    let host = cpal::default_host();
    let mut found = false;
    if let Ok(devices) = host.output_devices() {
        for device in devices {
            if let Ok(name) = device.name() {
                if name.contains("CABLE") || name.contains("VB-Audio") {
                    found = true;
                    break;
                }
            }
        }
    }
    Ok(found)
}

#[tauri::command]
pub async fn check_audio_driver() -> Result<bool, AppError> {
    #[cfg(target_os = "macos")]
    return check_mac_audio().await;

    #[cfg(target_os = "windows")]
    return check_win_audio().await;

    #[cfg(target_os = "linux")]
    return Ok(false);
}

#[tauri::command]
pub async fn install_audio_driver() -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        let bh_installed = std::path::Path::new("/Library/Audio/Plug-Ins/HAL/BlackHole.driver").exists()
            || std::path::Path::new("/Library/Audio/Plug-Ins/HAL/BlackHole2ch.driver").exists()
            || std::path::Path::new("/Library/Audio/Plug-Ins/HAL/BlackHole16ch.driver").exists();

        let mut packages = vec!["switchaudio-osx"];
        if !bh_installed {
            packages.push("blackhole-2ch");
        }

        // Attempt to install quietly via brew
        let output = std::process::Command::new("brew")
            .arg("install")
            .args(&packages)
            .output()
            .map_err(|e| AppError::Internal(e.to_string()))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            if err.contains("sudo: a terminal is required") {
                // If it asks for sudo password, launch Terminal for the user to type it
                let script = format!(
                    "tell application \"Terminal\"\n\
                     activate\n\
                     do script \"brew install {} && echo '\\n✅ Installation complete! You can close this terminal window and return to Whisper.'\"\n\
                     end tell",
                     packages.join(" ")
                );
                std::process::Command::new("osascript")
                    .arg("-e")
                    .arg(&script)
                    .spawn()
                    .map_err(|e| AppError::Internal(e.to_string()))?;
                
                return Err(AppError::Internal("A Terminal window has been opened for you to enter your Mac password to install the audio driver. Once it finishes, try again.".to_string()));
            } else {
                return Err(AppError::Internal(format!("Brew install failed: {}", err)));
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Download and install VB-Cable silently
        let ps_script = r#"
            $ErrorActionPreference = 'Stop'
            $zipPath = "$env:TEMP\VBCABLE.zip"
            $extractPath = "$env:TEMP\VBCABLE"
            Invoke-WebRequest -Uri "https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip" -OutFile $zipPath
            if (Test-Path $extractPath) { Remove-Item -Recurse -Force $extractPath }
            Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
            $installer = "$extractPath\VBCABLE_Setup_x64.exe"
            Start-Process -FilePath $installer -ArgumentList "-i", "-h" -Wait -Verb RunAs
        "#;

        let output = std::process::Command::new("powershell")
            .args(["-NoProfile", "-Command", ps_script])
            .output()
            .map_err(|e| AppError::Internal(e.to_string()))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Internal(format!(
                "Windows install failed: {}",
                err
            )));
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn auto_configure_audio() -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        // Open Audio MIDI Setup so the user can easily create/configure Multi-Output Device
        let _ = std::process::Command::new("open")
            .arg("/System/Applications/Utilities/Audio MIDI Setup.app")
            .status();

        // Also open Sound Settings panel
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.Sound-Settings.extension")
            .status();
    }

    #[cfg(target_os = "windows")]
    {
        // Open Sound Control Panel directly to Recording tab (index 1)
        let _ = std::process::Command::new("control.exe")
            .arg("mmsys.cpl,,1")
            .status();
    }

    Ok(())
}

#[tauri::command]
pub async fn get_original_audio_device(
    state: State<'_, AppAudioState>,
) -> Result<String, AppError> {
    let lock = state
        .guard
        .lock()
        .map_err(|e| AppError::Audio(format!("State lock poisoned: {}", e)))?;

    Ok(lock
        .as_ref()
        .map(|g| g.original_output.clone())
        .unwrap_or_default())
}

#[tauri::command]
pub async fn toggle_audio_routing(
    enable: bool,
    state: State<'_, AppAudioState>,
) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        if enable {
            // Unmuted: route audio to BlackHole and set output to Multi-Output
            // First, capture current state if not already captured
            if let Ok(mut lock) = state.guard.lock() {
                if lock.is_none() {
                    if let Ok(guard) = crate::services::audio_service::capture_audio_state() {
                        *lock = Some(guard);
                    }
                }
            }

            // Route audio
            let _ = std::process::Command::new("SwitchAudioSource")
                .args(["-s", "BlackHole 2ch", "-t", "input"])
                .output();
            let _ = std::process::Command::new("SwitchAudioSource")
                .args(["-s", "Multi-Output Device", "-t", "output"])
                .output();
        } else {
            // Muted: restore previous state
            if let Ok(mut lock) = state.guard.lock() {
                if let Some(ref guard) = *lock {
                    let _ = crate::services::audio_service::restore_audio_state(guard);
                }
                // Clear the guard so we can capture fresh state next time
                *lock = None;
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn start_speech_recognition(app: tauri::AppHandle) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        crate::services::speech_service::start_recognition(app)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn stop_speech_recognition() -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        crate::services::speech_service::stop_recognition()?;
    }
    Ok(())
}
