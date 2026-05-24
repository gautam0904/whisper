import { Plus } from "lucide-react";
import { useSettingsStore } from "../../settings/index";
import styles from "./AIProviderOrbit.module.css";

interface AIProviderOrbitProps {
    onManageProviders?: () => void;
}

export default function AIProviderOrbit({ onManageProviders }: AIProviderOrbitProps) {
    const { providers, activeProviderId, setActiveProvider } = useSettingsStore();

    return (
        <div className={styles.orbit}>
            <span className={styles.orbitLabel}>Send To AI</span>
            <div className={styles.providerRow}>
                {providers.map((p) => {
                    const isSelected = activeProviderId === p.id;
                    return (
                        <button
                            key={p.id}
                            type="button"
                            className={styles.providerItem}
                            onClick={() => setActiveProvider(p.id)}
                        >
                            <div className={`${styles.providerCircle} ${isSelected ? styles.selectedCircle : ""}`}>
                                {p.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className={`${styles.providerName} ${isSelected ? styles.selectedLabel : ""}`}>
                                {isSelected ? "Selected" : p.name}
                            </span>
                        </button>
                    );
                })}

                {onManageProviders && (
                    <button
                        type="button"
                        className={styles.addBtn}
                        onClick={onManageProviders}
                        title="Add AI Provider"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
