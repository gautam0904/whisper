import { create } from "zustand";

export const APP_SCREEN = {
    ONBOARDING: "onboarding",
    MAIN: "main",
    BROWSER: "browser",
    SETTINGS: "settings",
} as const;

export type AppScreen = (typeof APP_SCREEN)[keyof typeof APP_SCREEN];

interface AppState {
    screen: AppScreen;
    isVisible: boolean;
}

interface AppActions {
    setScreen: (screen: AppScreen) => void;
    setVisible: (visible: boolean) => void;
    reset: () => void;
}

const initialState: AppState = {
    screen: APP_SCREEN.MAIN,
    isVisible: true,
};

export const useAppStore = create<AppState & AppActions>((set) => ({
    ...initialState,
    setScreen: (screen) => set({ screen }),
    setVisible: (isVisible) => set({ isVisible }),
    reset: () => set(initialState),
}));
