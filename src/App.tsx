import { useState, useEffect, useCallback } from "react";
import "./App.css";
import OnboardingOverlay from "./components/OnboardingOverlay";
import EmptyState from "./components/EmptyState";

type AppScreen = "onboarding" | "main";

function App() {
  const [screen, setScreen] = useState<AppScreen>("onboarding");
  const [isVisible, setIsVisible] = useState(true);
  const [shortcut, setShortcut] = useState<string>("Ctrl+Shift+W");

  // Check if first run (skip onboarding if already completed)
  useEffect(() => {
    const completed = localStorage.getItem("whisper_onboarding_done");
    const savedShortcut = localStorage.getItem("whisper_shortcut");
    if (completed === "true") {
      setScreen("main");
    }
    if (savedShortcut) {
      setShortcut(savedShortcut);
    }
  }, []);

  // Dismiss on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && screen === "main") {
      setIsVisible(false);
      // In a real Tauri app: invoke("hide_window")
    }
  }, [screen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleOnboardingComplete = (savedShortcut: string) => {
    localStorage.setItem("whisper_onboarding_done", "true");
    localStorage.setItem("whisper_shortcut", savedShortcut);
    setShortcut(savedShortcut);
    setScreen("main");
  };

  const handleHide = () => {
    setIsVisible(false);
    // In production: invoke("hide_window")
  };

  const handleReset = () => {
    // For dev: reset onboarding
    localStorage.removeItem("whisper_onboarding_done");
    setScreen("onboarding");
    setIsVisible(true);
  };

  if (!isVisible) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Ghost dot persists even when "hidden" in dev mode */}
        <div className="ghost-dot" title="Whisper active — press shortcut to summon" />
        <button
          onClick={() => setIsVisible(true)}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "11px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Summon Whisper
        </button>
      </div>
    );
  }

  return (
    <div className="whisper-shell">
      <div className="ghost-dot" title="Whisper is shielded from screen capture" />
      {screen === "onboarding" ? (
        <OnboardingOverlay onComplete={handleOnboardingComplete} />
      ) : (
        <EmptyState shortcut={shortcut} onHide={handleHide} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
