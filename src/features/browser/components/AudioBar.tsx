import { Mic, MicOff, AlertCircle, ArrowRight, Settings, RefreshCw, Volume2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import WaveformVisualizer from "./WaveformVisualizer";
import styles from "./AudioBar.module.css";
import { useOverlayStore } from "../../overlay/store/overlayStore";
import { invoke } from "@tauri-apps/api/core";

interface AudioBarProps {
    isListening: boolean;
    volume: number;
    errorState: "none" | "not-allowed" | "network" | "unavailable" | "no-speech";
    errorMessage?: string;
    finalText?: string;
    onToggleListen: () => void;
    virtualDeviceFound?: boolean;
    virtualDeviceLabel?: string | null;
    virtualDeviceIsDefault?: boolean;
}

export default function AudioBar({
    isListening,
    volume,
    errorState,
    errorMessage,
    finalText,
    onToggleListen,
    virtualDeviceFound = false,
    virtualDeviceLabel = null,
    virtualDeviceIsDefault = false,
}: AudioBarProps) {
    const { audioSource, setAudioSource, autoSubmit, setAutoSubmit, injectEnabled, setInjectEnabled } = useOverlayStore();
    const [expanded, setExpanded] = useState(false);

    const showSystemWarning =
        audioSource === "meeting" &&
        (!virtualDeviceFound || !virtualDeviceIsDefault);

    const getSystemWarningMessage = () => {
        if (!virtualDeviceFound) {
            return "VB-Cable not installed — system audio capture requires VB-Cable virtual audio driver.";
        }
        return `${virtualDeviceLabel ?? "VB-Cable"} is installed but NOT set as your default Windows microphone — system audio won't be transcribed.`;
    };

    const getErrorMessage = () => {
        if (errorMessage) return errorMessage;
        if (errorState === "not-allowed") return "Mic permission denied. Click 'Fix' to open mic settings.";
        if (errorState === "network") return "Network error during speech recognition. Retrying...";
        if (errorState === "unavailable") return "Speech recognition unavailable. Ensure you are running the installed Whisper app.";
        if (errorState === "no-speech") return "No speech detected — check your microphone.";
        return "";
    };

    const handleOpenMicSettings = async () => {
        try {
            await invoke("open_microphone_settings");
        } catch { /* ignore */ }
    };

    const handleOpenSoundSettings = async () => {
        try {
            await invoke("auto_configure_audio");
        } catch { /* ignore */ }
    };

    return (
        <>
            <div className={styles.audioBar}>
                <button
                    type="button"
                    className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ""}`}
                    onClick={onToggleListen}
                    title={isListening ? "Stop transcription" : "Start transcription"}
                >
                    {isListening ? <Mic size={14} /> : <MicOff size={14} />}
                </button>

                <WaveformVisualizer active={isListening} volume={volume} />

                <div className={styles.injectBadge}>
                    <span className={styles.injectIcon}>↳</span> Injecting <ArrowRight size={10} style={{ margin: '0 2px' }} /> AI
                </div>

                <div
                    className={styles.spacer}
                    style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '11px',
                        color: isListening ? 'var(--color-success)' : 'var(--color-text-secondary)',
                        padding: '0 8px',
                        direction: 'rtl',
                        cursor: finalText ? 'pointer' : 'default',
                    }}
                    onClick={() => finalText && setExpanded(!expanded)}
                    title={finalText || ""}
                >
                    <span style={{ direction: 'ltr', display: 'inline-block' }}>
                        {isListening && !finalText
                            ? "🎙 Listening..."
                            : (finalText || (isListening ? "" : "Click mic to start"))}
                    </span>
                </div>

                <div className={styles.chipGroup}>
                    <div
                        className={`${styles.chip} ${audioSource === "mic" ? styles.chipActive : ""}`}
                        onClick={() => setAudioSource("mic")}
                        title="Transcribe your microphone (always works)"
                    >
                        <Mic size={9} style={{ display: 'inline', marginRight: '2px' }} />
                        Mic
                    </div>
                    <div
                        className={`${styles.chip} ${audioSource === "meeting" ? styles.chipActive : ""}`}
                        onClick={() => setAudioSource("meeting")}
                        title={
                            !virtualDeviceFound
                                ? "System audio requires VB-Cable — click to see setup guide"
                                : !virtualDeviceIsDefault
                                ? "VB-Cable found but not default — click chip, then follow the warning below"
                                : "Transcribing system/meeting audio via " + (virtualDeviceLabel ?? "VB-Cable")
                        }
                        style={{ position: 'relative' }}
                    >
                        <Volume2 size={9} style={{ display: 'inline', marginRight: '2px' }} />
                        System
                        {audioSource === "meeting" && showSystemWarning && (
                            <span style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--color-warning)',
                                display: 'block',
                            }} />
                        )}
                    </div>
                </div>

                <div className={styles.modeToggle}>
                    <span>Inject</span>
                    <div
                        className={`${styles.switch} ${injectEnabled ? styles.switchOn : ""}`}
                        onClick={() => setInjectEnabled(!injectEnabled)}
                        title={injectEnabled ? "Injection ON" : "Injection OFF"}
                    />
                </div>

                <div className={styles.modeToggle}>
                    <span>Auto</span>
                    <div
                        className={`${styles.switch} ${autoSubmit ? styles.switchOn : ""}`}
                        onClick={() => setAutoSubmit(!autoSubmit)}
                    />
                </div>

                <div className={`${styles.statusDot} ${isListening ? styles.dotPulse : errorState !== "none" ? styles.dotError : ""}`} />
            </div>

            {/* System audio setup warning — shown when System chip is selected but VB-Cable isn't default */}
            {showSystemWarning && (
                <div style={{
                    position: 'absolute',
                    top: '82px',
                    left: 0,
                    right: 0,
                    background: 'rgba(180, 120, 0, 0.92)',
                    borderBottom: '1px solid rgba(255,200,0,0.3)',
                    color: 'white',
                    padding: '6px 12px',
                    fontSize: '11px',
                    zIndex: 'var(--z-toast)' as any,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    flexWrap: 'wrap',
                }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <strong>System audio not active</strong>
                        <br />
                        {getSystemWarningMessage()}
                        {virtualDeviceFound && !virtualDeviceIsDefault && (
                            <>
                                <br />
                                <span style={{ opacity: 0.9 }}>
                                    Fix: Open <strong>Sound Settings → Recording tab</strong>, right-click <strong>{virtualDeviceLabel ?? "CABLE Output"}</strong> → <strong>Set as Default Device</strong>.
                                </span>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={handleOpenSoundSettings}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '3px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Settings size={11} /> Open Sound Settings
                        </button>
                        <button
                            type="button"
                            onClick={() => setAudioSource("mic")}
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '3px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Use Mic Instead
                        </button>
                    </div>
                </div>
            )}

            {/* Mic permission error banner */}
            {errorState !== "none" && !showSystemWarning && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={12} style={{ marginRight: "4px", display: "inline", verticalAlign: "middle" }} />
                    {getErrorMessage()}
                    {errorState === "not-allowed" && (
                        <button
                            type="button"
                            onClick={handleOpenMicSettings}
                            style={{
                                marginLeft: "10px",
                                background: "rgba(255,255,255,0.2)",
                                border: "1px solid rgba(255,255,255,0.4)",
                                borderRadius: "4px",
                                color: "white",
                                padding: "2px 8px",
                                fontSize: "11px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            <Settings size={10} /> Fix in Settings
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onToggleListen}
                        style={{
                            marginLeft: "6px",
                            background: "rgba(255,255,255,0.2)",
                            border: "1px solid rgba(255,255,255,0.4)",
                            borderRadius: "4px",
                            color: "white",
                            padding: "2px 8px",
                            fontSize: "11px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <RefreshCw size={10} /> Retry
                    </button>
                </div>
            )}

            {/* Expanded transcription panel */}
            {expanded && finalText && (
                <div style={{
                    position: 'absolute',
                    top: showSystemWarning ? '130px' : '82px',
                    left: 0,
                    right: 0,
                    background: '#1a1a1a',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    padding: '8px 12px',
                    zIndex: 'var(--z-toast)' as any,
                    maxHeight: '120px',
                    overflowY: 'auto',
                }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Transcription (injected into AI):
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: '1.5', wordBreak: 'break-word' }}>
                        {finalText}
                    </div>
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        style={{ marginTop: '6px', fontSize: '10px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Close ✕
                    </button>
                </div>
            )}
        </>
    );
}
