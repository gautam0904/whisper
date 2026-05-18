import { useState, useEffect, useCallback } from "react";
import "./App.css";
import OnboardingOverlay from "./components/OnboardingOverlay";
import EmptyState from "./components/EmptyState";
import BrowserView from "./components/Browser/BrowserView";

export type AppScreen = "onboarding" | "main" | "browser";

function App() {
  const [screen, setScreen] = useState<AppScreen>("onboarding");
  const [isVisible, setIsVisible] = useState(true);
  const [shortcut, setShortcut] = useState<string>("Ctrl+Shift+W");

  useEffect(() => {
    const completed = localStorage.getItem("whisper_onboarding_done");
    const savedShortcut = localStorage.getItem("whisper_shortcut");
    if (completed === "true") setScreen("main");
    if (savedShortcut) setShortcut(savedShortcut);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && screen === "main") {
      setIsVisible(false);
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
  };

  const handleReset = () => {
    localStorage.removeItem("whisper_onboarding_done");
    setScreen("onboarding");
    setIsVisible(true);
  };

  if (!isVisible) {
    return (
      <div className="whisper-hidden-state">
        <div className="ghost-dot" title="Whisper active — press shortcut to summon" />
        <button className="summon-btn" onClick={() => setIsVisible(true)}>
          Summon Whisper
        </button>
      </div>
    );
  }

  return (
    <div className="whisper-shell">
      {screen !== "browser" && <div className="ghost-dot" title="Whisper is shielded from screen capture" />}
      {screen === "onboarding" && (
        <OnboardingOverlay onComplete={handleOnboardingComplete} />
      )}
      {screen === "main" && (
        <EmptyState
          shortcut={shortcut}
          onHide={handleHide}
          onReset={handleReset}
          onOpenBrowser={() => setScreen("browser")}
        />
      )}
      {screen === "browser" && (
        <BrowserView onClose={() => setScreen("main")} />
      )}
    </div>
  );
}

export default App;
