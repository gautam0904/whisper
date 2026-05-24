import { useState } from "react";
import { Mic, MicOff, AlertCircle, ArrowRight } from "lucide-react";
import WaveformVisualizer from "./WaveformVisualizer";
import styles from "./AudioBar.module.css";
import { useOverlayStore } from "../../overlay/store/overlayStore";


interface AudioBarProps {
    isListening: boolean;
    volume: number;
    errorState: "none" | "not-allowed" | "network";
    onToggleListen: () => void;
}

export default function AudioBar({
    isListening,
    volume,
    errorState,
    onToggleListen,
}: AudioBarProps) {
    const [micActive, setMicActive] = useState(true);
    const [systemActive, setSystemActive] = useState(false);
    const { autoSubmit, setAutoSubmit } = useOverlayStore();

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

            <div className={styles.spacer} />

            <div className={styles.chipGroup}>
                <div
                    className={`${styles.chip} ${micActive ? styles.chipActive : ""}`}
                    onClick={() => setMicActive(!micActive)}
                >
                    Mic
                </div>
                <div
                    className={`${styles.chip} ${systemActive ? styles.chipActive : ""}`}
                    onClick={() => setSystemActive(!systemActive)}
                >
                    System
                </div>
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
                    {errorState === "not-allowed"
                        ? "Mic permission denied — click here to fix"
                        : "Offline — Google STT unavailable"}
                </div>
            )}
        </div>
    );
}
