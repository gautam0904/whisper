import { create } from 'zustand';
import { load, Store } from '@tauri-apps/plugin-store';

export interface AIProvider {
    id: string;
    name: string;
    url: string;
    jsInjectionScript: string;
}

export interface SettingsState {
    providers: AIProvider[];
    activeProviderId: string | null;
    resumeText: string;
    isResumeModeActive: boolean;
    opacity: number;
    fontSize: number;
    fontFamily: string;
    jobDescription: string;
    companyDetails: string;
    error: string | null;
}

export interface SettingsActions {
    initStore: () => Promise<void>;
    addProvider: (provider: AIProvider) => void;
    updateProvider: (id: string, updates: Partial<AIProvider>) => void;
    deleteProvider: (id: string) => void;
    setActiveProvider: (id: string) => void;
    setResumeText: (text: string) => void;
    setResumeModeActive: (active: boolean) => void;
    setOpacity: (opacity: number) => void;
    setFontSize: (size: number) => void;
    setFontFamily: (family: string) => void;
    setJobDescription: (text: string) => void;
    setCompanyDetails: (text: string) => void;
    reset: () => void;
}

const DEFAULT_PROVIDERS: AIProvider[] = [
    {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        jsInjectionScript: 'document.querySelector("textarea").value = __PROMPT__; document.querySelector("button[data-testid=\'send-button\']").click();'
    },
    {
        id: 'gemini',
        name: 'Gemini',
        url: 'https://gemini.google.com',
        jsInjectionScript: 'let el = document.querySelector(".ql-editor"); if(el) { el.innerText = __PROMPT__; }'
    }
];

const initialState: SettingsState = {
    providers: DEFAULT_PROVIDERS,
    activeProviderId: 'chatgpt',
    resumeText: '',
    isResumeModeActive: false,
    opacity: 0.85,
    fontSize: 15,
    fontFamily: 'sans-serif',
    jobDescription: '',
    companyDetails: '',
    error: null,
};

let store: Store | null = null;

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
    ...initialState,
    initStore: async () => {
        try {
            store = await load('settings.json');
            if (store) {
                const savedProviders = await store.get<AIProvider[]>('providers');
                const savedActive = await store.get<string>('activeProviderId');
                const savedResume = await store.get<string>('resumeText');
                const savedOpacity = await store.get<number>('opacity');
                const savedFontSize = await store.get<number>('fontSize');
                const savedFontFamily = await store.get<string>('fontFamily');
                const savedJD = await store.get<string>('jobDescription');
                const savedCompany = await store.get<string>('companyDetails');

                set((state) => ({
                    providers: savedProviders || state.providers,
                    activeProviderId: savedActive || state.activeProviderId,
                    resumeText: savedResume !== undefined ? savedResume : state.resumeText,
                    opacity: savedOpacity !== undefined ? savedOpacity : state.opacity,
                    fontSize: savedFontSize !== undefined ? savedFontSize : state.fontSize,
                    fontFamily: savedFontFamily || state.fontFamily,
                    jobDescription: savedJD !== undefined ? savedJD : state.jobDescription,
                    companyDetails: savedCompany !== undefined ? savedCompany : state.companyDetails,
                }));
            }
        } catch {
            set({ error: 'Failed to load saved settings. Using defaults.' });
        }
    },
    addProvider: async (provider) => {
        const newProviders = [...get().providers, provider];
        set({ providers: newProviders });
        if (store) { await store.set('providers', newProviders); await store.save(); }
    },
    updateProvider: async (id, updates) => {
        const newProviders = get().providers.map(p => p.id === id ? { ...p, ...updates } : p);
        set({ providers: newProviders });
        if (store) { await store.set('providers', newProviders); await store.save(); }
    },
    deleteProvider: async (id) => {
        const newProviders = get().providers.filter(p => p.id !== id);
        set({ providers: newProviders });
        if (store) { await store.set('providers', newProviders); await store.save(); }
    },
    setActiveProvider: async (id) => {
        set({ activeProviderId: id });
        if (store) { await store.set('activeProviderId', id); await store.save(); }
    },
    setResumeText: async (text) => {
        set({ resumeText: text });
        if (store) { await store.set('resumeText', text); await store.save(); }
    },
    setResumeModeActive: (active) => {
        set({ isResumeModeActive: active });
    },
    setOpacity: async (opacity) => {
        set({ opacity });
        if (store) { await store.set('opacity', opacity); await store.save(); }
    },
    setFontSize: async (size) => {
        set({ fontSize: size });
        if (store) { await store.set('fontSize', size); await store.save(); }
    },
    setFontFamily: async (family) => {
        set({ fontFamily: family });
        if (store) { await store.set('fontFamily', family); await store.save(); }
    },
    setJobDescription: async (text) => {
        set({ jobDescription: text });
        if (store) { await store.set('jobDescription', text); await store.save(); }
    },
    setCompanyDetails: async (text) => {
        set({ companyDetails: text });
        if (store) { await store.set('companyDetails', text); await store.save(); }
    },
    reset: () => set(initialState),
}));
