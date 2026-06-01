use crate::error::AppError;

pub struct AudioResetGuard {
    pub original_device: String,
}

#[cfg(target_os = "macos")]
pub fn capture_original_output_device() -> Result<AudioResetGuard, AppError> {
    let output = std::process::Command::new("SwitchAudioSource")
        .args(["-t", "output", "-c"])
        .output();

    match output {
        Ok(result) if result.status.success() => {
            let raw = String::from_utf8_lossy(&result.stdout).trim().to_string();
            if raw.is_empty() {
                return Err(AppError::Audio(
                    "SwitchAudioSource returned empty device name".to_string(),
                ));
            }
            Ok(AudioResetGuard {
                original_device: raw,
            })
        }
        Ok(result) => {
            let stderr = String::from_utf8_lossy(&result.stderr).trim().to_string();
            Err(AppError::Audio(format!(
                "SwitchAudioSource failed: {}",
                stderr
            )))
        }
        Err(_) => {
            let fallback = capture_via_coreaudio();
            fallback.map(|name| AudioResetGuard {
                original_device: name,
            })
        }
    }
}

#[cfg(target_os = "macos")]
fn capture_via_coreaudio() -> Result<String, AppError> {
    use std::ffi::CStr;

    #[allow(non_camel_case_types)]
    type AudioObjectID = u32;
    #[allow(non_camel_case_types)]
    type AudioObjectPropertySelector = u32;
    #[allow(non_camel_case_types)]
    type AudioObjectPropertyScope = u32;
    #[allow(non_camel_case_types)]
    type AudioObjectPropertyElement = u32;

    #[repr(C)]
    struct AudioObjectPropertyAddress {
        selector: AudioObjectPropertySelector,
        scope: AudioObjectPropertyScope,
        element: AudioObjectPropertyElement,
    }

    const K_AUDIO_OBJECT_SYSTEM_OBJECT: AudioObjectID = 1;
    const K_AUDIO_HARDWARE_PROPERTY_DEFAULT_OUTPUT_DEVICE: AudioObjectPropertySelector = 0x6465_7643;
    const K_AUDIO_OBJECT_PROPERTY_SCOPE_GLOBAL: AudioObjectPropertyScope = 0x676C_6F62;
    const K_AUDIO_OBJECT_PROPERTY_ELEMENT_MASTER: AudioObjectPropertyElement = 0;
    const K_AUDIO_OBJECT_PROPERTY_NAME: AudioObjectPropertySelector = 0x6C6E_616D;

    #[link(name = "CoreAudio", kind = "framework")]
    extern "C" {
        fn AudioObjectGetPropertyData(
            object_id: AudioObjectID,
            address: *const AudioObjectPropertyAddress,
            qualifier_data_size: u32,
            qualifier_data: *const std::ffi::c_void,
            data_size: *mut u32,
            out_data: *mut std::ffi::c_void,
        ) -> i32;
    }

    unsafe {
        let addr = AudioObjectPropertyAddress {
            selector: K_AUDIO_HARDWARE_PROPERTY_DEFAULT_OUTPUT_DEVICE,
            scope: K_AUDIO_OBJECT_PROPERTY_SCOPE_GLOBAL,
            element: K_AUDIO_OBJECT_PROPERTY_ELEMENT_MASTER,
        };

        let mut device_id: AudioObjectID = 0;
        let mut data_size = std::mem::size_of::<AudioObjectID>() as u32;

        let status = AudioObjectGetPropertyData(
            K_AUDIO_OBJECT_SYSTEM_OBJECT,
            &addr,
            0,
            std::ptr::null(),
            &mut data_size,
            &mut device_id as *mut _ as *mut std::ffi::c_void,
        );

        if status != 0 {
            return Err(AppError::Audio(format!(
                "AudioObjectGetPropertyData (default device) failed: {}",
                status
            )));
        }

        let name_addr = AudioObjectPropertyAddress {
            selector: K_AUDIO_OBJECT_PROPERTY_NAME,
            scope: K_AUDIO_OBJECT_PROPERTY_SCOPE_GLOBAL,
            element: K_AUDIO_OBJECT_PROPERTY_ELEMENT_MASTER,
        };

        let mut cf_name: *mut std::ffi::c_void = std::ptr::null_mut();
        let mut name_size = std::mem::size_of::<*mut std::ffi::c_void>() as u32;

        let status2 = AudioObjectGetPropertyData(
            device_id,
            &name_addr,
            0,
            std::ptr::null(),
            &mut name_size,
            &mut cf_name as *mut _ as *mut std::ffi::c_void,
        );

        if status2 != 0 || cf_name.is_null() {
            return Err(AppError::Audio(format!(
                "AudioObjectGetPropertyData (device name) failed: {}",
                status2
            )));
        }

        extern "C" {
            fn CFStringGetCStringPtr(
                the_string: *const std::ffi::c_void,
                encoding: u32,
            ) -> *const std::os::raw::c_char;
        }

        let c_str_ptr = CFStringGetCStringPtr(cf_name, 0x0800_0100);
        if c_str_ptr.is_null() {
            return Err(AppError::Audio(
                "CFStringGetCStringPtr returned null".to_string(),
            ));
        }

        let name = CStr::from_ptr(c_str_ptr)
            .to_string_lossy()
            .into_owned();

        Ok(name)
    }
}

#[cfg(target_os = "macos")]
pub fn restore_output_device(guard: &AudioResetGuard) -> Result<(), AppError> {
    let output = std::process::Command::new("SwitchAudioSource")
        .args(["-t", "output", "-s", &guard.original_device])
        .output();

    match output {
        Ok(result) if result.status.success() => Ok(()),
        Ok(result) => {
            let stderr = String::from_utf8_lossy(&result.stderr).trim().to_string();
            Err(AppError::Audio(format!(
                "Failed to restore audio device '{}': {}",
                guard.original_device, stderr
            )))
        }
        Err(e) => Err(AppError::Audio(format!(
            "SwitchAudioSource not available, cannot restore: {}",
            e
        ))),
    }
}

#[cfg(not(target_os = "macos"))]
pub fn capture_original_output_device() -> Result<AudioResetGuard, AppError> {
    Ok(AudioResetGuard {
        original_device: String::new(),
    })
}

#[cfg(not(target_os = "macos"))]
pub fn restore_output_device(_guard: &AudioResetGuard) -> Result<(), AppError> {
    Ok(())
}
