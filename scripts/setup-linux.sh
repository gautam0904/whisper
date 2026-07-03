#!/bin/bash

# Exit on error
set -e

echo -e "\e[36mSetting up Linux build environment for Whisper...\e[0m"

# Update package lists
echo "Updating package lists..."
sudo apt-get update

# Install Tauri dependencies and cpal audio dependency
echo "Installing system dependencies..."
sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libasound2-dev # Required for cpal audio crate

echo -e "\e[32mSetup complete. You can now run 'npm run tauri dev' (or 'cargo build').\e[0m"
