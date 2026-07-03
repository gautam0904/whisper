#!/bin/bash
# Automatically sign the binary during development to bind the Info.plist and entitlements for macOS TCC permissions
codesign -f -s - -i com.malaviyagautam.whisper --entitlements "${CARGO_MANIFEST_DIR}/Entitlements.plist" "$1"
exec "$@"
