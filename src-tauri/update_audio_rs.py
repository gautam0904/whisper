import re

with open("src/commands/audio.rs", "r") as f:
    content = f.read()

# We need to inject the new commands into the file
new_commands = """
use std::sync::Mutex;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

static ORIGINAL_OUTPUT: Mutex<Option<String>> = Mutex::new(None);
static ORIGINAL_INPUT: Mutex<Option<String>> = Mutex::new(None);
static STOP_SIGNAL: Mutex<Option<Arc<AtomicBool>>> = Mutex::new(None);

#[tauri::command]
pub async fn switch_audio_mode(mode: String) -> Result<(), AppError> {
    println!("[MODE] User selected: {} audio", mode.to_uppercase());
    
    // Stop any running RMS monitoring thread
    {
        let mut stop_sig = STOP_SIGNAL.lock().unwrap();
        if let Some(sig) = stop_sig.take() {
            sig.store(true, Ordering::SeqCst);
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        println!("[MODE] Checking system output device...");
        // Get current output device
        let output = std::process::Command::new("SwitchAudioSource")
            .arg("-c")
            .output()
            .map_err(|e| AppError::Internal(e.to_string()))?;
        
        let current_output = String::from_utf8_lossy(&output.stdout).trim().to_string();
        println!("[MODE] System output is: {}", current_output);
        
        if current_output != "Multi-Output Device" && current_output != "BlackHole 2ch" {
            let mut orig = ORIGINAL_OUTPUT.lock().unwrap();
            if orig.is_none() {
                *orig = Some(current_output.clone());
            }
        }
        
        let output = std::process::Command::new("SwitchAudioSource")
            .args(["-t", "input", "-c"])
            .output()
            .map_err(|e| AppError::Internal(e.to_string()))?;
        let current_input = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if current_input != "BlackHole 2ch" {
            let mut orig = ORIGINAL_INPUT.lock().unwrap();
            if orig.is_none() {
                *orig = Some(current_input);
            }
        }

        if mode == "system" || mode == "both" {
            println!("[MODE] Changing system output to Multi-Output Device...");
            // Ensure Multi-Output Device exists (use existing auto_configure_audio logic)
            let _ = auto_configure_audio().await;
            
            let _ = std::process::Command::new("SwitchAudioSource")
                .args(["-s", "Multi-Output Device"])
                .output();
            println!("[MODE] System output changed to: Multi-Output Device");
            
            println!("[MODE] Changing system input to BlackHole 2ch...");
            let _ = std::process::Command::new("SwitchAudioSource")
                .args(["-t", "input", "-s", "BlackHole 2ch"])
                .output();
            println!("[MODE] System input changed to: BlackHole 2ch");
            
            start_rms_monitoring("BlackHole 2ch");
        } else if mode == "mic" {
            println!("[MODE] Stopping system capture...");
            let orig_in = ORIGINAL_INPUT.lock().unwrap().clone();
            if let Some(in_dev) = orig_in {
                let _ = std::process::Command::new("SwitchAudioSource")
                    .args(["-t", "input", "-s", &in_dev])
                    .output();
                println!("[MODE] System input changed to: {}", in_dev);
            }
        }
    }
    
    Ok(())
}

fn start_rms_monitoring(device_name: &str) {
    println!("[MODE] Starting capture from {}...", device_name);
    let target_name = device_name.to_lowercase();
    
    std::thread::spawn(move || {
        let host = cpal::default_host();
        let mut target_device = None;
        if let Ok(devices) = host.input_devices() {
            for device in devices {
                if let Ok(name) = device.name() {
                    if name.to_lowercase().contains(&target_name) {
                        target_device = Some(device);
                        break;
                    }
                }
            }
        }
        
        let device = match target_device {
            Some(d) => d,
            None => return,
        };
        
        let config = match device.default_input_config() {
            Ok(c) => c,
            Err(_) => return,
        };
        
        let stop_flag = Arc::new(AtomicBool::new(false));
        {
            let mut sig = STOP_SIGNAL.lock().unwrap();
            *sig = Some(stop_flag.clone());
        }
        
        println!("[MODE] Capture started. Monitoring signal...");
        
        let err_fn = |err| eprintln!("an error occurred on stream: {}", err);
        
        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &_| {
                    if stop_flag.load(Ordering::SeqCst) { return; }
                    let sum: f32 = data.iter().map(|&x| x * x).sum();
                    let rms = (sum / data.len() as f32).sqrt();
                    let peak = data.iter().map(|&x| x.abs()).fold(0.0f32, |a,b| a.max(b));
                    println!("[SIGNAL] RMS: {:.4} | Peak: {:.4} | Device: {}", rms, peak, target_name);
                },
                err_fn,
                None,
            ),
            _ => return, // Only handling F32 for brevity
        };
        
        if let Ok(stream) = stream {
            let _ = stream.play();
            // Just loop until stopped
            let check_flag = STOP_SIGNAL.lock().unwrap().clone();
            if let Some(flag) = check_flag {
                while !flag.load(Ordering::SeqCst) {
                    std::thread::sleep(std::time::Duration::from_secs(5));
                }
            }
        }
    });
}

#[tauri::command]
pub async fn cleanup_audio() -> Result<(), AppError> {
    println!("[CLEANUP] Cleaning up audio devices...");
    #[cfg(target_os = "macos")]
    {
        let mut orig_out = ORIGINAL_OUTPUT.lock().unwrap();
        if let Some(out_dev) = orig_out.take() {
            println!("[CLEANUP] Restoring system output to: {}", out_dev);
            let _ = std::process::Command::new("SwitchAudioSource")
                .args(["-s", &out_dev])
                .output();
        }
        
        let mut orig_in = ORIGINAL_INPUT.lock().unwrap();
        if let Some(in_dev) = orig_in.take() {
            println!("[CLEANUP] Restoring system input to: {}", in_dev);
            let _ = std::process::Command::new("SwitchAudioSource")
                .args(["-t", "input", "-s", &in_dev])
                .output();
        }
        println!("[CLEANUP] Audio devices restored to original state");
    }
    
    // Stop monitoring
    {
        let mut stop_sig = STOP_SIGNAL.lock().unwrap();
        if let Some(sig) = stop_sig.take() {
            sig.store(true, Ordering::SeqCst);
        }
    }
    Ok(())
}
"""

with open("src/commands/audio.rs", "w") as f:
    f.write(new_commands + "\n" + content)
