# Building Whisper

This document explains how to set up your environment to build the Whisper Tauri app on Windows, macOS, and Linux.

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Rust](https://www.rust-lang.org/tools/install)
- Git

---

## Windows Setup

Windows requires the MSVC C++ build tools. Using Git Bash out of the box can cause linker conflicts (`/usr/bin/link` shadowing MSVC `link.exe`).

### Option 1: Automated Setup (Recommended)
1. Ensure you have installed Visual Studio 2022 (Community is fine) with the **"Desktop development with C++"** workload.
2. Open PowerShell as Administrator and run the setup script:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\scripts\setup-windows.ps1
   ```
3. Run `npm run tauri dev` from your terminal. (We have added a `.cargo/config.toml` that forces `cargo` to use MSVC `link.exe` even if you use Git Bash.)

### Option 2: Visual Studio Command Prompt
1. Open the Start Menu and search for **"x64 Native Tools Command Prompt for VS 2022"**.
2. Open it, navigate to the Whisper directory.
3. Run `npm install` and then `npm run tauri dev`.

---

## Linux Setup

Linux requires several system dependencies (WebKitGTK, ALSA for audio, etc.).

1. Run the setup script to install all required dependencies (Debian/Ubuntu-based):
   ```bash
   ./scripts/setup-linux.sh
   ```
2. Run `npm install`
3. Run `npm run tauri dev`

---

## macOS Setup

macOS usually only requires the Xcode Command Line Tools.

1. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
2. Run `npm install`
3. Run `npm run tauri dev`
