export interface AIShortcut {
  id: string;
  displayName: string;
  url: string;
  color: string;
}

const STORAGE_KEY = "whisper_ai_shortcuts";

const DEFAULT_SHORTCUTS: AIShortcut[] = [
  { id: "chatgpt",    displayName: "ChatGPT",    url: "https://chat.openai.com",   color: "#10a37f" },
  { id: "gemini",     displayName: "Gemini",      url: "https://gemini.google.com", color: "#4285f4" },
  { id: "claude",     displayName: "Claude",      url: "https://claude.ai",         color: "#d97757" },
  { id: "perplexity", displayName: "Perplexity",  url: "https://www.perplexity.ai", color: "#22B8CD" },
  { id: "grok",       displayName: "Grok",        url: "https://x.com/i/grok",      color: "#888888" },
  { id: "mistral",    displayName: "Mistral",     url: "https://chat.mistral.ai",   color: "#f2a900" },
  { id: "google",     displayName: "Google",      url: "https://www.google.com",    color: "#ea4335" },
];

export function loadShortcuts(): AIShortcut[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AIShortcut[];
  } catch {
    // corrupt data — fall through to defaults
  }
  saveShortcuts(DEFAULT_SHORTCUTS);
  return DEFAULT_SHORTCUTS;
}

export function saveShortcuts(shortcuts: AIShortcut[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export function addShortcut(shortcut: Omit<AIShortcut, "id">): AIShortcut[] {
  const shortcuts = loadShortcuts();
  const newItem: AIShortcut = { ...shortcut, id: `sc_${Date.now()}` };
  const updated = [...shortcuts, newItem];
  saveShortcuts(updated);
  return updated;
}

export function updateShortcut(id: string, patch: Partial<Omit<AIShortcut, "id">>): AIShortcut[] {
  const shortcuts = loadShortcuts().map(s => s.id === id ? { ...s, ...patch } : s);
  saveShortcuts(shortcuts);
  return shortcuts;
}

export function deleteShortcut(id: string): AIShortcut[] {
  const shortcuts = loadShortcuts().filter(s => s.id !== id);
  saveShortcuts(shortcuts);
  return shortcuts;
}
