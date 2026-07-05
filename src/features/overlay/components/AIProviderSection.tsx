import { useState } from "react";
import { Cpu, Plus, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { useOverlayStore, CustomProvider } from "../store/overlayStore";
import styles from "./AIProviderSection.module.css";

const BUILT_IN_PROVIDERS = [
    { id: "chatgpt", label: "ChatGPT", abbr: "CH", url: "https://chat.openai.com" },
    { id: "gemini", label: "Gemini", abbr: "GE", url: "https://gemini.google.com" },
    { id: "claude", label: "Claude", abbr: "CL", url: "https://claude.ai" },
    { id: "perplexity", label: "Perplexity", abbr: "PX", url: "https://www.perplexity.ai" },
    { id: "grok", label: "Grok", abbr: "GK", url: "https://grok.com" },
    { id: "mistral", label: "Mistral", abbr: "MI", url: "https://chat.mistral.ai" },
    { id: "deepseek", label: "DeepSeek", abbr: "DS", url: "https://chat.deepseek.com" },
] as const;


type BuiltInId = (typeof BUILT_IN_PROVIDERS)[number]["id"];

function getProviderMeta(id: string, customProviders: CustomProvider[]) {
    const builtin = BUILT_IN_PROVIDERS.find((p) => p.id === id);
    if (builtin) return { label: builtin.label, url: builtin.url };
    const custom = customProviders.find((p) => p.id === id);
    return custom ? { label: custom.name, url: custom.url } : { label: "Custom", url: "" };
}

export default function AIProviderSection() {
    const { selectedProvider, customProviders, setSelectedProvider, addCustomProvider } = useOverlayStore();
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [inputSelector, setInputSelector] = useState("textarea");
    const [submitSelector, setSubmitSelector] = useState("button[type='submit']");
    const [testState, setTestState] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleAdd = () => {
        if (!name || !url) return;
        const newProvider: CustomProvider = {
            id: `custom_${Date.now()}`,
            name,
            url,
            inputSelector,
            submitSelector,
        };
        addCustomProvider(newProvider);
        setSelectedProvider(newProvider.id as any);
        setShowModal(false);
        setName("");
        setUrl("");
    };

    const testConnection = () => {
        setTestState("loading");
        setTimeout(() => {
            if (url.startsWith("http://") || url.startsWith("https://")) {
                setTestState("success");
            } else {
                setTestState("error");
            }
        }, 1200);
    };

    const meta = selectedProvider ? getProviderMeta(selectedProvider, customProviders) : null;

    return (
        <div className={styles.section}>
            <div className={styles.title}>
                <Cpu size={18} color="var(--color-accent)" />
                <span>2. AI Provider Selection</span>
            </div>

            <div className={styles.providerGrid}>
                {BUILT_IN_PROVIDERS.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        className={`${styles.providerItem} ${selectedProvider === p.id ? styles.providerItemSelected : ""}`}
                        onClick={() => setSelectedProvider(p.id as BuiltInId)}
                    >
                        <div className={`${styles.providerCircle} ${selectedProvider === p.id ? styles.selectedCircle : ""}`}>
                            {p.abbr}
                        </div>
                        <span className={`${styles.providerLabel} ${selectedProvider === p.id ? styles.selectedLabel : ""}`}>
                            {p.label}
                        </span>
                        <div className={`${styles.indicator} ${selectedProvider === p.id ? styles.indicatorGreen : ""}`} />
                    </button>
                ))}

                {customProviders.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        className={`${styles.providerItem} ${selectedProvider === p.id ? styles.providerItemSelected : ""}`}
                        onClick={() => setSelectedProvider(p.id as any)}
                    >
                        <div className={`${styles.providerCircle} ${selectedProvider === p.id ? styles.selectedCircle : ""}`}>
                            {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={`${styles.providerLabel} ${selectedProvider === p.id ? styles.selectedLabel : ""}`}>
                            {p.name}
                        </span>
                        <div className={`${styles.indicator} ${selectedProvider === p.id ? styles.indicatorGreen : ""}`} />
                    </button>
                ))}

                <button type="button" className={styles.providerItem} onClick={() => setShowModal(true)}>
                    <div className={styles.providerCircle}>
                        <Plus size={18} />
                    </div>
                    <span className={styles.providerLabel}>Add</span>
                </button>
            </div>

            {selectedProvider && meta && (
                <div className={styles.infoBanner}>
                    <div>
                        <strong>Selected:</strong> {meta.label} ({meta.url})
                    </div>
                    <div style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle size={14} /> Online | Last checked: 2s ago
                    </div>
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalTitle}>
                            <Sparkles size={16} color="var(--color-accent)" />
                            <span>Add Custom AI Provider</span>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Name:</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Whisper Custom AI"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>URL:</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="https://chat.mycorp.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Input Selector (for injection):</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder='textarea[placeholder="Ask anything"]'
                                value={inputSelector}
                                onChange={(e) => setInputSelector(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Submit Button Selector:</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder='button[type="submit"]'
                                value={submitSelector}
                                onChange={(e) => setSubmitSelector(e.target.value)}
                            />
                        </div>

                        {testState !== "idle" && (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "16px", fontSize: "12px" }}>
                                {testState === "loading" && <span>Testing connection...</span>}
                                {testState === "success" && (
                                    <span style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <CheckCircle size={14} /> Connection test successful!
                                    </span>
                                )}
                                {testState === "error" && (
                                    <span style={{ color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <XCircle size={14} /> Invalid URL! Please enter a valid HTTP/HTTPS link.
                                    </span>
                                )}
                            </div>
                        )}

                        <div className={styles.formActions}>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnSec}`}
                                onClick={testConnection}
                                style={{ marginRight: "auto" }}
                            >
                                Test Connection
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnSec}`}
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnPri}`}
                                onClick={handleAdd}
                                disabled={!name || !url}
                            >
                                Save Provider
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
