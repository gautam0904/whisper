import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export const WINDOW_SERVICE_ERRORS = {
    HIDE_FAILED: "Failed to hide Whisper window.",
    SHOW_FAILED: "Failed to show Whisper window.",
    SHORTCUT_FAILED: "Failed to save shortcut setting.",
    PLATFORM_FAILED: "Failed to detect platform.",
    BROWSER_OPEN_FAILED: "Failed to open AI browser.",
    BROWSER_CLOSE_FAILED: "Failed to close AI browser.",
} as const;

export async function hideWindow(): Promise<void> {
    await invoke<void>("hide_window");
}

export async function showWindow(): Promise<void> {
    await invoke<void>("show_window");
}

export async function saveShortcut(combo: string): Promise<void> {
    await invoke<void>("save_shortcut", { shortcut: combo });
}

export async function getPlatform(): Promise<string> {
    return invoke<string>("get_platform");
}

export async function openBrowser(
    url: string,
    yOffset: number,
    providerId: string,
): Promise<void> {
    await invoke<void>("open_browser", { url, yOffset, providerId });
}

export async function closeBrowser(): Promise<void> {
    await invoke<void>("close_browser");
}

export async function navigateBrowser(
    url: string,
    yOffset: number,
    providerId: string,
): Promise<void> {
    await invoke<void>("navigate_browser", { url, yOffset, providerId });
}

export async function resizeBrowser(yOffset: number): Promise<void> {
    await invoke<void>("resize_browser", { yOffset });
}

export async function injectJavascript(script: string): Promise<void> {
    await invoke<void>("inject_javascript", { script });
}

export function startWindowDrag(): void {
    getCurrentWebviewWindow()
        .startDragging()
        .catch(() => {});
}
