# Create Windows EXE - Simple Instructions

## Quick Setup (5 Minutes)

### 1. Download Files
- Download all project files from this Replit to your Windows computer
- Extract to a folder like `C:\juno-fast\`

### 2. Open Command Prompt
- Press `Windows + R`, type `cmd`, press Enter
- Navigate to your project folder:
```cmd
cd C:\juno-fast
```

### 3. Install Dependencies
```cmd
npm install
```

### 4. Build the EXE
```cmd
npm run build-exe
```

### 5. Find Your EXE
The executable will be created in:
- **Installer**: `dist-electron\Juno Fast Admin Setup 1.0.0.exe`
- **Portable**: `dist-electron\win-unpacked\Juno Fast Admin.exe`

## What You Get

✓ **Complete Desktop App** - Runs without browser
✓ **Self-contained** - Includes database and server
✓ **No installation required** (portable version)
✓ **Windows native** - Appears in taskbar, Start menu
✓ **All features included** - Order management, vendor assignment, broadcasting

## File Sizes
- Installer: ~150MB
- Portable folder: ~200MB

## Distribution
- Share the installer .exe for easy installation
- Share the portable .exe for no-install usage
- Both versions work identically

## Troubleshooting

**If build fails:**
```cmd
npm cache clean --force
npm install
npm run build-exe
```

**If app won't start:**
- Check Windows Defender/antivirus settings
- Run as Administrator if needed
- Ensure port 5000 is available

## Alternative: Web Version
If you prefer web access, just deploy on Replit and share the URL - no download needed!