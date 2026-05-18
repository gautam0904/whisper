import { useState, useRef, useEffect, useCallback } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

interface Props {
  shortcut: string;
  onHide: () => void;
  onReset: () => void;
}

export default function EmptyState({ shortcut, onHide, onReset }: Props) {
  const [text, setText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [opacity, setOpacity] = useState(72);
  const [fontSize, setFontSize] = useState(18);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Native drag — must fire synchronously in the same tick as mousedown
  useEffect(() => {
    const el = dragHandleRef.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      getCurrentWebviewWindow().startDragging().catch(() => {});
    };
    el.addEventListener("mousedown", onDown);
    return () => el.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSettings]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onHide();
  }, [onHide]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const charCount = text.length;

  return (
    <div
      className="empty-state"
      style={{ "--glass-opacity": `${opacity}%` } as React.CSSProperties}
    >
      {/* Glass background */}
      <div
        className="main-glass"
        style={{ background: `rgba(10, 10, 14, ${opacity / 100})` }}
      />

      {/* Drag handle — grab this bar to move the window */}
      <div
        ref={dragHandleRef}
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

      {/* Typing area */}
      <div
        className="typing-area-wrap"
        onClick={() => textareaRef.current?.focus()}
      >
        {text === "" && (
          <div className="typing-placeholder" aria-hidden="true">
            Type your thoughts, questions, or draft answers…
            <span className="typing-placeholder-cursor" />
          </div>
        )}
        <textarea
          ref={textareaRef}
          id="whisper-textarea"
          className="typing-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ fontSize: `${fontSize}px` }}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Whisper typing area — invisible to screen sharing"
        />
      </div>

      {/* Bottom bar */}
      <div className="bottom-bar" role="toolbar" aria-label="Whisper controls">
        <div className="bottom-item" title="Whisper is shielded from screen capture">
          <div
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent)", boxShadow: "0 0 6px var(--accent)", flexShrink: 0,
            }}
          />
          {shortcut} to hide
        </div>

        <div className="bottom-separator" />

        <div className="word-count">
          {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? "s" : ""} · ${charCount} chars` : ""}
        </div>

        <div style={{ position: "relative" }} ref={settingsRef}>
          <button
            id="settings-btn"
            className="bottom-item-btn"
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Open settings"
            aria-expanded={showSettings}
          >
            ≡
          </button>

          {showSettings && (
            <div className="settings-panel" role="menu" aria-label="Settings">
              <div className="settings-item">
                <span className="settings-item-label">Window opacity</span>
                <input id="opacity-slider" type="range" min="55" max="92" value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="settings-slider" aria-label="Window opacity" />
                <span style={{ fontSize: 10, color: "var(--text-muted)", width: 28 }}>{opacity}%</span>
              </div>

              <div className="settings-item">
                <span className="settings-item-label">Font size</span>
                <input id="fontsize-slider" type="range" min="13" max="24" value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="settings-slider" aria-label="Font size" />
                <span style={{ fontSize: 10, color: "var(--text-muted)", width: 28 }}>{fontSize}px</span>
              </div>

              <div className="settings-divider" />

              <div className="settings-item" onClick={() => { setText(""); setShowSettings(false); }}>
                <span className="settings-item-label">Clear text</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>⌫</span>
              </div>

              <div className="settings-item" onClick={() => { setShowSettings(false); onReset(); }}>
                <span className="settings-item-label">Redo onboarding</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>↺</span>
              </div>
            </div>
          )}
        </div>

        <button id="hide-btn" className="bottom-item-btn" onClick={onHide}
          aria-label="Hide Whisper window" title="Hide (or press Esc)">
          ×
        </button>
      </div>
    </div>
  );
}
