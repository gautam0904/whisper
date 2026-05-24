pub mod commands;
pub mod error;
use tauri::Manager;

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
}

#[cfg(target_os = "windows")]
fn exclude_from_screen_capture(window: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::SetWindowDisplayAffinity;

    const WDA_EXCLUDEFROMCAPTURE: u32 = 0x00000011;

    let hwnd = window.hwnd().expect("Failed to get HWND");
    let _ = unsafe { SetWindowDisplayAffinity(HWND(hwnd.0 as isize), WDA_EXCLUDEFROMCAPTURE) };
}

#[cfg(target_os = "linux")]
fn exclude_from_screen_capture(_window: &tauri::WebviewWindow) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("Main window not found");

            exclude_from_screen_capture(&window);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::window::get_platform,
            commands::window::hide_window,
            commands::window::show_window,
            commands::window::open_browser,
            commands::window::close_browser,
            commands::window::navigate_browser,
            commands::window::resize_browser,
            commands::window::inject_javascript,
            commands::window::inject_text,
            commands::shortcuts::save_shortcut,
            commands::permissions::check_permissions,
            commands::permissions::request_microphone,
            commands::permissions::open_microphone_settings,
            commands::permissions::open_accessibility_settings,
            commands::audio::check_audio_driver,
            commands::audio::install_audio_driver,
            commands::audio::auto_configure_audio,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
