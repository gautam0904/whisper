export const SHORTCUT_STATUS = {
	WAITING: "waiting",
	CAPTURED: "captured",
	CONFLICT: "conflict",
} as const;

export type ShortcutStatus = (typeof SHORTCUT_STATUS)[keyof typeof SHORTCUT_STATUS];

export const KNOWN_CONFLICTS: Record<string, string> = {
	"Ctrl+Shift+S": "Zoom's stop share",
	"Ctrl+Shift+A": "Zoom's mute toggle",
	"Ctrl+Shift+V": "Zoom's start video",
	"Ctrl+Z": "Undo (system-wide)",
	"Ctrl+C": "Copy (system-wide)",
	"Ctrl+V": "Paste (system-wide)",
	"Meta+Space": "Spotlight / Windows search",
	"Ctrl+Alt+Delete": "System reserved",
};

export function buildKeyList(e: KeyboardEvent): string[] {
	const keys: string[] = [];
	if (e.ctrlKey || e.metaKey) keys.push(e.ctrlKey ? "Ctrl" : "⌘");
	if (e.altKey) keys.push("Alt");
	if (e.shiftKey) keys.push("Shift");
	if (e.key.length === 1 && /^[a-zA-Z0-9]$/.test(e.key)) {
		keys.push(e.key.toUpperCase());
	}
	return keys;
}
