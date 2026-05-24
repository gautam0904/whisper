import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { injectJavascript } from "../../../shared/services/windowService";
import { getInjectionScript } from "../utils/injectionScript";

interface TranscriptionResult {
    text: string;
    is_final: boolean;
}

export function useLiveTranscription() {
    const [partialText, setPartialText] = useState("");
    const [listening, setListening] = useState(false);

    useEffect(() => {
        const unlistenPartial = listen<TranscriptionResult>("transcription-partial", (event) => {
            setPartialText(event.payload.text);
        });

        const unlistenFinal = listen<TranscriptionResult>("transcription-final", (event) => {
            setPartialText("");
            const text = event.payload.text.trim();
            if (text.length > 0) {
                injectJavascript(getInjectionScript(text)).catch(() => {});
            }
        });

        return () => {
            unlistenPartial.then(fn => fn());
            unlistenFinal.then(fn => fn());
        };
    }, []);

    return { partialText, listening, setListening };
}
