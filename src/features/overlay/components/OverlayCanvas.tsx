import { useCallback, useEffect, useState } from "react";
import GhostDot from "../../../shared/components/GhostDot/GhostDot";
import { checkPermissions, OSPermissions, openAccessibilitySettings } from "../../../shared/services/permissionsService";
import { AlertTriangle, ExternalLink, Settings, X, MessageSquare, Play, ShieldCheck } from "lucide-react";
import AudioInputSection from "./AudioInputSection";
import AIProviderSection from "./AIProviderSection";
import AdvancedContextSection from "./AdvancedContextSection";
import styles from "./OverlayCanvas.module.css";

interface OverlayCanvasProps {
    shortcut: string;
    onHide: () => void;
    onOpenBrowser?: () => void;
    onOpenSettings?: () => void;
}

export default function OverlayCanvas({
    shortcut,
    onHide,
    onOpenBrowser,
    onOpenSettings,
}: OverlayCanvasProps) {
    const [permissions, setPermissions] = useState<OSPermissions>({ accessibility: true, microphone: true });

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onHide();
        },
        [onHide],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        checkPermissions().then(setPermissions);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className={styles.canvas} style={{ background: "var(--color-bg-dark)", color: "var(--color-text-primary)" }}>
            <GhostDot />

            <div
                className="drag-handle"
                data-tauri-drag-region
                title="Drag to move Whisper"
                style={{
                    height: "30px",
                    width: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: "var(--z-drag)" as any,
                    cursor: "move"
                }}
            />

            <div className={styles.typingWrap} style={{ paddingTop: "40px" }}>
                <h1 className={styles.sectionTitle} style={{ fontSize: "28px", fontWeight: "700", display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare size={24} color="var(--color-accent)" fill="var(--color-accent)" /> Whisper
                </h1>

                <AudioInputSection />

                <AIProviderSection />

                <AdvancedContextSection />

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
                    <button type="button" className={styles.startBtn} onClick={onOpenBrowser || (() => {})}>
                        <Play size={16} fill="currentColor" /> Start AI Session
                    </button>
                </div>

                {!permissions.accessibility && (
                    <div className={styles.permissionsWarning}>
                        <AlertTriangle size={14} color="var(--color-warning)" />
                        <div className={styles.permFixes}>
                            <span>Missing OS Accessibility permissions (required for screen shared invisibility checks):</span>
                            <button type="button" className={styles.fixPermissionBtn} onClick={openAccessibilitySettings}>
                                Grant Accessibility <ExternalLink size={10} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.bottomBar}>
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-success)",
                        opacity: 0.75,
                        userSelect: "none",
                    }}
                    title="All OS-level changes (audio routing, shortcuts) are automatically undone when the app quits"
                >
                    <ShieldCheck size={11} />
                    OS Reset on Quit
                </span>
                <div style={{ flex: 1 }} />
                <div className={styles.barRight}>
                    <span className={styles.shortcutHint}>Summon: {shortcut}</span>
                    {onOpenSettings && (
                        <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={onOpenSettings}
                            aria-label="Open settings"
                            title="Settings"
                        >
                            <Settings size={14} />
                        </button>
                    )}
                    <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={onHide}
                        aria-label="Hide window"
                        title="Hide (Esc)"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
