<#
.SYNOPSIS
Sets up the Windows environment for building Whisper.

.DESCRIPTION
This script checks for Visual Studio Build Tools, helps ensure the correct linker is used, and adds the MSVC target to rustup.
#>

$ErrorActionPreference = "Stop"

Write-Host "Setting up Windows build environment for Whisper..." -ForegroundColor Cyan

# 1. Add Rust MSVC target
Write-Host "Adding Rust x86_64-pc-windows-msvc target..."
rustup target add x86_64-pc-windows-msvc
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to add Rust target. Make sure rustup is installed."
}

# 2. Check for Visual Studio Build Tools
Write-Host "Checking for Visual Studio Build Tools..."
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"

if (Test-Path $vswhere) {
    $vsPath = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if ($vsPath) {
        Write-Host "Found Visual Studio at: $vsPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: To build Whisper successfully from Git Bash, we have added .cargo/config.toml." -ForegroundColor Yellow
        Write-Host "If you still encounter linker errors, please build from the 'x64 Native Tools Command Prompt for VS 2022'." -ForegroundColor Yellow
    } else {
        Write-Warning "Visual Studio C++ Build Tools not found!"
        Write-Host "Please install 'Desktop development with C++' via Visual Studio Installer." -ForegroundColor Red
    }
} else {
    Write-Warning "vswhere.exe not found. Cannot verify Visual Studio installation."
}

Write-Host "`nSetup complete. You can now run 'npm run tauri dev' (or 'cargo build')." -ForegroundColor Cyan
