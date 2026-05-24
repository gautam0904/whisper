import { useCallback, useEffect } from "react";
import { BrowserView } from "./features/browser/index";
import { SettingsPanel } from "./features/settings/index";
import { OverlayCanvas } from "./features/overlay/index";
import { useSettingsStore } from "./features/settings/index";
import { useOnboardingStore } from "./features/onboarding/index";
import GhostDot from "./shared/components/GhostDot/GhostDot";
import { APP_SCREEN, useAppStore } from "./shared/stores/appStore";

export default function App() {
    const screen = useAppStore((s) => s.screen);
    const isVisible = useAppStore((s) => s.isVisible);
    const setScreen = useAppStore((s) => s.setScreen);
    const setVisible = useAppStore((s) => s.setVisible);
    const shortcut = useOnboardingStore((s) => s.shortcut);

    useEffect(() => {
        useSettingsStore.getState().initStore();
    }, []);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && screen === APP_SCREEN.MAIN) {
                setVisible(false);
            }
        },
        [screen, setVisible],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const handleHide = () => setVisible(false);

    if (!isVisible) {
        return (
            <div className="whisper-shell" style={{ background: "transparent" }}>
                <GhostDot title="Whisper active — click or press shortcut to summon" />
            </div>
        );
    }

    return (
        <div className="whisper-shell">
            {screen !== APP_SCREEN.BROWSER && <GhostDot />}

            {screen === APP_SCREEN.MAIN && (
                <OverlayCanvas
                    shortcut={shortcut}
                    onHide={handleHide}
                    onOpenBrowser={() => setScreen(APP_SCREEN.BROWSER)}
                    onOpenSettings={() => setScreen(APP_SCREEN.SETTINGS)}
                />
            )}

            {screen === APP_SCREEN.BROWSER && (
                <BrowserView onClose={() => setScreen(APP_SCREEN.MAIN)} />
            )}

            {screen === APP_SCREEN.SETTINGS && (
                <SettingsPanel />
            )}
        </div>
    );
}
