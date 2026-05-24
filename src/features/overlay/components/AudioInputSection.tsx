import { useEffect, useState, useRef } from "react";
import { Volume2, ChevronDown, ChevronUp, Mic, Users, CheckCircle, XCircle, AlertTriangle, Settings, Square, Search, Check, Loader2 } from "lucide-react";
import { useOverlayStore } from "../store/overlayStore";
import { invoke } from "@tauri-apps/api/core";
import styles from "./AudioInputSection.module.css";

export default function AudioInputSection() {
    const {
        audioSource,
        micDeviceName,
        virtualDriverInstalled,
        virtualDriverName,
        blackHoleSetupExpanded,
        setAudioSource,
        setMicDeviceName,
        setVirtualDriverInstalled,
        setVirtualDriverName,
        setBlackHoleSetupExpanded,
    } = useOverlayStore();

    const [testActive, setTestActive] = useState(false);
    const [testAmplitudes, setTestAmplitudes] = useState([3, 3, 3, 3, 3]);
    const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "configuring" | "done" | "error">("idle");
    const [progressMsg, setProgressMsg] = useState("");
    const animRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const queryDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter((d) => d.kind === "audioinput");
                const hasMic = audioInputs.length > 0;
                const defaultMic = audioInputs.find(
                    (d) =>
                        d.label &&
                        !d.label.includes("BlackHole") &&
                        !d.label.includes("VB-Audio") &&
                        !d.label.includes("VB-Cable"),
                );
                const label = defaultMic ? defaultMic.label : audioInputs[0]?.label || "MacBook Pro Microphone";
                const isMac = navigator.userAgent.toLowerCase().includes("mac");
                const driverName = isMac ? "BlackHole 2ch" : "VB-Cable";
                
                // Backend check for virtual driver instead of relying purely on navigator.mediaDevices (which might need permissions)
                const hasDriver = await invoke<boolean>("check_audio_driver").catch(() => false);

                setMicDeviceName(hasMic ? label : null);
                setVirtualDriverInstalled(hasDriver);
                setVirtualDriverName(driverName as any);
            } catch {
                setMicDeviceName("Default Microphone");
                setVirtualDriverInstalled(false);
            }
        };

        queryDevices();
        navigator.mediaDevices.addEventListener("devicechange", queryDevices);
        return () => navigator.mediaDevices.removeEventListener("devicechange", queryDevices);
    }, [setMicDeviceName, setVirtualDriverInstalled, setVirtualDriverName]);

    const handleAutoInstall = async () => {
        setInstallStatus("installing");
        setProgressMsg(`Step 1/3: Downloading ${virtualDriverName}...`);
        
        try {
            await invoke("install_audio_driver");
            
            setInstallStatus("configuring");
            setProgressMsg("Step 2/3: Installing...");
            await new Promise((r) => setTimeout(r, 2000));
            
            setProgressMsg("Step 3/3: Configuring audio routing...");
            await invoke("auto_configure_audio");
            
            setInstallStatus("done");
            setProgressMsg("✅ Done — Meeting Audio ready");
            setVirtualDriverInstalled(true);
            setAudioSource("meeting");
        } catch (e: any) {
            setInstallStatus("error");
            setProgressMsg(`❌ Failed: ${e}`);
        }
    };

    const handleAutoConfigure = async () => {
        setInstallStatus("configuring");
        setProgressMsg("Configuring audio routing...");
        try {
            await invoke("auto_configure_audio");
            setInstallStatus("done");
            setProgressMsg("🟢 Configured — capturing all system audio");
            setAudioSource("meeting");
        } catch (e: any) {
            setInstallStatus("error");
            setProgressMsg(`❌ Failed: ${e}`);
        }
    };

    const startTestAudio = async () => {
        if (testActive) {
            stopTestAudio();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 32;
            source.connect(analyser);
            analyserRef.current = analyser;
            setTestActive(true);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const update = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const amps = Array.from(dataArray.slice(0, 5)).map((val) => Math.max(3, (val / 255) * 18));
                setTestAmplitudes(amps);
                animRef.current = requestAnimationFrame(update);
            };
            update();
        } catch {
            setTestActive(false);
        }
    };

    const stopTestAudio = () => {
        setTestActive(false);
        setTestAmplitudes([3, 3, 3, 3, 3]);
        if (animRef.current) cancelAnimationFrame(animRef.current);
        if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) track.stop();
        }
        if (audioContextRef.current) audioContextRef.current.close();
    };

    useEffect(() => {
        return () => stopTestAudio();
    }, []);

    const handleSelectMic = () => {
        if (micDeviceName) {
            setAudioSource("mic");
        }
    };

    const handleSelectMeeting = () => {
        if (virtualDriverInstalled) {
            setAudioSource("meeting");
        } else {
            setBlackHoleSetupExpanded(true);
        }
    };

    return (
        <div className={styles.section}>
            <div className={styles.title}>
                <Volume2 size={18} color="var(--color-accent)" />
                <span>1. Audio Input Source</span>
            </div>
            <div className={styles.subtitle}>Select ONE audio channel to capture during the meeting:</div>

            <div className={styles.cardContainer}>
                <div className={`${styles.card} ${audioSource === "mic" ? styles.selectedCard : ""}`}>
                    <div className={styles.icon}><Mic size={24} /></div>
                    <div className={styles.cardTitle}>My Microphone</div>
                    <div className={styles.cardDesc}>Capture your own voice only</div>
                    <button
                        type="button"
                        className={`${styles.selectBtn} ${audioSource === "mic" ? styles.selectedBtn : ""}`}
                        disabled={!micDeviceName}
                        onClick={handleSelectMic}
                    >
                        {audioSource === "mic" ? "Selected" : "Select"}
                    </button>
                    <div className={styles.statusText}>
                        {micDeviceName ? (
                            <>
                                <span style={{ color: "var(--color-success)", display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Ready</span>
                            </>
                        ) : (
                            <span style={{ color: "var(--color-danger)", display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> No Mic Found</span>
                        )}
                    </div>
                    {micDeviceName && <div className={styles.deviceLabel}>{micDeviceName}</div>}
                </div>

                <div className={`${styles.card} ${audioSource === "meeting" ? styles.selectedCard : ""}`}>
                    <div className={styles.icon}><Users size={24} /></div>
                    <div className={styles.cardTitle}>Meeting Audio</div>
                    <div className={styles.cardDesc}>Capture system audio (Zoom, Meet, Teams)</div>
                    <div className={styles.deviceLabel} style={{ marginBottom: "8px" }}>Driver: {virtualDriverName || "BlackHole 2ch"}</div>
                    
                    {virtualDriverInstalled ? (
                        <>
                            <div className={styles.statusText} style={{ marginBottom: "8px" }}>
                                <span style={{ color: "var(--color-success)", display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={14} /> Ready
                                </span>
                            </div>
                            {installStatus !== "idle" && (
                                <div className={styles.progressLog} style={{ fontSize: "11px", marginBottom: "8px", color: installStatus === "error" ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
                                    {installStatus === "configuring" && <Loader2 size={10} className="spinner" style={{ display: "inline-block", marginRight: "4px" }} />}
                                    {progressMsg}
                                </div>
                            )}
                            <button
                                type="button"
                                className={styles.selectBtn}
                                onClick={handleAutoConfigure}
                                disabled={installStatus === "configuring"}
                            >
                                {installStatus === "configuring" ? "Configuring..." : "Auto-Configure"}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={styles.statusText} style={{ marginBottom: "8px" }}>
                                <span style={{ color: "var(--color-warning)", display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertTriangle size={14} /> Setup Needed
                                </span>
                            </div>
                            {installStatus !== "idle" && (
                                <div className={styles.progressLog} style={{ fontSize: "11px", marginBottom: "8px", color: installStatus === "error" ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
                                    {(installStatus === "installing" || installStatus === "configuring") && <Loader2 size={10} className="spinner" style={{ display: "inline-block", marginRight: "4px" }} />}
                                    {progressMsg}
                                </div>
                            )}
                            <button
                                type="button"
                                className={styles.selectBtn}
                                onClick={handleAutoInstall}
                                disabled={installStatus === "installing" || installStatus === "configuring"}
                            >
                                {installStatus === "installing" || installStatus === "configuring" ? "Installing..." : "Install & Configure Automatically"}
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        className={styles.setupBtn}
                        onClick={() => setBlackHoleSetupExpanded(!blackHoleSetupExpanded)}
                        style={{ marginTop: "12px" }}
                    >
                        <span>Manual Setup Info</span>
                        {blackHoleSetupExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                </div>
            </div>

            {blackHoleSetupExpanded && (
                <div className={styles.setupPanel}>
                    <div className={styles.setupTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Settings size={16} /> {virtualDriverName || "BlackHole 2ch"} Setup Guide</div>
                    <div className={styles.step}>
                        <strong>Step 1: Install Virtual Driver</strong>
                        {virtualDriverName === "BlackHole 2ch" ? (
                            <>
                                <div className={styles.codeBlock}>$ brew install blackhole-2ch</div>
                                <div style={{ marginTop: "4px" }}>
                                    Or download from:{" "}
                                    <a
                                        href="https://existential.audio/blackhole/"
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: "var(--color-accent)" }}
                                    >
                                        existential.audio/blackhole/
                                    </a>
                                </div>
                            </>
                        ) : (
                            <div>
                                Download and install VB-Cable from:{" "}
                                <a
                                    href="https://vb-audio.com/Cable/"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "var(--color-accent)" }}
                                >
                                    vb-audio.com/Cable/
                                </a>
                            </div>
                        )}
                    </div>
                    <div className={styles.step}>
                        <strong>Step 2: Configure System Audio Output</strong>
                        <div className={styles.infoBox}>
                            Route speaker output of Zoom/Teams/Meet and System Output to the virtual driver (e.g.{" "}
                            {virtualDriverName || "BlackHole 2ch"}), then select the virtual driver as your source.
                        </div>
                    </div>
                    <div className={styles.step}>
                        <strong>Step 3: Verify Connection</strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                            <button type="button" className={styles.selectBtn} style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={startTestAudio}>
                                {testActive ? <><Square size={14} /> Stop Test</> : <><Search size={14} /> Test Audio Capture</>}
                            </button>
                            {testActive && (
                                <div className={styles.testWaveform}>
                                    {testAmplitudes.map((h, i) => (
                                        <div
                                            key={i}
                                            className={styles.waveBar}
                                            style={{ height: `${h}px`, transition: "height 50ms ease" }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.setupActions}>
                        <button
                            type="button"
                            className={styles.selectBtn}
                            onClick={() => setBlackHoleSetupExpanded(false)}
                            style={{ background: "var(--color-success)", color: "var(--color-bg-dark)", border: "none" }}
                        >
                            <Check size={14} style={{ marginRight: '6px' }} /> I've completed setup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
