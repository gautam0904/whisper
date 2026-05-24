import { invoke } from "@tauri-apps/api/core";

export interface OSPermissions {
    accessibility: boolean;
    microphone: boolean;
}

export async function checkPermissions(): Promise<OSPermissions> {
    try {
        return await invoke<OSPermissions>("check_permissions");
    } catch {
        return { accessibility: true, microphone: true };
    }
}

export async function requestMicrophone(): Promise<void> {
    try {
        await invoke("request_microphone");
    } catch {
        /* permission denied or unsupported — silently ignored */
    }
}

export async function openMicrophoneSettings(): Promise<void> {
    try {
        await invoke("open_microphone_settings");
    } catch {
        /* unsupported platform — silently ignored */
    }
}

export async function openAccessibilitySettings(): Promise<void> {
    try {
        await invoke("open_accessibility_settings");
    } catch {
        /* unsupported platform — silently ignored */
    }
}
