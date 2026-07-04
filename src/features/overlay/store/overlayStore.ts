import { create } from "zustand";

export interface CustomProvider {
    id: string;
    name: string;
    url: string;
    inputSelector: string;
    submitSelector: string;
}

export interface ContextItem {
    text: string;
    active: boolean;
    charLimit: number;
}

export interface OverlayState {
    audioSource: "mic" | "meeting" | null;
    micDeviceName: string | null;
    virtualDriverInstalled: boolean;
    virtualDriverName: "BlackHole 2ch" | "VB-Cable" | null;
    selectedProvider: "chatgpt" | "gemini" | "deepseek" | "google" | "custom" | null;
    customProviders: CustomProvider[];
    context: {
        resume: ContextItem;
        jobDescription: ContextItem;
        company: ContextItem;
    };
    autoSubmit: boolean;
    resumeMode: boolean;
    pauseThresholdMs: number;
    advancedContextExpanded: boolean;
    blackHoleSetupExpanded: boolean;
    isValidating: boolean;
    validationError: string | null;
    text: string;
    wordCount: number;
    charCount: number;
}

export interface OverlayActions {
    setAudioSource: (source: "mic" | "meeting" | null) => void;
    setMicDeviceName: (name: string | null) => void;
    setVirtualDriverInstalled: (installed: boolean) => void;
    setVirtualDriverName: (name: "BlackHole 2ch" | "VB-Cable" | null) => void;
    setSelectedProvider: (provider: "chatgpt" | "gemini" | "deepseek" | "google" | "custom" | null) => void;
    addCustomProvider: (provider: CustomProvider) => void;
    setContextText: (key: "resume" | "jobDescription" | "company", text: string) => void;
    setContextActive: (key: "resume" | "jobDescription" | "company", active: boolean) => void;
    setAutoSubmit: (auto: boolean) => void;
    setResumeMode: (mode: boolean) => void;
    setPauseThresholdMs: (threshold: number) => void;
    setAdvancedContextExpanded: (expanded: boolean) => void;
    setBlackHoleSetupExpanded: (expanded: boolean) => void;
    setIsValidating: (validating: boolean) => void;
    setValidationError: (error: string | null) => void;
    setText: (text: string) => void;
    setTextImmediate: (text: string) => void;
    clearText: () => void;
    reset: () => void;
}

const initialState: OverlayState = {
    audioSource: "mic",
    micDeviceName: null,
    virtualDriverInstalled: false,
    virtualDriverName: null,
    selectedProvider: "chatgpt",
    customProviders: [],
    context: {
        resume: { text: "", active: false, charLimit: 5000 },
        jobDescription: { text: "", active: false, charLimit: 3000 },
        company: { text: "", active: false, charLimit: 2000 },
    },
    autoSubmit: true,
    resumeMode: true,
    pauseThresholdMs: 2000,
    advancedContextExpanded: false,
    blackHoleSetupExpanded: false,
    isValidating: false,
    validationError: null,
    text: "",
    wordCount: 0,
    charCount: 0,
};

function computeCounts(text: string) {
    return {
        wordCount: text.trim() === "" ? 0 : text.trim().split(/\s+/).length,
        charCount: text.length,
    };
}

export const useOverlayStore = create<OverlayState & OverlayActions>((set) => ({
    ...initialState,
    setAudioSource: (audioSource) => set({ audioSource }),
    setMicDeviceName: (micDeviceName) => set({ micDeviceName }),
    setVirtualDriverInstalled: (virtualDriverInstalled) => set({ virtualDriverInstalled }),
    setVirtualDriverName: (virtualDriverName) => set({ virtualDriverName }),
    setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
    addCustomProvider: (provider) => set((s) => ({ customProviders: [...s.customProviders, provider] })),
    setContextText: (key, text) => set((s) => ({
        context: {
            ...s.context,
            [key]: { ...s.context[key], text }
        }
    })),
    setContextActive: (key, active) => set((s) => ({
        context: {
            ...s.context,
            [key]: { ...s.context[key], active }
        }
    })),
    setAutoSubmit: (autoSubmit) => set({ autoSubmit }),
    setResumeMode: (resumeMode) => set({ resumeMode }),
    setPauseThresholdMs: (pauseThresholdMs) => set({ pauseThresholdMs }),
    setAdvancedContextExpanded: (advancedContextExpanded) => set({ advancedContextExpanded }),
    setBlackHoleSetupExpanded: (blackHoleSetupExpanded) => set({ blackHoleSetupExpanded }),
    setIsValidating: (isValidating) => set({ isValidating }),
    setValidationError: (validationError) => set({ validationError }),
    setText: (text) => set({ text, ...computeCounts(text) }),
    setTextImmediate: (text) => set({ text }),
    clearText: () => set({ text: "", wordCount: 0, charCount: 0 }),
    reset: () => set(initialState),
}));
