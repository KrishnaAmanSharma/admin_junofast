# Build Windows EXE Guide

This guide will help you create a Windows executable (.exe) file for the Juno Fast admin dashboard.

## Prerequisites

1. **Node.js** installed on your Windows machine
2. **Git** (optional but recommended)
3. The project files downloaded to your computer

## Setup Instructions

### 1. Download Project Files
- Download all project files from Replit
- Extract to a folder (e.g., `C:\juno-fast\`)

### 2. Install Dependencies
Open Command Prompt in the project folder and run:

```cmd
npm install
```

### 3. Install Electron Dependencies
```cmd
npm install electron electron-builder --save-dev
```

### 4. Replace package.json
Replace your existing `package.json` with the contents from `package-electron.json`:

```cmd
copy package-electron.json package.json
```

### 5. Build the Frontend
```cmd
npm run build
```

### 6. Create the Executable
```cmd
npm run dist
```

## What This Creates

The build process will create:
- **Installer**: `dist-electron/Juno Fast Admin Setup 1.0.0.exe` (installable version)
- **Portable**: `dist-electron/win-unpacked/` (folder with executable)

## File Structure After Build
```
juno-fast/
├── dist-electron/
│   ├── Juno Fast Admin Setup 1.0.0.exe  (Installer)
│   └── win-unpacked/
│       └── Juno Fast Admin.exe           (Portable executable)
├── electron-main.js                      (Electron main process)
└── ... (other project files)
```

## Running the Desktop App

### Option 1: Install and Run
1. Run `Juno Fast Admin Setup 1.0.0.exe`
2. Follow installation wizard
3. Launch from Start Menu or Desktop shortcut

### Option 2: Portable Version
1. Navigate to `dist-electron/win-unpacked/`
2. Double-click `Juno Fast Admin.exe`
3. App will start directly (no installation needed)

## Features of Desktop App

- **Self-contained**: Includes web server and database connection
- **No browser required**: Runs as native Windows application
- **Offline capable**: Works without internet (except for external APIs)
- **System integration**: Appears in taskbar, system tray
- **Auto-updater ready**: Can be configured for automatic updates

## Customization Options

### Change App Icon
1. Create icons in `assets/` folder:
   - `icon.ico` (256x256 Windows icon)
   - `icon.png` (512x512 PNG)
2. Update paths in `package.json` build configuration

### Modify Window Settings
Edit `electron-main.js` to change:
- Window size and position
- Enable/disable developer tools
- Add custom menus
- Configure auto-start options

### Database Configuration
The app uses the same Supabase configuration as the web version. To use a local database:
1. Update environment variables in `electron-main.js`
2. Include database files in build configuration

## Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (recommend v16 or higher)
- Clear npm cache: `npm cache clean --force`

### App Won't Start
- Check if port 5000 is available
- Verify database connection settings
- Look at console output for errors

### Antivirus Issues
- Some antivirus software may flag the .exe file
- Add exception for the build folder
- Use code signing certificate for distribution

## Distribution

### For Internal Use
- Share the portable .exe file
- No installation required on target machines

### For Public Distribution
- Use the installer .exe file
- Consider code signing for security
- Test on multiple Windows versions

## Advanced Options

### Code Signing (Recommended for Distribution)
```json
"win": {
  "certificateFile": "certificate.p12",
  "certificatePassword": "your-password",
  "target": "nsis"
}
```

### Auto-Updates
The app includes electron-updater for automatic updates. Configure update server in production.

### Multiple Platforms
To build for multiple platforms:
```cmd
npm run dist -- --win --mac --linux
```

## Security Notes

- The desktop app runs a local web server
- Database credentials are embedded (use environment variables in production)
- Consider implementing authentication for sensitive deployments
- Regular updates recommended for security patches

Your Windows executable will be a complete, standalone version of the Juno Fast admin dashboard that can be distributed and run on any Windows machine without requiring browser or separate server setup.