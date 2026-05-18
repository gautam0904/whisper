use tauri::{Manager, LogicalPosition, LogicalSize, WebviewUrl};
use tauri::webview::WebviewBuilder;

#[cfg(target_os = "macos")]
fn exclude_from_screen_capture(window: &tauri::WebviewWindow) {
    use cocoa::base::id;
    use objc::msg_send;
    use objc::sel;
    use objc::sel_impl;

    const NS_WINDOW_SHARING_NONE: u64 = 0;

    let ns_win = window.ns_window().expect("Failed to get NSWindow handle") as id;
    unsafe {
        let _: () = msg_send![ns_win, setSharingType: NS_WINDOW_SHARING_NONE];
    }
    println!("[Whisper] macOS: NSWindowSharingNone applied");
}

#[cfg(target_os = "windows")]
fn exclude_from_screen_capture(window: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::SetWindowDisplayAffinity;

    const WDA_EXCLUDEFROMCAPTURE: u32 = 0x00000011;

    let hwnd = window.hwnd().expect("Failed to get HWND");
    let result = unsafe { SetWindowDisplayAffinity(HWND(hwnd.0 as isize), WDA_EXCLUDEFROMCAPTURE) };
    match result {
        Ok(_) => println!("[Whisper] Windows: WDA_EXCLUDEFROMCAPTURE applied"),
        Err(e) => eprintln!("[Whisper] SetWindowDisplayAffinity failed: {:?}", e),
    }
}

#[cfg(target_os = "linux")]
fn exclude_from_screen_capture(_window: &tauri::WebviewWindow) {
    eprintln!("[Whisper] Linux: Screen capture exclusion not supported");
}

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

#[tauri::command]
fn hide_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn show_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn save_shortcut(shortcut: String) -> Result<(), String> {
    println!("[Whisper] Shortcut registered: {}", shortcut);
    Ok(())
}

const BROWSER_LABEL: &str = "ai-browser";
const CONTROLS_HEIGHT: f64 = 110.0;

#[tauri::command]
fn open_browser(app: tauri::AppHandle, url: String, controls_height: f64) -> Result<(), String> {
    close_browser(app.clone())?;

    let window = app
        .get_window("main")
        .ok_or("Main window not found")?;

    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let inner = window.inner_size().map_err(|e| e.to_string())?;
    let logical_w = inner.width as f64 / scale;
    let logical_h = inner.height as f64 / scale;

    let ch = controls_height.max(CONTROLS_HEIGHT);
    let parsed_url = url.parse::<url::Url>().map_err(|e| e.to_string())?;

    window
        .add_child(
            WebviewBuilder::new(BROWSER_LABEL, WebviewUrl::External(parsed_url)),
            LogicalPosition::new(0.0, ch),
            LogicalSize::new(logical_w, logical_h - ch),
        )
        .map_err(|e| e.to_string())?;

    println!("[Whisper] Browser opened: {url}");
    Ok(())
}

#[tauri::command]
fn close_browser(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(view) = app.get_webview(BROWSER_LABEL) {
        view.close().map_err(|e| e.to_string())?;
        println!("[Whisper] Browser closed");
    }
    Ok(())
}

#[tauri::command]
fn navigate_browser(app: tauri::AppHandle, url: String, controls_height: f64) -> Result<(), String> {
    open_browser(app, url, controls_height)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("Main window not found");

            exclude_from_screen_capture(&window);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_platform,
            hide_window,
            show_window,
            save_shortcut,
            open_browser,
            close_browser,
            navigate_browser,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
