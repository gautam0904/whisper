# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
# whisper

## macOS Development & TCC Permissions

On macOS, privacy permissions (like Microphone and Speech Recognition) within the WebKit WebView (`WKWebView`) cannot be resolved when running a raw command-line binary (e.g., via standard `npm run tauri dev`). The helper subprocesses spawned by WebKit will crash with a TCC privacy violation because they cannot locate the containing bundle structure on disk.

To run and debug the application in development on macOS with working permissions:

1. **Build the debug-enabled App Bundle:**
   ```bash
   npm run tauri build -- --debug
   ```

2. **Apply Code Signing & Entitlements:**
   ```bash
   codesign --force --deep --sign - --entitlements src-tauri/Entitlements.plist src-tauri/target/debug/bundle/macos/whisper.app
   ```

3. **Open the Bundle:**
   ```bash
   open src-tauri/target/debug/bundle/macos/whisper.app
   ```

## Complete Project Cleanup

If you run into dependency issues, weird caching behavior, or failed builds, you can completely clean the project by removing all Node.js and Rust build artifacts.

Run the following command from the root of the project to perform a completely clean reset:

```bash
# Remove all node modules and lock file
rm -rf node_modules package-lock.json

# Remove Rust build target directory and Cargo lock file
rm -rf src-tauri/target src-tauri/Cargo.lock

# Re-install Node dependencies
npm install

# (Optional) Update Rust toolchain and dependencies
cd src-tauri && cargo update && cd ..
```
