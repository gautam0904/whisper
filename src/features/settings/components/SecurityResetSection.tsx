import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ShieldCheck, Volume2, Keyboard, MonitorOff, Lock } from "lucide-react";
import styles from "./SecurityResetSection.module.css";

interface CheckItem {
    icon: React.ReactNode;
    label: string;
    note: string;
    color: string;
}

const RESET_ITEMS: CheckItem[] = [
    {
        icon: <Volume2 size={15} />,
        label: "Audio output device restored",
        note: "System audio output reverts to the device active before launch",
        color: "var(--color-success)",
    },
    {
        icon: <Keyboard size={15} />,
        label: "Global shortcuts unregistered",
        note: "All OS-level hotkeys registered by this app are released",
        color: "var(--color-success)",
    },
    {
        icon: <MonitorOff size={15} />,
        label: "Screen-capture exclusion lifted",
        note: "NSWindowSharingNone is removed automatically when the window closes",
        color: "var(--color-success)",
    },
];

const RETAINED_ITEMS: CheckItem[] = [
    {
        icon: <Lock size={15} />,
        label: "Microphone permission retained",
        note: "macOS controls this — revoke manually in System Preferences if desired",
        color: "var(--color-text-muted)",
    },
];

export default function SecurityResetSection() {
    const [originalDevice, setOriginalDevice] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        invoke<string>("get_original_audio_device")
            .then((device) => {
                setOriginalDevice(device || null);
            })
            .catch(() => {
                setOriginalDevice(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <span className={styles.badge}>
                    <ShieldCheck size={12} />
                    Auto-Reset on Quit
                </span>
                <span className={styles.title}>OS Cleanup Guarantee</span>
            </div>

            <p className={styles.subtitle}>
                Every OS-level change made this session is automatically undone when the
                app exits — including force-quit. No trace left behind.
            </p>

            <div className={styles.deviceRow}>
                <Volume2 size={16} className={styles.deviceIcon} />
                <div className={styles.deviceInfo}>
                    <div className={styles.deviceLabel}>Will restore audio to</div>
                    <div
                        className={`${styles.deviceName} ${
                            loading ? styles.deviceNameLoading : ""
                        }`}
                    >
                        {loading
                            ? "Detecting…"
                            : originalDevice ?? "Not available on this platform"}
                    </div>
                </div>
            </div>

            <hr className={styles.divider} />

            <div className={styles.checklist}>
                {RESET_ITEMS.map((item) => (
                    <div key={item.label} className={styles.checkRow}>
                        <span className={styles.checkIcon} style={{ color: item.color }}>
                            {item.icon}
                        </span>
                        <div>
                            <div className={styles.checkLabel}>{item.label}</div>
                            <div className={styles.checkNote}>{item.note}</div>
                        </div>
                    </div>
                ))}

                <hr className={styles.divider} />

                {RETAINED_ITEMS.map((item) => (
                    <div key={item.label} className={styles.checkRow}>
                        <span className={styles.checkIcon} style={{ color: item.color }}>
                            {item.icon}
                        </span>
                        <div>
                            <div
                                className={styles.checkLabel}
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                {item.label}
                            </div>
                            <div className={styles.checkNote}>{item.note}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.mandatoryNote}>
                <ShieldCheck size={12} />
                This protection is always active and cannot be disabled.
            </div>
        </div>
    );
}
