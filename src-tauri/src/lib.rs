use tauri::Manager;

// ─── Screen Capture Exclusion ─────────────────────────────────────────────────

/// macOS: set NSWindowSharingNone so the window is excluded from
/// CGWindowListCreateImage, ReplayKit, Zoom, Teams, OBS, etc.
#[cfg(target_os = "macos")]
fn exclude_from_screen_capture(window: &tauri::WebviewWindow) {
    use cocoa::base::id;
    use objc::msg_send;
    use objc::sel;
    use objc::sel_impl;

    // NSWindowSharingNone = 0
    const NS_WINDOW_SHARING_NONE: u64 = 0;

    let ns_win = window.ns_window().expect("Failed to get NSWindow handle") as id;
    unsafe {
        let _: () = msg_send![ns_win, setSharingType: NS_WINDOW_SHARING_NONE];
    }
    println!("[Whisper] macOS: NSWindowSharingNone applied — window excluded from screen capture");
}

/// Windows: SetWindowDisplayAffinity with WDA_EXCLUDEFROMCAPTURE (0x11)
/// Requires Windows 10 version 2004 (build 19041) or later.
#[cfg(target_os = "windows")]
fn exclude_from_screen_capture(window: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::SetWindowDisplayAffinity;

    // WDA_EXCLUDEFROMCAPTURE = 0x00000011
    const WDA_EXCLUDEFROMCAPTURE: u32 = 0x00000011;

    let hwnd = window.hwnd().expect("Failed to get HWND");
    let result = unsafe { SetWindowDisplayAffinity(HWND(hwnd.0 as isize), WDA_EXCLUDEFROMCAPTURE) };
    match result {
        Ok(_) => println!("[Whisper] Windows: WDA_EXCLUDEFROMCAPTURE applied — window excluded from screen capture"),
        Err(e) => eprintln!("[Whisper] Windows: SetWindowDisplayAffinity failed: {:?}", e),
    }
}

/// Linux: no universal screen-capture exclusion API exists on X11/Wayland.
/// Log a warning — the frontend shows a notice to the user.
#[cfg(target_os = "linux")]
fn exclude_from_screen_capture(_window: &tauri::WebviewWindow) {
    eprintln!("[Whisper] Linux: Screen capture exclusion is not supported on X11/Wayland. Use per-app window sharing in Zoom/Teams instead.");
}

// ─── Tauri Commands ───────────────────────────────────────────────────────────

/// Returns the current platform string for OS-specific UI adaptations in the frontend
#[tauri::command]
fn get_platform() -> String {
    #[cfg(target_os = "macos")]
    return "macos".to_string();
    #[cfg(target_os = "windows")]
    return "windows".to_string();
    #[cfg(target_os = "linux")]
    return "linux".to_string();
    #[allow(unreachable_code)]
    "unknown".to_string()
}

/// Hide the main Whisper window completely
#[tauri::command]
fn hide_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

/// Show/summon the main Whisper window and bring it to focus
#[tauri::command]
fn show_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Save the user's chosen shortcut string (stub — global-shortcut plugin comes next)
#[tauri::command]
fn save_shortcut(shortcut: String) -> Result<(), String> {
    println!("[Whisper] Shortcut registered: {}", shortcut);
    Ok(())
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("Main window not found");

            // Apply OS-level screen capture exclusion immediately on startup.
            // This runs BEFORE the window is shown, ensuring it is never captured.
            exclude_from_screen_capture(&window);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_platform,
            hide_window,
            show_window,
            save_shortcut,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
