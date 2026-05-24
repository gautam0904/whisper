import { useState } from "react";
import { X, Mic, Volume2, Globe } from "lucide-react";
import { useAppStore, APP_SCREEN } from "../../../shared/stores/appStore";
import { useSettingsStore, AIProvider } from "../index";
import { useOverlayStore } from "../../overlay/store/overlayStore";
import { invoke } from "@tauri-apps/api/core";
import styles from "./SettingsPanel.module.css";

type Tab = "sources" | "voice" | "chatgpt" | "gemini" | "deepseek" | "google";

export default function SettingsPanel() {
    const setScreen = useAppStore((s) => s.setScreen);
    const { providers, updateProvider } = useSettingsStore();
    const {
        audioSource,
        micDeviceName,
        autoSubmit,
        setAudioSource,
        setAutoSubmit,
    } = useOverlayStore();

    const [activeTab, setActiveTab] = useState<Tab>("sources");
    const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
    const [autoStopOnMute, setAutoStopOnMute] = useState(true);
    const [sttEngine, setSttEngine] = useState("webspeech");
    const [testState, setTestState] = useState("");

    const handleAITabClick = (tab: Tab) => {
        setActiveTab(tab);
    };

    const handleUrlChange = (id: string, url: string) => {
        updateProvider(id, { url });
    };

    const handleSelectorChange = (id: string, field: "inputSelector" | "submitSelector", val: string) => {
        updateProvider(id, { [field]: val } as any);
    };

    const triggerTestInjection = async (p: AIProvider) => {
        setTestState("loading");
        try {
            await invoke("inject_text", {
                text: 'QUESTION: "Hello! This is a test caption from Whisper."',
                inputSelector: (p as any).inputSelector || undefined,
                submitSelector: (p as any).submitSelector || undefined,
                autoSubmit: true,
            });
            setTestState("success");
            setTimeout(() => setTestState(""), 2000);
        } catch {
            setTestState("error");
            setTimeout(() => setTestState(""), 2000);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>Audio</div>
                <button
                    type="button"
                    className={`${styles.sidebarItem} ${activeTab === "sources" ? styles.sidebarItemActive : ""}`}
                    onClick={() => setActiveTab("sources")}
                >
                    <Volume2 size={14} />
                    <span>Input Sources</span>
                </button>
                <button
                    type="button"
                    className={`${styles.sidebarItem} ${activeTab === "voice" ? styles.sidebarItemActive : ""}`}
                    onClick={() => setActiveTab("voice")}
                >
                    <Mic size={14} />
                    <span>Voice Settings</span>
                </button>

                <div className={styles.sidebarHeader}>AI Sites</div>
                {providers.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        className={`${styles.sidebarItem} ${activeTab === p.id ? styles.sidebarItemActive : ""}`}
                        onClick={() => handleAITabClick(p.id as Tab)}
                    >
                        <Globe size={14} />
                        <span>{p.name}</span>
                    </button>
                ))}
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Settings</h2>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={() => setScreen(APP_SCREEN.MAIN)}
                        aria-label="Close settings"
                    >
                        <X size={20} />
                    </button>
                </div>

                {activeTab === "sources" && (
                    <div className={styles.section}>
                        <div className={styles.row}>
                            <div className={styles.rowHeader}>
                                <div>
                                    <div className={styles.label}>Microphone Toggle</div>
                                    <div className={styles.subLabel}>{micDeviceName || "Default Microphone"}</div>
                                </div>
                                <div
                                    className={`${styles.switch} ${audioSource === "mic" ? styles.switchActive : ""}`}
                                    onClick={() => setAudioSource(audioSource === "mic" ? null : "mic")}
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.rowHeader}>
                                <div>
                                    <div className={styles.label}>System Audio Capture</div>
                                    <div className={styles.subLabel}>(captures calls and meetings)</div>
                                </div>
                                <div
                                    className={`${styles.switch} ${audioSource === "meeting" ? styles.switchActive : ""}`}
                                    onClick={() => setAudioSource(audioSource === "meeting" ? null : "meeting")}
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <label className={styles.label}>STT Engine</label>
                            <select className={styles.select} value={sttEngine} onChange={(e) => setSttEngine(e.target.value)}>
                                <option value="webspeech">Web Speech API (Google)</option>
                                <option value="deepgram">Deepgram</option>
                                <option value="vosk">Vosk (Offline)</option>
                            </select>
                            {sttEngine !== "webspeech" && <span className={styles.badge}>Coming soon</span>}
                        </div>
                    </div>
                )}

                {activeTab === "voice" && (
                    <div className={styles.section}>
                        <div className={styles.row}>
                            <label className={styles.label}>Language Selector</label>
                            <select
                                className={styles.select}
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                            >
                                <option value="en-IN">English India</option>
                                <option value="en-US">English US</option>
                                <option value="hi-IN">Hindi</option>
                                <option value="gu-IN">Gujarati</option>
                                <option value="auto">Auto-Detect</option>
                            </select>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.rowHeader}>
                                <div>
                                    <div className={styles.label}>Auto-stop on Mute</div>
                                    <div className={styles.subLabel}>Stop STT if OS mutes the hardware mic</div>
                                </div>
                                <div
                                    className={`${styles.switch} ${autoStopOnMute ? styles.switchActive : ""}`}
                                    onClick={() => setAutoStopOnMute(!autoStopOnMute)}
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.rowHeader}>
                                <div>
                                    <div className={styles.label}>Auto-Submit Captures</div>
                                    <div className={styles.subLabel}>Inject and send automatically after 2s of silence</div>
                                </div>
                                <div
                                    className={`${styles.switch} ${autoSubmit ? styles.switchActive : ""}`}
                                    onClick={() => setAutoSubmit(!autoSubmit)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {providers.map((p) => {
                    if (activeTab !== p.id) return null;
                    return (
                        <div key={p.id} className={styles.section}>
                            <div className={styles.row}>
                                <label className={styles.label}>AI Site URL</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={p.url}
                                    onChange={(e) => handleUrlChange(p.id, e.target.value)}
                                />
                            </div>

                            <div className={styles.row}>
                                <label className={styles.label}>Text Input CSS Selector (Optional)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="textarea, [contenteditable='true']"
                                    value={(p as any).inputSelector || ""}
                                    onChange={(e) => handleSelectorChange(p.id, "inputSelector", e.target.value)}
                                />
                            </div>

                            <div className={styles.row}>
                                <label className={styles.label}>Submit Button CSS Selector (Optional)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="button[type='submit']"
                                    value={(p as any).submitSelector || ""}
                                    onChange={(e) => handleSelectorChange(p.id, "submitSelector", e.target.value)}
                                />
                            </div>

                            <button type="button" className={styles.btn} onClick={() => triggerTestInjection(p)}>
                                {testState === "loading" ? "Injecting..." : testState === "success" ? "Success!" : testState === "error" ? "Failed" : "Test Injection"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
