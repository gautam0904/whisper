import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, Ban, Circle, Lightbulb } from "lucide-react";

interface Props {
  onComplete: (shortcut: string) => void;
}

type TestState = "idle" | "testing" | "passed" | "failed";
type ShortcutStatus = "waiting" | "captured" | "conflict";

const KNOWN_CONFLICTS: Record<string, string> = {
  "Ctrl+Shift+S": "Zoom's stop share",
  "Ctrl+Shift+A": "Zoom's mute toggle",
  "Ctrl+Shift+V": "Zoom's start video",
  "Ctrl+Z": "Undo (system-wide)",
  "Ctrl+C": "Copy (system-wide)",
  "Ctrl+V": "Paste (system-wide)",
  "Meta+Space": "Spotlight / Windows search",
  "Ctrl+Alt+Delete": "System reserved",
};

const STEPS = ["Intro", "Proof", "Live Test", "Shortcut", "Done"];

export default function OnboardingOverlay({ onComplete }: Props) {
  const [testState, setTestState] = useState<TestState>("idle");
  const [shortcutStatus, setShortcutStatus] = useState<ShortcutStatus>("waiting");
  const [capturedKeys, setCapturedKeys] = useState<string[]>([]);
  const [capturedCombo, setCapturedCombo] = useState<string>("");
  const [conflictApp, setConflictApp] = useState<string>("");
  const [isShaking, setIsShaking] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const isCaptureActive = useRef(false);

  const formatKeyCombo = (keys: string[]): string => keys.join("+");

  const buildKeyList = (e: KeyboardEvent): string[] => {
    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) keys.push(e.ctrlKey ? "Ctrl" : "⌘");
    if (e.altKey) keys.push("Alt");
    if (e.shiftKey) keys.push("Shift");
    const mainKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (!["Control", "Shift", "Alt", "Meta", "Escape"].includes(e.key)) {
      keys.push(mainKey);
    }
    return keys;
  };

  const handleCaptureKey = useCallback((e: KeyboardEvent) => {
    if (!isCaptureActive.current) return;
    e.preventDefault();
    if (e.key === "Escape") return;

    const keys = buildKeyList(e);
    if (keys.length < 2) return;

    const combo = formatKeyCombo(keys);
    setCapturedKeys(keys);
    setCapturedCombo(combo);

    const conflict = KNOWN_CONFLICTS[combo];
    if (conflict) {
      setShortcutStatus("conflict");
      setConflictApp(conflict);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } else {
      setShortcutStatus("captured");
      setConflictApp("");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleCaptureKey);
    return () => window.removeEventListener("keydown", handleCaptureKey);
  }, [handleCaptureKey]);

  const activateCapture = () => {
    isCaptureActive.current = true;
    captureRef.current?.focus();
  };

  const useDefaultShortcut = () => {
    setCapturedKeys(["Ctrl", "Shift", "W"]);
    setCapturedCombo("Ctrl+Shift+W");
    setShortcutStatus("captured");
    setConflictApp("");
  };

  const handleContinue = () => {
    const finalShortcut = capturedCombo || "Ctrl+Shift+W";
    onComplete(finalShortcut);
  };

  const canContinue =
    shortcutStatus === "captured" &&
    (testState === "passed" || testState === "idle" || testState === "failed");

  const currentStep = Math.min(
    testState === "testing" || testState === "passed" || testState === "failed" ? 2 :
    shortcutStatus === "captured" ? 3 : 1,
    4
  );

  return (
    <>
      {testState === "testing" && (
        <div className="test-pattern">
          <div className="test-pattern-title">
            IF YOU SEE THIS IN ZOOM/MEET,<br />SCREEN SHARE IS NOT EXCLUDED
          </div>
          <div className="test-pattern-sub">
            Open Zoom → Share your entire screen → Look at the preview.<br />
            Do you see this bright green window?
          </div>
          <div className="test-result-btns">
            <button className="test-result-btn" onClick={() => setTestState("failed")}>
              Yes, I see it
            </button>
            <button className="test-result-btn" onClick={() => setTestState("passed")}>
              No, just my desktop
            </button>
          </div>
        </div>
      )}

      <div className="glass-card onboarding-overlay">
        <div
          className="drag-handle"
          data-tauri-drag-region
          title="Drag to move Whisper"
        >
          <div className="drag-handle-dots">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="drag-handle-dot" />
            ))}
          </div>
        </div>

        <div className="step-dots" role="progressbar" aria-valuenow={currentStep} aria-valuemax={4}>
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`step-dot ${i === currentStep ? "active" : i < currentStep ? "completed" : ""}`}
              title={label}
            />
          ))}
        </div>

        <div className="onboarding-header">
          <div className="app-icon-wrap">
            <svg
              className="app-icon-svg"
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M11 14.5C11 11.46 13.46 9 16.5 9H19.5C22.54 9 25 11.46 25 14.5C25 17.54 22.54 20 19.5 20H18L14 24V20C12.34 20 11 18.66 11 17V14.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="onboarding-title">Whisper</h1>
          <p className="onboarding-subtitle">
            Your invisible typing layer — hidden from Zoom, Teams, and Google Meet.<br />
            No audio. No recording. Just text only you can see.
          </p>
        </div>

        <div className="split-proof" aria-label="Invisibility demonstration">
          <div className="proof-card you-see">
            <div className="proof-label you">
              <Eye size={13} /> You see
            </div>
            <div className="proof-screen visible-window">
              <div className="proof-window-inner">
                <div className="proof-window-title">WHISPER</div>
                <div className="proof-window-cursor" />
              </div>
            </div>
            <div className="proof-caption">Full color, sharp text</div>
          </div>

          <div className="proof-card they-see">
            <div className="proof-label they">
              <Ban size={13} /> They see
            </div>
            <div className="proof-screen empty-window">
              Your desktop only — no window visible
            </div>
            <div className="proof-caption">Whisper is completely absent</div>
          </div>
        </div>

        <p className="proof-tagline">
          "This window is invisible to screen sharing — even full-desktop capture"
        </p>

        <div className="live-test-section">
          {testState === "idle" && (
            <button
              id="live-test-btn"
              className="live-test-btn"
              onClick={() => setTestState("testing")}
              aria-label="Run live invisibility test"
            >
              <Circle size={12} className="live-test-dot" />
              Live Test — Verify with your meeting app right now
            </button>
          )}
          {testState === "passed" && (
            <>
              <button className="live-test-btn success" disabled>
                Verified Invisible — screen share can't see this window
              </button>
              <div className="test-feedback success">
                Your OS correctly excludes this window from all capture. You're protected.
              </div>
            </>
          )}
          {testState === "failed" && (
            <>
              <button className="live-test-btn fail" disabled>
                Fallback Mode — Share a single app window instead
              </button>
              <div className="test-feedback fail">
                Your OS allows full-desktop capture of this window. Fix: In Zoom, choose
                "Share Window" instead of "Share Entire Screen" — then only the specific app
                you share will be visible. Whisper will remain hidden.
              </div>
            </>
          )}
        </div>

        <div className="shortcut-section">
          <div className="section-label">Set Your Ghost Key</div>
          <div
            className="shortcut-capture-area"
            ref={captureRef}
            tabIndex={0}
            onClick={activateCapture}
            onFocus={activateCapture}
            role="button"
            aria-label="Press your shortcut key combination here"
          >
            <div className={`shortcut-keys-row ${isShaking ? "shake-keycap" : ""}`}>
              {capturedKeys.length === 0 ? (
                <span className="shortcut-placeholder">Click here, then press your shortcut…</span>
              ) : (
                capturedKeys.map((key, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className={`keycap ${shortcutStatus === "conflict" ? "conflict" : shortcutStatus === "captured" ? "confirmed" : ""}`}>
                      {key}
                    </span>
                    {i < capturedKeys.length - 1 && <span className="key-plus">+</span>}
                  </span>
                ))
              )}
            </div>

            {shortcutStatus === "waiting" && capturedKeys.length === 0 && (
              <div className="shortcut-status waiting">Waiting for key combo…</div>
            )}
            {shortcutStatus === "captured" && (
              <div className="shortcut-status available">Available — no conflicts detected</div>
            )}
            {shortcutStatus === "conflict" && (
              <div className="shortcut-status conflict">
                Conflicts with {conflictApp}. Try Ctrl+Shift+W instead.
              </div>
            )}

            <div className="shortcut-hint">
              Recommended: Ctrl + Shift + W — &nbsp;
              <span
                style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
                onClick={(e) => { e.stopPropagation(); useDefaultShortcut(); }}
              >
                Use this
              </span>
            </div>
          </div>
        </div>

        <div className="confirm-btn-wrap">
          <button
            id="start-whisper-btn"
            className="confirm-btn"
            onClick={handleContinue}
            disabled={!canContinue}
            aria-disabled={!canContinue}
          >
            {canContinue ? "Start Using Whisper →" : "Set your shortcut to continue"}
          </button>
        </div>

        <p className="trust-note">
          <strong>No audio. No recording. No microphone required.</strong><br />
          We never access your mic. This is a typing-only tool.<br />
          <Lightbulb size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          <span>Tip: Keep ChatGPT or Gemini open in your normal browser — type here, read answers there.</span>
        </p>
      </div>
    </>
  );
}
