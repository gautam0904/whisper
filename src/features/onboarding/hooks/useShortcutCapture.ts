import { useCallback, useEffect, useRef, useState } from "react";

import { KNOWN_CONFLICTS, buildKeyList, SHORTCUT_STATUS, type ShortcutStatus } from "../../../shared/utils/shortcutHelpers";

export { SHORTCUT_STATUS };

export function useShortcutCapture() {
    const [capturedKeys, setCapturedKeys] = useState<string[]>([]);
    const [capturedCombo, setCapturedCombo] = useState("");
    const [shortcutStatus, setShortcutStatus] = useState<ShortcutStatus>(
        SHORTCUT_STATUS.WAITING,
    );
    const [conflictApp, setConflictApp] = useState("");
    const [isShaking, setIsShaking] = useState(false);
    const isCaptureActive = useRef(false);

    const handleCaptureKey = useCallback(
        (e: KeyboardEvent) => {
            if (!isCaptureActive.current) return;
            e.preventDefault();
            if (e.key === "Escape") return;

            const keys = buildKeyList(e);
            if (keys.length < 2) return;

            const combo = keys.join("+");
            setCapturedKeys(keys);
            setCapturedCombo(combo);

            const conflict = KNOWN_CONFLICTS[combo];
            if (conflict) {
                setShortcutStatus(SHORTCUT_STATUS.CONFLICT);
                setConflictApp(conflict);
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
            } else {
                setShortcutStatus(SHORTCUT_STATUS.CAPTURED);
                setConflictApp("");
            }
        },
        [],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleCaptureKey);
        return () => window.removeEventListener("keydown", handleCaptureKey);
    }, [handleCaptureKey]);

    const activateCapture = () => {
        isCaptureActive.current = true;
    };

    const applyDefault = () => {
        setCapturedKeys(["Ctrl", "Shift", "W"]);
        setCapturedCombo("Ctrl+Shift+W");
        setShortcutStatus(SHORTCUT_STATUS.CAPTURED);
        setConflictApp("");
    };

    return {
        capturedKeys,
        capturedCombo,
        shortcutStatus,
        conflictApp,
        isShaking,
        activateCapture,
        applyDefault,
    };
}
