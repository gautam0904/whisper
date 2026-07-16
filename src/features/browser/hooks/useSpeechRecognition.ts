import { useEffect, useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useOverlayStore } from "../../overlay/store/overlayStore";

export function useSpeechRecognition(
    onResult: (text: string, isFinal: boolean) => void,
    deviceId?: string
) {
    const [isListening, setIsListening] = useState(false);
    const [finalText, setFinalText] = useState("");
    const [volume, setVolume] = useState(0);
    const [errorState, setErrorState] = useState<"none" | "not-allowed" | "network" | "unavailable" | "no-speech">("none");
    const [errorMessage, setErrorMessage] = useState("");
    const debugInfo = "";

    const streamRef = useRef<MediaStream | null>(null);
    const animRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const unlistenRef = useRef<(() => void) | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const sessionHistoryRef = useRef("");
    const currentChunkRef = useRef("");
    const latestNativeTextRef = useRef("");
    const onResultRef = useRef(onResult);
    const isListeningRef = useRef(false);
    const deviceIdRef = useRef(deviceId);
    const currentTextRef = useRef("");

    // Tracks whether onend fired due to an error we already handled (skip restart)
    const fatalErrorRef = useRef(false);
    // Tracks pending restart timer so we can cancel it on stop
    const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        deviceIdRef.current = deviceId;
        if (isListeningRef.current) {
            stopSpeech();
            const timer = setTimeout(() => { startSpeech(); }, 300);
            return () => clearTimeout(timer);
        }
    }, [deviceId]);

    const startVolumeVisualizer = useCallback(async () => {
        try {
            const constraints: MediaStreamConstraints = deviceIdRef.current
                ? { audio: { deviceId: { exact: deviceIdRef.current } } }
                : { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 32;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVolume = () => {
                if (!isListeningRef.current) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                setVolume(sum / dataArray.length);
                animRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();
        } catch {
            // Visualizer is optional — speech recognition continues without it
        }
    }, []);

    /**
     * Creates and starts a fresh SpeechRecognition instance.
     * Called both on initial start and on every auto-restart after onend.
     * This mirrors how Mac works: always restart after each utterance.
     */
    const createAndStartRecognition = useCallback(() => {
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionClass || !isListeningRef.current) return;

        // Tear down any previous instance cleanly
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onresult = null;
            try { recognitionRef.current.stop(); } catch { /* ignore */ }
            recognitionRef.current = null;
        }

        const rec = new SpeechRecognitionClass() as SpeechRecognition;
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        recognitionRef.current = rec;

        rec.onresult = (event: any) => {
            if (!isListeningRef.current) return;

            let interimText = "";
            let newFinalText = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    newFinalText += (newFinalText ? " " : "") + transcript;
                } else {
                    interimText += (interimText ? " " : "") + transcript;
                }
            }

            // Clear error state as soon as we get any result
            setErrorState("none");
            setErrorMessage("");

            if (newFinalText) {
                sessionHistoryRef.current = (
                    sessionHistoryRef.current +
                    (sessionHistoryRef.current ? " " : "") +
                    newFinalText
                ).trim();
                latestNativeTextRef.current = sessionHistoryRef.current;
                const displayText = (
                    sessionHistoryRef.current +
                    (interimText ? " " + interimText : "")
                ).trim();
                currentTextRef.current = displayText;
                setFinalText(displayText);
                
                if ((window as any).dictationTimeout) {
                    clearTimeout((window as any).dictationTimeout);
                }
                
                // Inject final chunk diff
                const lastInjected = currentChunkRef.current;
                const fullText = sessionHistoryRef.current;
                let newChunk = "";
                
                if (fullText.startsWith(lastInjected)) {
                    newChunk = fullText.substring(lastInjected.length);
                } else {
                    let i = 0;
                    while (i < lastInjected.length && i < fullText.length && lastInjected[i] === fullText[i]) i++;
                    newChunk = fullText.substring(i);
                }

                if (newChunk.trim()) {
                    if (onResultRef.current) {
                        onResultRef.current(newChunk, false);
                    }
                    currentChunkRef.current = fullText;
                }
            } else if (interimText) {
                const displayText = (
                    sessionHistoryRef.current +
                    (sessionHistoryRef.current ? " " : "") +
                    interimText
                ).trim();
                currentTextRef.current = displayText;
                setFinalText(displayText);
                latestNativeTextRef.current = interimText;
                
                const fullNativeText = (sessionHistoryRef.current + (sessionHistoryRef.current ? " " : "") + interimText).trim();

                if ((window as any).dictationTimeout) {
                    clearTimeout((window as any).dictationTimeout);
                }
                
                (window as any).dictationTimeout = setTimeout(() => {
                    if (!isListeningRef.current || !fullNativeText) return;
                    
                    const lastInjected = currentChunkRef.current;
                    let newChunk = "";

                    if (fullNativeText.startsWith(lastInjected)) {
                        newChunk = fullNativeText.substring(lastInjected.length);
                    } else {
                        let i = 0;
                        while (i < lastInjected.length && i < fullNativeText.length && lastInjected[i] === fullNativeText[i]) i++;
                        newChunk = fullNativeText.substring(i);
                    }

                    if (newChunk.trim()) {
                        if (onResultRef.current) {
                            onResultRef.current(newChunk, false);
                        }
                        currentChunkRef.current = fullNativeText;
                    }
                }, 350);
            }
        };

        rec.onerror = (event: any) => {
            const err: string = event.error;
            console.warn("Web Speech API error:", err);

            if (err === "not-allowed" || err === "service-not-allowed") {
                // Fatal — permission denied, do not restart
                fatalErrorRef.current = true;
                setErrorState("not-allowed");
                setErrorMessage("Microphone permission denied. Click 'Fix in Settings' below.");
            } else if (err === "network") {
                // Transient — Web Speech API needs internet. Will auto-restart via onend.
                fatalErrorRef.current = false;
                setErrorState("network");
                setErrorMessage("Network error — Web Speech API requires internet. Retrying...");
            } else if (err === "audio-capture") {
                // Fatal — no mic hardware
                fatalErrorRef.current = true;
                setErrorState("unavailable");
                setErrorMessage("No microphone found. Please connect a microphone.");
            } else if (err === "no-speech") {
                // Non-fatal — silence timeout, restart immediately
                fatalErrorRef.current = false;
                // Don't show error for brief silences; only show after 3+ consecutive
            } else if (err === "aborted") {
                // We triggered this intentionally, don't treat as error
                fatalErrorRef.current = false;
            } else {
                // Unknown — try to restart
                fatalErrorRef.current = false;
                console.warn("Unknown speech error, will restart:", err);
            }
        };

        rec.onend = () => {
            if (!isListeningRef.current) return;

            if (fatalErrorRef.current) {
                // Permission or hardware error — don't restart
                isListeningRef.current = false;
                setIsListening(false);
                return;
            }

            // Non-fatal end (normal sentence boundary, silence, network hiccup)
            // Restart after a very short delay to avoid InvalidStateError.
            // This is the key to continuous transcription — mirrors Mac behavior.
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
                if (isListeningRef.current) {
                    createAndStartRecognition();
                }
            }, 100);
        };

        fatalErrorRef.current = false;

        try {
            rec.start();
        } catch (err) {
            console.error("Failed to start SpeechRecognition:", err);
            // Retry after a delay if start() itself throws
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
                if (isListeningRef.current) createAndStartRecognition();
            }, 300);
        }
    }, []);

    const startSpeech = useCallback(async () => {
        if (isListeningRef.current) return;
        setErrorState("none");
        setErrorMessage("");
        currentTextRef.current = "";
        currentChunkRef.current = "";
        setFinalText("");
        sessionHistoryRef.current = "";
        fatalErrorRef.current = false;

        let platform = "windows";
        try {
            platform = await invoke<string>("get_platform");
        } catch {
            // default to windows path
        }

        const isMac = platform === "macos";

        if (isMac) {
            try {
                const { audioSource } = useOverlayStore.getState();
                if (audioSource === "meeting") {
                    try {
                        await invoke("toggle_audio_routing", { enable: true });
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    } catch { /* routing not available */ }
                }

                await invoke("start_speech_recognition");

                const unlisten = await listen("speech-result", (event: any) => {
                    if (!isListeningRef.current) return;
                    const { text, is_final } = event.payload;

                    const currentText = (
                        sessionHistoryRef.current +
                        (sessionHistoryRef.current ? " " : "") +
                        text
                    ).trim();
                    currentTextRef.current = currentText;
                    setFinalText(currentText);

                    const fullNativeText = text.trim();
                    latestNativeTextRef.current = fullNativeText;

                    const triggerInjection = (finalizing: boolean) => {
                        const lastInjected = currentChunkRef.current;
                        let newChunk = "";

                        if (fullNativeText.startsWith(lastInjected)) {
                            newChunk = fullNativeText.substring(lastInjected.length);
                        } else {
                            let i = 0;
                            while (i < lastInjected.length && i < fullNativeText.length && lastInjected[i] === fullNativeText[i]) i++;
                            newChunk = fullNativeText.substring(i);
                        }

                        if (newChunk.trim()) {
                            if (onResultRef.current) {
                                onResultRef.current(newChunk, false);
                            }
                            currentChunkRef.current = fullNativeText;
                        }

                        if (finalizing) {
                            sessionHistoryRef.current = currentTextRef.current;
                            currentChunkRef.current = "";
                            invoke("stop_speech_recognition").then(() => {
                                if (isListeningRef.current) {
                                    setTimeout(() => invoke("start_speech_recognition"), 100);
                                }
                            }).catch(console.error);
                        }
                    };

                    if ((window as any).dictationTimeout) {
                        clearTimeout((window as any).dictationTimeout);
                    }

                    if (is_final) {
                        triggerInjection(true);
                    } else {
                        (window as any).dictationTimeout = setTimeout(() => {
                            if (!isListeningRef.current || !fullNativeText) return;
                            triggerInjection(false);
                        }, 350);
                    }
                });
                unlistenRef.current = unlisten;

                isListeningRef.current = true;
                setIsListening(true);
                startVolumeVisualizer();
            } catch (err: any) {
                const msg = typeof err === "string" ? err : (err?.message ?? "Native speech recognition failed");
                console.error("Speech init failed (macOS):", msg);
                if (msg.includes("denied") || msg.includes("permission") || msg.includes("not authorized")) {
                    setErrorState("not-allowed");
                } else {
                    setErrorState("unavailable");
                }
                setErrorMessage(msg);
            }

        } else {
            // Windows / Linux: Web Speech API with continuous auto-restart loop
            try {
                // Prime mic permission — triggers the WebView2 permission dialog
                try {
                    const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    testStream.getTracks().forEach((t) => t.stop());
                } catch (permErr: any) {
                    const name: string = permErr?.name ?? "";
                    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
                        setErrorState("not-allowed");
                        setErrorMessage("Microphone permission denied. Click 'Fix in Settings' below.");
                        return;
                    }
                    // NotFoundError, etc. — let SpeechRecognition try anyway
                }

                const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (!SpeechRecognitionClass) {
                    setErrorState("unavailable");
                    setErrorMessage("Web Speech API not available. Ensure you are running the installed Whisper app.");
                    return;
                }

                // Mark as listening BEFORE creating recognition so onend restarts work
                isListeningRef.current = true;
                setIsListening(true);

                // Start the continuous recognition loop
                createAndStartRecognition();

                startVolumeVisualizer();

            } catch (err: any) {
                const msg = typeof err === "string" ? err : (err?.message ?? "Speech recognition failed");
                console.error("Speech init failed (Windows/Linux):", msg);
                setErrorState("unavailable");
                setErrorMessage(msg);
                isListeningRef.current = false;
                setIsListening(false);
            }
        }
    }, [startVolumeVisualizer, createAndStartRecognition]);

    const stopSpeech = useCallback(() => {
        isListeningRef.current = false;

        // Cancel any pending restart
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = null;
        }

        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onresult = null;
            try { recognitionRef.current.stop(); } catch { /* ignore */ }
            recognitionRef.current = null;
        }

        setIsListening(false);
        setVolume(0);

        if ((window as any).dictationTimeout) {
            clearTimeout((window as any).dictationTimeout);
        }

        if (animRef.current) cancelAnimationFrame(animRef.current);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(console.error);
            audioCtxRef.current = null;
        }

        invoke("stop_speech_recognition").catch(() => {});

        // Flush any uncommitted text on stop
        const lastInjected = currentChunkRef.current;
        const fullNativeText = latestNativeTextRef.current;
        let newChunk = "";

        if (fullNativeText.startsWith(lastInjected)) {
            newChunk = fullNativeText.substring(lastInjected.length);
        } else {
            let i = 0;
            while (i < lastInjected.length && i < fullNativeText.length && lastInjected[i] === fullNativeText[i]) i++;
            newChunk = fullNativeText.substring(i);
        }

        if (newChunk.trim()) {
            onResultRef.current(newChunk.trim(), true);
        } else if (fullNativeText) {
            onResultRef.current("", true);
        }

        setFinalText("");
        currentTextRef.current = "";
        sessionHistoryRef.current = "";
        currentChunkRef.current = "";
        latestNativeTextRef.current = "";
        fatalErrorRef.current = false;

        setTimeout(() => {
            if (unlistenRef.current) {
                unlistenRef.current();
                unlistenRef.current = null;
            }
        }, 1500);

        const { audioSource } = useOverlayStore.getState();
        if (audioSource === "meeting") {
            invoke("toggle_audio_routing", { enable: false }).catch(() => {});
        }
    }, []);

    useEffect(() => { return () => stopSpeech(); }, [stopSpeech]);

    return { isListening, finalText, volume, errorState, errorMessage, debugInfo, startSpeech, stopSpeech };
}

export default useSpeechRecognition;
