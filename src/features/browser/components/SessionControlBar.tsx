import { ArrowLeft, RotateCw, Globe, Square, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useSettingsStore } from "../../settings/index";
import styles from "./SessionControlBar.module.css";

interface SessionControlBarProps {
    onBack: () => void;
    onRefresh: () => void;
    onStop: () => void;
    onSwitchAI: (providerId: string) => void;
}

export default function SessionControlBar({ onBack, onRefresh, onStop, onSwitchAI }: SessionControlBarProps) {
    const { providers, activeProviderId } = useSettingsStore();
    const [showDropdown, setShowDropdown] = useState(false);

    const activeProvider = providers.find(p => p.id === activeProviderId);

    return (
        <div className={styles.controlBar}>
            <div className={styles.noDrag}>
                <button type="button" className={styles.ctrlBtn} onClick={onBack} title="Back to Configure">
                    <ArrowLeft size={14} />
                    Back
                </button>

                <button type="button" className={styles.ctrlBtn} onClick={onRefresh} title="Refresh AI Page">
                    <RotateCw size={14} />
                </button>

                <div className={styles.aiSwitcher}>
                    <button
                        type="button"
                        className={styles.ctrlBtn}
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <Globe size={14} />
                        {activeProvider?.name || "Select AI"}
                        <ChevronDown size={12} />
                    </button>
                    {showDropdown && (
                        <div className={styles.dropdownMenu}>
                            {providers.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    className={`${styles.dropdownItem} ${p.id === activeProviderId ? styles.dropdownItemActive : ""}`}
                                    onClick={() => {
                                        onSwitchAI(p.id);
                                        setShowDropdown(false);
                                    }}
                                >
                                    {p.id === activeProviderId && <span className={styles.dropdownDot} />}
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.spacer} />

                <div className={styles.statusPills}>
                </div>

                <button type="button" className={styles.stopBtn} onClick={onStop} title="Stop & Return">
                    <Square size={12} />
                    Stop
                </button>
            </div>
        </div>
    );
}
