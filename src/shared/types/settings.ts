
export interface OverlaySettings {
	opacity: number;
	fontSize: number;
}

export interface ShortcutSettings {
	summonKey: string;
}

export interface AppearanceSettings {
	themeId: string;
}

export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
	opacity: 72,
	fontSize: 18,
};

export const DEFAULT_SHORTCUT_SETTINGS: ShortcutSettings = {
	summonKey: "Ctrl+Shift+W",
};
