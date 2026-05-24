import { ArrowLeft, ArrowRight, RotateCw, Settings, ChevronDown } from "lucide-react";
import { useSettingsStore } from "../../settings/index";
import styles from "./BrowserToolbar.module.css";

interface BrowserToolbarProps {
    onBack: () => void;
    onRefresh: () => void;
    onSwitchAI: (id: string) => void;
    onOpenSettings: () => void;
}

export default function BrowserToolbar({
    onBack,
    onRefresh,
    onSwitchAI,
    onOpenSettings,
}: BrowserToolbarProps) {
    const { providers, activeProviderId } = useSettingsStore();
    const activeProvider = providers.find((p) => p.id === activeProviderId);

    return (
        <div className={styles.toolbar}>
            <div className={styles.navGroup}>
                <button type="button" className={styles.btn} onClick={onBack} title="Back to Config">
                    <ArrowLeft size={16} />
                </button>
                <button type="button" className={styles.btn} disabled title="Forward">
                    <ArrowRight size={16} />
                </button>
                <button type="button" className={styles.btn} onClick={onRefresh} title="Refresh AI WebView">
                    <RotateCw size={16} />
                </button>
            </div>

            <div className={styles.urlBar} title={activeProvider?.url || ""}>
                {activeProvider?.url || "https://chat.openai.com"}
            </div>

            <div className={styles.selectWrap}>
                <select
                    className={styles.select}
                    value={activeProviderId || "chatgpt"}
                    onChange={(e) => onSwitchAI(e.target.value)}
                >
                    {providers.map((p) => (
                        <option key={p.id} value={p.id} style={{ background: "#2a2a2a", color: "white" }}>
                            {p.name}
                        </option>
                    ))}
                </select>
                <ChevronDown size={12} className={styles.selectIcon} />
            </div>

            <button type="button" className={styles.btn} onClick={onOpenSettings} title="Settings">
                <Settings size={16} />
            </button>
        </div>
    );
}
