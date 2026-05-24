
export const PLATFORM = {
	WINDOWS: "windows",
	MACOS: "macos",
	LINUX: "linux",
	UNKNOWN: "unknown",
} as const;

export type Platform = (typeof PLATFORM)[keyof typeof PLATFORM];
