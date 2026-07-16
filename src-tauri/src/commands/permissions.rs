use tauri::AppHandle;
use serde_json::json;

#[tauri::command]
pub async fn check_permissions(_app: AppHandle) -> Result<serde_json::Value, String> {
    #[cfg(target_os = "macos")]
    {
        use objc::{msg_send, sel, sel_impl, class};
        use cocoa::base::id;
        use cocoa::foundation::NSString;

        #[link(name = "ApplicationServices", kind = "framework")]
        extern "C" {
            fn AXIsProcessTrusted() -> bool;
        }

        let is_accessibility_granted = unsafe { AXIsProcessTrusted() };

        let is_mic_granted = unsafe {
            let media_type: id = NSString::alloc(cocoa::base::nil).init_str("soun");
            let status: isize = msg_send![class!(AVCaptureDevice), authorizationStatusForMediaType:media_type];
            status == 3
        };

        Ok(json!({
            "accessibility": is_accessibility_granted,
            "microphone": is_mic_granted
        }))
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok(json!({
            "accessibility": true,
            "microphone": true
        }))
    }
}

#[tauri::command]
pub async fn request_microphone(_app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use objc::{msg_send, sel, sel_impl, class};
        use cocoa::base::id;
        use cocoa::foundation::NSString;

        unsafe {
            let media_type: id = NSString::alloc(cocoa::base::nil).init_str("soun");
            let _: () = msg_send![class!(AVCaptureDevice), requestAccessForMediaType:media_type completionHandler: 0 as id];
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn open_microphone_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone")
            .spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("ms-settings:privacy-microphone").spawn()
            .or_else(|_| std::process::Command::new("cmd")
                .args(["/C", "start", "ms-settings:privacy-microphone"])
                .spawn());
    }
    Ok(())
}

#[tauri::command]
pub async fn open_accessibility_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            .spawn();
    }
    Ok(())
}
