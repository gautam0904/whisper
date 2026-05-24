---
trigger: always_on
---

# WHISPER — Project Rules & Architecture Bible

> Version 1.0 | Desktop Overlay App | Tauri + React + TypeScript

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Tech Stack & Library Rules](#2-tech-stack--library-rules)
3. [Project Structure](#3-project-structure)
4. [Architecture & Design Principles](#4-architecture--design-principles)
5. [Frontend Rules](#5-frontend-rules)
6. [Styling System (Bootstrap + Tailwind + MUI)](#6-styling-system)
7. [State Management](#7-state-management)
8. [Rust / Tauri Backend Rules](#8-rust--tauri-backend-rules)
9. [Security Rules](#9-security-rules)
10. [Performance & Lightweight Rules](#10-performance--lightweight-rules)
11. [Customisation & SaaS-Grade UI Rules](#11-customisation--saas-grade-ui-rules)
12. [Testing Rules](#12-testing-rules)
13. [Git & Commit Rules](#13-git--commit-rules)
14. [Naming Conventions](#14-naming-conventions)
15. [Error Handling Rules](#15-error-handling-rules)
16. [Feature Flag System](#16-feature-flag-system)
17. [Theming Engine](#17-theming-engine)
18. [Accessibility Rules](#18-accessibility-rules)
19. [Release & Build Rules](#19-release--build-rules)
20. [Anti-Patterns (Never Do This)](#20-anti-patterns-never-do-this)

---

## 1. Project Vision

**Whisper** is a borderless, always-on-top, screen-capture-invisible desktop overlay for typing private notes during meetings. It is:

- **Invisible** to all screen sharing tools (Zoom, Teams, Meet, OBS)
- **Typing-only** — zero microphone, zero audio, zero recording
- **Featherweight** — < 50 MB RAM idle, < 5% CPU during active typing
- **SaaS-quality UI** — fully themeable, customisable, and extensible per user
- **Cross-platform** — Windows 11, macOS 13+, Ubuntu 22+

### Core Promise

> "If you can see it, no one else on the call can."

Every technical, architectural, and design decision must serve this promise first.

---

## 2. Tech Stack & Library Rules

### 2.1 Fixed (Non-Negotiable) Stack

| Layer               | Technology              | Version Rule                    |
| ------------------- | ----------------------- | ------------------------------- |
| Desktop Shell       | Tauri 2.x               | Always latest stable            |
| Frontend Framework  | React 18+               | Hooks only, no class components |
| Language (Frontend) | TypeScript 5.x          | Strict mode on, no `any`        |
| Language (Backend)  | Rust (stable toolchain) | Latest stable                   |
| Build Tool          | Vite 5.x                | No CRA, no Webpack              |
| Package Manager     | pnpm                    | Never npm or yarn               |

### 2.2 CSS / UI Libraries

All three libraries are permitted but must follow the **Layer Rule** below.

```
Layer 1 (Layout)       → Bootstrap 5 grid + utilities only
Layer 2 (Components)   → Material UI (MUI) v6 for complex components
Layer 3 (Custom)       → Tailwind CSS v4 utility classes for one-off overrides
Layer 4 (Theming)      → CSS Custom Properties (design tokens — source of truth)
```

**Hard Rules:**

- Never mix MUI `sx` prop and Tailwind class on the same element — pick one
- Bootstrap's JavaScript is BANNED — use only the grid/utilities via CSS classes
- MUI components must always receive `disableRipple` when used in the typing overlay (performance)
- Tailwind `@apply` in component CSS files is allowed; `@apply` in global CSS is forbidden
- All colours, spacings, radii referenced in Tailwind/MUI/Bootstrap must resolve to a CSS custom property token, never a hardcoded value

### 2.3 Icon Libraries (Only These)

```
@tabler/icons-react       — Primary icon set (1500+ clean monoline icons)
@mui/icons-material       — Only when pairing with an MUI component
lucide-react              — Fallback for any gap
```

No other icon libraries. Never use emoji as icons in UI components.

### 2.4 Permitted Third-Party Libraries

| Purpose              | Library                              | Notes                                                   |
| -------------------- | ------------------------------------ | ------------------------------------------------------- |
| Animations           | framer-motion                        | Only in onboarding; NOT in the main overlay (too heavy) |
| Animations (overlay) | CSS keyframes only                   | Zero JS animation in the typing canvas                  |
| Local storage        | @tauri-apps/plugin-store             | Never use localStorage or sessionStorage                |
| Global shortcut      | @tauri-apps/plugin-global-shortcut   |                                                         |
| Window API           | @tauri-apps/api/window               |                                                         |
| Notifications        | @tauri-apps/plugin-notification      |                                                         |
| Auto-start           | @tauri-apps/plugin-autostart         |                                                         |
| Updater              | @tauri-apps/plugin-updater           |                                                         |
| Clipboard            | @tauri-apps/plugin-clipboard-manager |                                                         |
| i18n                 | react-i18next                        | Required from day one, even for English-only launch     |
| Forms                | react-hook-form                      | No Formik                                               |
| Validation           | zod                                  | Schema-first, no manual validators                      |

### 2.5 Banned Libraries

```
axios          — use native fetch() or @tauri-apps/plugin-http
lodash         — use native ES2024 methods
moment.js      — use date-fns (tree-shakeable)
jquery         — obviously
react-router   — this is a single-window app, no routing needed
redux          — use Zustand; Redux is too heavy for this app
electron       — we are Tauri, not Electron
node-gyp deps  — no native Node modules
```

---

## 3. Project Structure

```
whisper/
├── src-tauri/                        # Rust backend
│   ├── src/
│   │   ├── main.rs                   # Tauri builder, plugin registration
│   │   ├── lib.rs                    # Shared types + re-exports
│   │   ├── commands/                 # One file per command group
│   │   │   ├── window.rs             # show/hide/move window commands
│   │   │   ├── capture.rs            # OS capture-exclusion logic
│   │   │   ├── shortcut.rs           # Global shortcut registration
│   │   │   └── settings.rs           # Persist/load user settings
│   │   ├── platform/                 # OS-specific implementations
│   │   │   ├── windows.rs
│   │   │   ├── macos.rs
│   │   │   └── linux.rs
│   │   └── error.rs                  # Centralised error types
│   ├── icons/                        # App icons all sizes
│   ├── capabilities/                 # Tauri 2 permission files
│   └── tauri.conf.json
│
├── src/                              # React frontend
│   ├── main.tsx                      # Entry — renders <App />
│   ├── App.tsx                       # Root: decides onboarding vs overlay
│   │
│   ├── features/                     # Feature-sliced architecture
│   │   ├── onboarding/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── index.ts              # Public API of this feature
│   │   ├── overlay/                  # Main typing canvas
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── index.ts
│   │   ├── settings/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── index.ts
│   │   └── theme/                    # Theming engine
│   │       ├── tokens.ts             # Design token definitions
│   │       ├── presets.ts            # Built-in theme presets
│   │       ├── ThemeProvider.tsx
│   │       └── index.ts
│   │
│   ├── shared/                       # Zero feature-specific code allowed here
│   │   ├── components/               # Reusable UI primitives
│   │   │   ├── KeyCap/
│   │   │   ├── GhostDot/
│   │   │   ├── PermissionRow/
│   │   │   ├── ProgressDots/
│   │   │   └── Toast/
│   │   ├── hooks/                    # Generic hooks
│   │   │   ├── useKeyCapture.ts
│   │   │   ├── useWindowDrag.ts
│   │   │   ├── useTheme.ts
│   │   │   └── usePersistedState.ts
│   │   ├── utils/                    # Pure functions only
│   │   │   ├── shortcut.ts
│   │   │   ├── platform.ts
│   │   │   └── format.ts
│   │   └── types/                    # Global TypeScript types
│   │       ├── settings.ts
│   │       ├── theme.ts
│   │       └── platform.ts
│   │
│   ├── styles/
│   │   ├── tokens.css                # CSS custom properties (master source)
│   │   ├── reset.css                 # Minimal reset
│   │   ├── global.css                # Body, selection, scrollbar
│   │   └── animations.css            # All @keyframes definitions
│   │
│   └── assets/
│       ├── icons/                    # SVG only
│       └── fonts/                    # Self-hosted, WOFF2 only
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── biome.json                        # Linter + formatter (replaces ESLint + Prettier)
├── WHISPER_PROJECT_RULES.md          # This file
└── package.json
```

### 3.1 Feature Slice Rules

- **Features may not import from other features directly.** Use events (Tauri events or a shared event bus) for cross-feature communication.
- Each feature's `index.ts` is its **only** public export boundary.
- `shared/` must never import from `features/`.
- `features/` may import from `shared/` freely.

---

## 4. Architecture & Design Principles

### 4.1 SOLID Principles (Applied to React + Rust)

**S — Single Responsibility**

- Every React component renders ONE thing. If a component fetches data AND renders a list AND handles a modal, split it into three.
- Every Rust command function does ONE thing. Logic goes in service functions, not command handlers.
- A hook that returns more than 3 values is doing too much — split it.

```typescript
// ❌ WRONG — does too much
function useOverlay() {
  const [text, setText] = useState('');
  const [isVisible, setVisible] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [shortcut, setShortcut] = useState('');
  // ...20 more lines
}

// ✅ CORRECT — one concern per hook
function useOverlayText() { ... }
function useOverlayVisibility() { ... }
function useWordCount(text: string) { ... }
```

**O — Open/Closed**

- Themes, permission checkers, and platform adapters must be extendable without modifying existing code.
- Use strategy pattern for platform-specific behaviour:

```typescript
// Platform adapter — add new platforms without touching existing ones
interface PlatformAdapter {
  excludeFromCapture(): Promise<void>;
  getPlatformName(): string;
}
```

**L — Liskov Substitution**

- All platform adapters, theme presets, and storage adapters must be interchangeable through their interface without the consumer knowing the concrete type.

**I — Interface Segregation**

- Settings types must be split by feature:

```typescript
// ❌ One giant settings object
interface AppSettings { overlayOpacity, fontSize, shortcut, theme, autostart, ... }

// ✅ Segregated
interface OverlaySettings { opacity: number; fontSize: number; }
interface ShortcutSettings { summonKey: string; dismissKey: string; }
interface AppearanceSettings { themeId: string; fontFamily: string; }
```

**D — Dependency Inversion**

- React components depend on hooks (abstractions), not Tauri commands directly.
- Hooks depend on service functions, not raw `invoke()` calls.
- Never call `invoke()` directly inside a component — always through a typed service layer.

```typescript
// ❌ Wrong — direct invoke in component
const MyComp = () => {
  await invoke("show_window");
};

// ✅ Correct — component → hook → service → invoke
const MyComp = () => {
  const { show } = useWindowControl();
};
```

### 4.2 DRY — Don't Repeat Yourself

- A string literal that appears in 2+ places becomes a constant in `shared/utils/constants.ts`.
- A CSS value that appears in 2+ places becomes a design token.
- A logic block repeated in 2+ components becomes a hook or utility function.
- A Tauri command called from 2+ hooks becomes a service function.
- **Exception:** Test code may repeat setup logic for readability — no shared test helpers for small tests.

### 4.3 KISS — Keep It Simple

- Prefer 10 lines of obvious code over 3 lines of clever code.
- No premature abstraction. Build the feature first; abstract only when the third duplication appears.
- If a comment is needed to explain what code does (not why), rewrite the code.

### 4.4 YAGNI — You Aren't Gonna Need It

- No code for features not in the current sprint or roadmap.
- No "just in case" abstraction layers.
- No placeholder files or "scaffolding" commits.
