pub mod commands;
pub mod error;
pub mod services;

use services::audio_service::{capture_original_output_device, restore_output_device, AudioResetGuard};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

pub struct AppAudioState {
    pub guard: Mutex<Option<AudioResetGuard>>,
}

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
    use windows::Win32::UI::WindowsAndMessaging::{SetWindowDisplayAffinity, WINDOW_DISPLAY_AFFINITY};

    const WDA_EXCLUDEFROMCAPTURE: u32 = 0x00000011;

    let hwnd = window.hwnd().expect("Failed to get HWND");
    let _ = unsafe { SetWindowDisplayAffinity(HWND(hwnd.0 as *mut std::ffi::c_void), WINDOW_DISPLAY_AFFINITY(WDA_EXCLUDEFROMCAPTURE)) };
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
        .manage(AppAudioState {
            guard: Mutex::new(None),
        })
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("Main window not found");

            exclude_from_screen_capture(&window);

            let audio_state = app.state::<AppAudioState>();
            match capture_original_output_device() {
                Ok(guard) => {
                    if let Ok(mut lock) = audio_state.guard.lock() {
                        *lock = Some(guard);
                    }
                }
                Err(_) => {}
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { .. }
                | tauri::WindowEvent::Destroyed => {
                    let app = window.app_handle();

                    if let Some(audio_state) = app.try_state::<AppAudioState>() {
                        if let Ok(lock) = audio_state.guard.lock() {
                            if let Some(ref guard) = *lock {
                                let _ = restore_output_device(guard);
                            }
                        }
                    }

                    let _ = app
                        .global_shortcut()
                        .unregister_all();
                }
                _ => {}
            }
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
            commands::audio::get_original_audio_device,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
