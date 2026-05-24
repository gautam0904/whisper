import { useEffect, useState, useRef } from "react";

export function useSpeechRecognition(onResult: (text: string, isFinal: boolean) => void) {
    const [isListening, setIsListening] = useState(false);
    const [finalText, setFinalText] = useState("");
    const [volume, setVolume] = useState(0);
    const [errorState, setErrorState] = useState<"none" | "not-allowed" | "network">("none");
    const recognitionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animRef = useRef<number | null>(null);
    const sessionHistoryRef = useRef("");
    const onResultRef = useRef(onResult);

    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    const startSpeech = async () => {
        if (isListening || recognitionRef.current) return;
        setErrorState("none");
        const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechClass) return;
        const recognition = new SpeechClass();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-IN";
        recognitionRef.current = recognition;

        let currentSessionFinal = "";
        recognition.onresult = (event: any) => {
            let final = "";
            for (let i = 0; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += text;
            }
            currentSessionFinal = final;
            
            const currentFinalText = sessionHistoryRef.current + final;

            if (final) { 
                setFinalText(currentFinalText); 
                onResultRef.current(final, true); 
            }
        };
        recognition.onerror = (e: any) => {
            if (e.error === "not-allowed") setErrorState("not-allowed");
            if (e.error === "network") setErrorState("network");
        };
        recognition.onend = () => { 
            sessionHistoryRef.current += currentSessionFinal;
            if (isListening && recognitionRef.current) recognitionRef.current.start(); 
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 32;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
                if (!analyser || !streamRef.current) return;
                analyser.getByteFrequencyData(dataArray);
                setVolume(dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length);
                animRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
            recognition.start();
            setIsListening(true);
        } catch { setErrorState("not-allowed"); }
    };

    const stopSpeech = () => {
        setIsListening(false);
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (streamRef.current) {
            for (const t of streamRef.current.getTracks()) t.stop();
            streamRef.current = null;
        }
        if (animRef.current) cancelAnimationFrame(animRef.current);
        setVolume(0);
        sessionHistoryRef.current = "";
    };

    useEffect(() => { return () => stopSpeech(); }, []);
    return { isListening, finalText, volume, errorState, startSpeech, stopSpeech };
}
export default useSpeechRecognition;
