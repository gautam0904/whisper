import { useCallback, useEffect, useRef, useState } from "react";
import {
    closeBrowser,
    openBrowser,
    navigateBrowser,
    resizeBrowser,
} from "../../../shared/services/windowService";
import { useSettingsStore } from "../../settings/index";
import { useAppStore, APP_SCREEN } from "../../../shared/stores/appStore";
import { invoke } from "@tauri-apps/api/core";
import { useOverlayStore } from "../../overlay/store/overlayStore";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSystemAudioDevice } from "../hooks/useSystemAudioDevice";
import BrowserToolbar from "./BrowserToolbar";
import AudioBar from "./AudioBar";
import "./BrowserView.css";

const TITLE_BAR_H = 38;
const TOOLBAR_H = 44;
const AUDIO_BAR_H = 40;
const CONTROLS_HEIGHT = TITLE_BAR_H + TOOLBAR_H + AUDIO_BAR_H;

interface BrowserViewProps {
    onClose: () => void;
}

export default function BrowserView({ onClose }: BrowserViewProps) {
    const { providers, activeProviderId, setActiveProvider } = useSettingsStore();
    const activeProvider = providers.find((p) => p.id === activeProviderId);
    const setScreen = useAppStore((s) => s.setScreen);

    const { audioSource, context, resumeMode, injectEnabled } = useOverlayStore();
    const { deviceId: virtualDeviceId } = useSystemAudioDevice();
    const speechDeviceId = audioSource === "meeting" ? virtualDeviceId : undefined;

    const [status, setStatus] = useState<"idle" | "loading" | "open">("idle");
    const isNavigating = useRef(false);
    const isClosed = useRef(false);

    const handleSpeechResult = async (text: string, isFinal: boolean) => {
        if (!injectEnabled) return;

        let promptText = "";

        if (isFinal && resumeMode) {
            if (context.resume.active && context.resume.text) {
                promptText += `[RESUME CONTEXT - ACTIVE]\n"${context.resume.text}"\n\n`;
            }
            if (context.jobDescription.active && context.jobDescription.text) {
                promptText += `[JOB DESCRIPTION - ACTIVE]\n"${context.jobDescription.text}"\n\n`;
            }
            if (context.company.active && context.company.text) {
                promptText += `[COMPANY CONTEXT - ACTIVE]\n"${context.company.text}"\n\n`;
            }
        }

        promptText += isFinal && promptText ? `QUESTION: "${text}"` : text;

        try {
            console.log("[BrowserView] handleSpeechResult injecting text:", promptText, "isFinal:", isFinal);
            await invoke("inject_text", {
                text: promptText,
                inputSelector: activeProvider?.id === "custom" ? (activeProvider as any).inputSelector : undefined,
                submitSelector: activeProvider?.id === "custom" ? (activeProvider as any).submitSelector : undefined,
                autoSubmit: false,
                append: true,
            });
            console.log("[BrowserView] inject_text successful!");
        } catch (e) {
            console.error("[BrowserView] inject_text failed:", e);
        }
    };

    const {
        isListening,
        finalText,
        volume,
        errorState,
        errorMessage,
        startSpeech,
        stopSpeech,
    } = useSpeechRecognition(handleSpeechResult, speechDeviceId);

    const toggleListen = () => {
        if (isListening) stopSpeech();
        else startSpeech();
    };

    const navigate = useCallback(async (url: string, providerId: string) => {
        if (!url || isNavigating.current) return;
        isNavigating.current = true;
        setStatus("loading");
        try {
            await openBrowser(url, CONTROLS_HEIGHT, providerId);
            setStatus("open");
        } catch {
            setStatus("idle");
        } finally {
            isNavigating.current = false;
        }
    }, []);

    const handleClose = useCallback(async () => {
        if (isClosed.current) return;
        isClosed.current = true;
        try {
            await closeBrowser();
        } catch {
            /* ignored */
        }
        onClose();
    }, [onClose]);

    const handleRefresh = useCallback(async () => {
        if (activeProvider?.url && activeProviderId) {
            setStatus("loading");
            try {
                await navigateBrowser(activeProvider.url, CONTROLS_HEIGHT, activeProviderId);
                setStatus("open");
            } catch {
                setStatus("idle");
            }
        }
    }, [activeProvider, activeProviderId]);

    const handleSwitchAI = useCallback(
        async (providerId: string) => {
            setActiveProvider(providerId);
            const provider = providers.find((p) => p.id === providerId);
            if (provider?.url) {
                setStatus("loading");
                try {
                    await navigateBrowser(provider.url, CONTROLS_HEIGHT, providerId);
                    setStatus("open");
                } catch {
                    setStatus("idle");
                }
            }
        },
        [providers, setActiveProvider],
    );

    useEffect(() => {
        if (activeProvider?.url && activeProviderId) {
            navigate(activeProvider.url, activeProviderId);
        }
    }, [activeProvider, activeProviderId, navigate]);

    useEffect(() => {
        startSpeech();
    }, []);

    useEffect(() => {
        return () => {
            if (!isClosed.current) {
                closeBrowser().catch(() => {});
            }
        };
    }, []);

    useEffect(() => {
        const handleWindowResize = () => {
            if (status === "open" && !isClosed.current) {
                resizeBrowser(CONTROLS_HEIGHT).catch(() => {});
            }
        };

        window.addEventListener("resize", handleWindowResize);
        return () => window.removeEventListener("resize", handleWindowResize);
    }, [status]);

    return (
        <div className="browser-view">
            <div style={{ display: "flex", flexDirection: "column", width: "100%", flexShrink: 0, zIndex: 9999 }}>
                <BrowserToolbar
                    onBack={handleClose}
                    onRefresh={handleRefresh}
                    onSwitchAI={handleSwitchAI}
                    onOpenSettings={() => setScreen(APP_SCREEN.SETTINGS)}
                />
                 <AudioBar
                    isListening={isListening}
                    volume={volume}
                    errorState={errorState}
                    errorMessage={errorMessage}
                    finalText={finalText}
                    onToggleListen={toggleListen}
                />
            </div>

            {status !== "open" && (
                <div className="browser-empty">
                    {status === "loading" ? (
                        <>
                            <div className="spinner" />
                            <span>Loading {activeProvider?.name}...</span>
                        </>
                    ) : (
                        <span className="empty-hint">Select an AI provider to start</span>
                    )}
                </div>
            )}
        </div>
    );
}
