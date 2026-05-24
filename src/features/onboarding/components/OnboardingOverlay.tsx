import { Lightbulb } from "lucide-react";
import { useRef, useState } from "react";
import {
    SHORTCUT_STATUS,
    useShortcutCapture,
} from "../hooks/useShortcutCapture";
import { useOnboardingStore } from "../store/onboardingStore";
import styles from "./OnboardingOverlay.module.css";
import { ProofSection } from "./ProofSection";
import {
    LiveTestButtons,
    LiveTestPattern,
    TEST_STATE,
    type TestState,
} from "./LiveTest";
import { ShortcutCaptureSection } from "./ShortcutCaptureSection";

const STEPS = ["Intro", "Proof", "Live Test", "Shortcut", "Done"];

interface OnboardingOverlayProps {
    onComplete: (shortcut: string) => void;
}

export default function OnboardingOverlay({
    onComplete,
}: OnboardingOverlayProps) {
    const [testState, setTestState] = useState<TestState>(TEST_STATE.IDLE);
    const captureRef = useRef<HTMLDivElement>(null);
    const setShortcut = useOnboardingStore((s) => s.setShortcut);
    const {
        capturedKeys,
        capturedCombo,
        shortcutStatus,
        conflictApp,
        isShaking,
        activateCapture,
        applyDefault,
    } = useShortcutCapture();

    const canContinue =
        shortcutStatus === SHORTCUT_STATUS.CAPTURED &&
        testState !== TEST_STATE.TESTING;

    const currentStep = Math.min(
        testState === TEST_STATE.TESTING ||
            testState === TEST_STATE.PASSED ||
            testState === TEST_STATE.FAILED
            ? 2
            : shortcutStatus === SHORTCUT_STATUS.CAPTURED
                ? 3
                : 1,
        4,
    );

    const handleContinue = () => {
        const final = capturedCombo || "Ctrl+Shift+W";
        setShortcut(final);
        onComplete(final);
    };

    const keyCapStatus =
        shortcutStatus === SHORTCUT_STATUS.CONFLICT
            ? "conflict"
            : shortcutStatus === SHORTCUT_STATUS.CAPTURED
                ? "confirmed"
                : "default";

    const handleActivate = () => {
        activateCapture();
        captureRef.current?.focus();
    };

    return (
        <>
            <LiveTestPattern testState={testState} setTestState={setTestState} />

            <div className={`glass-card glass-noise ${styles.overlay}`}>
                <div
                    className="drag-handle"
                    data-tauri-drag-region
                    title="Drag to move Whisper"
                >
                    <div className="drag-handle-dots">
                        {["d1", "d2", "d3", "d4", "d5", "d6"].map((id) => (
                            <div key={id} className="drag-handle-dot" />
                        ))}
                    </div>
                </div>

                <div
                    className="d-flex justify-content-center gap-2 mt-2 mb-4"
                    role="progressbar"
                    aria-valuenow={currentStep}
                    aria-valuemax={4}
                >
                    {STEPS.map((label, i) => (
                        <div
                            key={label}
                            className={`${styles.stepDot} ${i === currentStep ? styles.active : i < currentStep ? styles.completed : ""}`}
                            title={label}
                        />
                    ))}
                </div>

                <header className="text-center mb-4">
                    <div
                        className={`d-flex justify-content-center mb-2 ${styles.iconWrap}`}
                        aria-hidden="true"
                    >
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <title>Loading indicator</title>
                            <circle
                                cx="18"
                                cy="18"
                                r="16"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <path
                                d="M11 14.5C11 11.46 13.46 9 16.5 9H19.5C22.54 9 25 11.46 25 14.5C25 17.54 22.54 20 19.5 20H18L14 24V20C12.34 20 11 18.66 11 17V14.5Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <h1 className="text-[clamp(18px,2.5vw,26px)] font-semibold text-[var(--color-text-primary)] tracking-[-0.3px] mb-[6px]">
                        Whisper
                    </h1>
                    <p className="text-[clamp(11px,1.2vw,13px)] text-[var(--color-text-secondary)] leading-normal">
                        Your invisible typing layer — hidden from Zoom, Teams, and Google
                        Meet.
                        <br />
                        No audio. No recording. Just text only you can see.
                    </p>
                </header>

                <ProofSection />
                <p className={`text-center mb-4 ${styles.proofTagline}`}>
                    "This window is invisible to screen sharing — even full-desktop
                    capture"
                </p>

                <LiveTestButtons testState={testState} setTestState={setTestState} />

                <ShortcutCaptureSection
                    capturedKeys={capturedKeys}
                    shortcutStatus={shortcutStatus}
                    conflictApp={conflictApp}
                    isShaking={isShaking}
                    captureRef={captureRef}
                    handleActivate={handleActivate}
                    applyDefault={applyDefault}
                    keyCapStatus={keyCapStatus}
                />

                <button
                    type="button"
                    id="start-whisper-btn"
                    className={`w-100 mb-3 ${styles.confirmBtn}`}
                    onClick={handleContinue}
                    disabled={!canContinue}
                    aria-disabled={!canContinue}
                >
                    {canContinue
                        ? "Start Using Whisper →"
                        : "Set your shortcut to continue"}
                </button>

                <p className="text-[11px] text-[var(--color-text-muted)] leading-normal text-center">
                    <strong className="text-[var(--color-text-secondary)]">
                        No audio. No recording. No microphone required.
                    </strong>
                    <br />
                    <Lightbulb
                        size={12}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: 4,
                        }}
                    />
                    <span>
                        Tip: Keep ChatGPT or Gemini open in your browser — type here, read
                        answers there.
                    </span>
                </p>
            </div>
        </>
    );
}
