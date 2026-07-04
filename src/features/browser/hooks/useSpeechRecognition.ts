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
    
    const sessionHistoryRef = useRef("");
    const currentChunkRef = useRef("");
    const latestNativeTextRef = useRef("");
    const onResultRef = useRef(onResult);
    const isListeningRef = useRef(false);
    const deviceIdRef = useRef(deviceId);
    const currentTextRef = useRef("");

    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        deviceIdRef.current = deviceId;
        if (isListeningRef.current) {
            stopSpeech();
            const timer = setTimeout(() => {
                startSpeech();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [deviceId]);


    const startSpeech = useCallback(async () => {
        if (isListeningRef.current) return;
        setErrorState("none");
        currentTextRef.current = "";
        currentChunkRef.current = "";
        setFinalText("");
        sessionHistoryRef.current = "";

        try {
            const { audioSource } = useOverlayStore.getState();
            if (audioSource === "meeting") {
                try {
                    await invoke("toggle_audio_routing", { enable: true });
                    // IMPORTANT: Wait for CoreAudio to broadcast the default device change
                    // otherwise AVAudioEngine will grab the old microphone!
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } catch {
                    /* routing not available, still proceed */
                }
            }

            // Start native macOS speech recognition
            await invoke("start_speech_recognition");

            // Listen for native speech results
            const unlisten = await listen("speech-result", (event: any) => {
                if (!isListeningRef.current) return;
                const { text, is_final } = event.payload;
                
                // Show interim results in the UI immediately
                const currentText = (sessionHistoryRef.current + (sessionHistoryRef.current ? " " : "") + text).trim();
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
                        // Apple corrected a previous word. Find the common prefix so we don't inject the whole string again.
                        let i = 0;
                        while(i < lastInjected.length && i < fullNativeText.length && lastInjected[i] === fullNativeText[i]) i++;
                        // If it's completely different, this might look weird, but it's better than duplicating 50 words.
                        newChunk = fullNativeText.substring(i);
                    }

                    if (newChunk.trim()) {
                        console.log("Auto-injecting chunk:", newChunk);
                        if (onResultRef.current) {
                            onResultRef.current(newChunk, false); // false = don't auto-submit
                        }
                        currentChunkRef.current = fullNativeText;
                    }

                    if (finalizing) {
                        // The engine is dead. Commit to history and restart!
                        sessionHistoryRef.current = currentTextRef.current;
                        currentChunkRef.current = "";
                        invoke("stop_speech_recognition").then(() => {
                            if (isListeningRef.current) {
                                setTimeout(() => invoke("start_speech_recognition"), 100);
                            }
                        }).catch(console.error);
                    }
                };

                // Fast auto-commit on 350ms pause
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

            // Start local mic stream just for the volume visualizer
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
            
            isListeningRef.current = true;
            setIsListening(true);
        } catch (err: any) {
            const msg = typeof err === "string" ? err : (err?.message ?? "Native speech recognition failed");
            console.error("Speech init failed:", msg);
            if (msg.includes("denied") || msg.includes("permission") || msg.includes("not authorized")) {
                setErrorState("not-allowed");
            } else {
                setErrorState("unavailable");
            }
            setErrorMessage(msg);
            stopSpeech();
        }
    }, []);

    const stopSpeech = useCallback(() => {
        if (!isListeningRef.current) return;
        isListeningRef.current = false;
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
        
        // Manually trigger the final result with whatever UNCOMMITTED chunk we have so far!
        const lastInjected = currentChunkRef.current;
        const fullNativeText = latestNativeTextRef.current;
        let newChunk = "";
        
        if (fullNativeText.startsWith(lastInjected)) {
            newChunk = fullNativeText.substring(lastInjected.length);
        } else {
            let i = 0;
            while(i < lastInjected.length && i < fullNativeText.length && lastInjected[i] === fullNativeText[i]) i++;
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
        
        // We do NOT unlisten here anymore. 
        // We let the `is_final` event handler do the unlistening so we don't drop the final transcription!
        // Fallback: If it never arrives, we'll unlisten on the next startSpeech or unmount.
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
