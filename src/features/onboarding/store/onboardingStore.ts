import { create } from "zustand";
import { DEFAULT_SHORTCUT_SETTINGS } from "../../../shared/types/settings";

interface OnboardingState {
    isComplete: boolean;
    shortcut: string;
}

interface OnboardingActions {
    setComplete: (done: boolean) => void;
    setShortcut: (combo: string) => void;
    reset: () => void;
}

const initialState: OnboardingState = {
    isComplete: false,
    shortcut: DEFAULT_SHORTCUT_SETTINGS.summonKey,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>(
    (set) => ({
        ...initialState,
        setComplete: (isComplete) => set({ isComplete }),
        setShortcut: (shortcut) => set({ shortcut }),
        reset: () => set(initialState),
    }),
);
