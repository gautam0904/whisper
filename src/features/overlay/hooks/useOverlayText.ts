import { useCallback, useRef } from "react";
import { useOverlayStore } from "../store/overlayStore";

const WORD_COUNT_DEBOUNCE_MS = 300;

export function useOverlayText() {
    const text = useOverlayStore((s) => s.text);
    const wordCount = useOverlayStore((s) => s.wordCount);
    const charCount = useOverlayStore((s) => s.charCount);
    const setText = useOverlayStore((s) => s.setText);
    const setTextImmediate = useOverlayStore((s) => s.setTextImmediate);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = useCallback(
        (value: string) => {
            setTextImmediate(value);

            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                setText(value);
            }, WORD_COUNT_DEBOUNCE_MS);
        },
        [setText, setTextImmediate],
    );

    return { text, wordCount, charCount, handleChange };
}
