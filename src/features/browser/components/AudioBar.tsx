import { Mic, MicOff, AlertCircle, ArrowRight } from "lucide-react";
import WaveformVisualizer from "./WaveformVisualizer";
import styles from "./AudioBar.module.css";
import { useOverlayStore } from "../../overlay/store/overlayStore";


interface AudioBarProps {
    isListening: boolean;
    volume: number;
    errorState: "none" | "not-allowed" | "network" | "unavailable" | "no-speech";
    errorMessage?: string;
    finalText?: string;
    onToggleListen: () => void;
}

export default function AudioBar({
    isListening,
    volume,
    errorState,
    errorMessage,
    finalText,
    onToggleListen,
}: AudioBarProps) {
    const { audioSource, setAudioSource, autoSubmit, setAutoSubmit, injectEnabled, setInjectEnabled } = useOverlayStore();

    const getErrorMessage = () => {
        if (errorMessage) return errorMessage;
        if (errorState === "not-allowed") return "Mic permission denied — grant access in System Settings > Privacy > Speech Recognition";
        if (errorState === "network") return "Network error — check your internet connection";
        if (errorState === "unavailable") return "Speech recognition unavailable";
        if (errorState === "no-speech") return "No speech detected — check your mic in System Settings";
        return "";
    };

    return (
        <div className={styles.audioBar}>
            <button
                type="button"
                className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ""}`}
                onClick={onToggleListen}
                title={isListening ? "Mute Microphone" : "Unmute Microphone"}
            >
                {isListening ? <Mic size={14} /> : <MicOff size={14} />}
            </button>

            <WaveformVisualizer active={isListening} volume={volume} />

            <div className={styles.injectBadge}>
                <span className={styles.injectIcon}>↳</span> Injecting <ArrowRight size={10} style={{ margin: '0 2px' }} /> AI
            </div>

            <div className={styles.spacer} style={{ 
                flex: 1, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                padding: '0 12px',
                direction: 'rtl' /* keeps the end of the string visible */
            }}>
                <span style={{ direction: 'ltr', display: 'inline-block' }}>
                    {isListening && !finalText ? "Listening..." : (finalText || "")}
                </span>
            </div>

            <div className={styles.chipGroup}>
                <div
                    className={`${styles.chip} ${audioSource === "mic" ? styles.chipActive : ""}`}
                    onClick={() => setAudioSource("mic")}
                >
                    Mic
                </div>
                <div
                    className={`${styles.chip} ${audioSource === "meeting" ? styles.chipActive : ""}`}
                    onClick={() => setAudioSource("meeting")}
                >
                    System
                </div>
            </div>

            <div className={styles.modeToggle}>
                <span>Inject</span>
                <div
                    className={`${styles.switch} ${injectEnabled ? styles.switchOn : ""}`}
                    onClick={() => setInjectEnabled(!injectEnabled)}
                    title={injectEnabled ? "Injection ON — speech will be appended to AI input" : "Injection OFF — speech will not be sent to AI"}
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

            {errorState !== "none" && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={12} style={{ marginRight: "4px", display: "inline" }} />
                    {getErrorMessage()}
                </div>
            )}
        </div>
    );
}
