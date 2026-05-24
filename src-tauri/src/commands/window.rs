use crate::error::AppError;
use tauri::webview::WebviewBuilder;
use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, WebviewUrl};

const BROWSER_LABEL: &str = "ai-browser";
const BROWSER_USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15";

#[tauri::command]
pub async fn hide_window(app: AppHandle) -> Result<(), AppError> {
    app.get_webview_window("main")
        .ok_or_else(|| AppError::Window("Main window not found".to_string()))?
        .hide()
        .map_err(|e| AppError::Window(e.to_string()))
}

#[tauri::command]
pub async fn show_window(app: AppHandle) -> Result<(), AppError> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| AppError::Window("Main window not found".to_string()))?;
    window.show().map_err(|e| AppError::Window(e.to_string()))?;
    window
        .set_focus()
        .map_err(|e| AppError::Window(e.to_string()))
}

#[tauri::command]
pub async fn get_platform() -> Result<String, AppError> {
    #[cfg(target_os = "macos")]
    return Ok("macos".to_string());
    #[cfg(target_os = "windows")]
    return Ok("windows".to_string());
    #[cfg(target_os = "linux")]
    return Ok("linux".to_string());

    #[allow(unreachable_code)]
    Ok("unknown".to_string())
}

#[tauri::command]
pub async fn open_browser(
    app: AppHandle,
    url: String,
    y_offset: f64,
    provider_id: String,
) -> Result<(), AppError> {
    let parsed_url = url
        .parse::<url::Url>()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    if let Some(view) = app.get_webview(BROWSER_LABEL) {
        view.navigate(parsed_url)
            .map_err(|e| AppError::Window(e.to_string()))?;
        return Ok(());
    }

    let window = app
        .get_window("main")
        .ok_or_else(|| AppError::Window("Main window not found".to_string()))?;

    let scale = window
        .scale_factor()
        .map_err(|e| AppError::Window(e.to_string()))?;
    let inner = window
        .inner_size()
        .map_err(|e| AppError::Window(e.to_string()))?;
    let logical_w = inner.width as f64 / scale;
    let logical_h = inner.height as f64 / scale;

    let data_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join("sessions")
        .join(&provider_id);

    let webview_h = (logical_h - y_offset).max(0.0);

    window
        .add_child(
            WebviewBuilder::new(BROWSER_LABEL, WebviewUrl::External(parsed_url))
                .data_directory(data_dir)
                .user_agent(BROWSER_USER_AGENT)
                .initialization_script(
                    r#"
                    Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                    Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
                    Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]});
                    "#,
                ),
            LogicalPosition::new(0.0, y_offset),
            LogicalSize::new(logical_w, webview_h),
        )
        .map_err(|e| AppError::Window(e.to_string()))?;

    Ok(())
}

#[tauri::command]
pub async fn close_browser(app: AppHandle) -> Result<(), AppError> {
    if let Some(view) = app.get_webview(BROWSER_LABEL) {
        view.close().map_err(|e| AppError::Window(e.to_string()))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn navigate_browser(
    app: AppHandle,
    url: String,
    y_offset: f64,
    provider_id: String,
) -> Result<(), AppError> {
    open_browser(app, url, y_offset, provider_id).await
}

#[tauri::command]
pub async fn resize_browser(app: AppHandle, y_offset: f64) -> Result<(), AppError> {
    if let Some(view) = app.get_webview(BROWSER_LABEL) {
        let window = app
            .get_window("main")
            .ok_or_else(|| AppError::Window("Main window not found".to_string()))?;

        let scale = window
            .scale_factor()
            .map_err(|e| AppError::Window(e.to_string()))?;
        let inner = window
            .inner_size()
            .map_err(|e| AppError::Window(e.to_string()))?;
        let logical_w = inner.width as f64 / scale;
        let logical_h = inner.height as f64 / scale;

        let webview_h = (logical_h - y_offset).max(0.0);

        view.set_position(LogicalPosition::new(0.0, y_offset))
            .map_err(|e| AppError::Window(e.to_string()))?;
        view.set_size(LogicalSize::new(logical_w, webview_h))
            .map_err(|e| AppError::Window(e.to_string()))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn inject_javascript(app: AppHandle, script: String) -> Result<(), AppError> {
    if let Some(view) = app.get_webview(BROWSER_LABEL) {
        view.eval(&script)
            .map_err(|e| AppError::Internal(e.to_string()))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn inject_text(
    app: AppHandle,
    text: String,
    input_selector: Option<String>,
    submit_selector: Option<String>,
    auto_submit: bool,
    append: Option<bool>,
) -> Result<(), AppError> {
    let sel = input_selector.unwrap_or_else(|| {
        "#prompt-textarea, [contenteditable='true'], textarea, .ql-editor".to_string()
    });
    let sub_sel = submit_selector.unwrap_or_else(|| {
        "button[type='submit'], button[data-testid*='send'], button[aria-label*='Send']".to_string()
    });
    let append_flag = append.unwrap_or(false);
    let script = format!(
        r#"
        (function() {{
            const text = {};
            const shouldAppend = {};
            const selector = '{}';
            console.log('[Whisper Inject] Running inject_text', {{ text, shouldAppend, selector }});
            const input = document.querySelector(selector);
            if (!input) {{
                console.error('[Whisper Inject] Could not find input element using selector:', selector);
                return;
            }}
            console.log('[Whisper Inject] Found input element:', input.tagName, input);
            if (input) {{
                if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {{
                    const currentVal = input.value || '';
                    let newVal = text;
                    if (shouldAppend && currentVal) {{
                        newVal = currentVal + (currentVal.endsWith(' ') || currentVal.endsWith('\n') ? '' : ' ') + text;
                    }}
                    const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                    const nativeTextAreaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                    if (input.tagName === 'TEXTAREA' && nativeTextAreaSetter) {{
                        nativeTextAreaSetter.call(input, newVal);
                    }} else if (input.tagName === 'INPUT' && nativeInputSetter) {{
                        nativeInputSetter.call(input, newVal);
                    }} else {{
                        input.value = newVal;
                    }}
                }} else {{
                    input.focus();
                    if (!shouldAppend) {{
                        document.execCommand('selectAll', false, null);
                    }} else {{
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(input);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        if (input.textContent && !input.textContent.endsWith(' ') && !input.textContent.endsWith('\n')) {{
                            document.execCommand('insertText', false, ' ');
                        }}
                    }}
                    document.execCommand('insertText', false, text);
                }}
                input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                console.log('[Whisper Inject] Text injected and events dispatched');
                if ({}) {{
                    setTimeout(() => {{
                        const btn = document.querySelector('{}');
                        if (btn) {{
                            btn.click();
                            console.log('[Whisper Inject] Submit button clicked');
                        }} else {{
                            console.log('[Whisper Inject] Submit button not found, dispatching Enter key');
                            const enterEvent = new KeyboardEvent('keydown', {{
                                key: 'Enter',
                                code: 'Enter',
                                keyCode: 13,
                                which: 13,
                                bubbles: true,
                                cancelable: true
                            }});
                            input.dispatchEvent(enterEvent);
                        }}
                    }}, 100);
                }}
            }}
        }})();
        "#,
        serde_json::to_string(&text).unwrap_or_else(|_| "String()".to_string()),
        append_flag,
        sel.replace("'", "\\'"),
        auto_submit,
        sub_sel.replace("'", "\\'")
    );
    inject_javascript(app, script).await
}
