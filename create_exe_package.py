#!/usr/bin/env python3
import os
import shutil
import zipfile
from pathlib import Path

def create_exe_package():
    """Create a downloadable package with everything needed to build Windows EXE"""
    
    # Create package directory
    package_dir = Path("juno-fast-windows-exe")
    if package_dir.exists():
        shutil.rmtree(package_dir)
    package_dir.mkdir()
    
    # Essential files for EXE creation
    files_to_copy = [
        "electron-main.js",
        "package-electron.json", 
        "build-exe.bat",
        "BUILD_EXE_GUIDE.md",
        "WINDOWS_EXE_INSTRUCTIONS.md",
        "server/",
        "client/",
        "shared/",
        "drizzle.config.ts",
        "tsconfig.json",
        "vite.config.ts",
        "tailwind.config.ts",
        "postcss.config.js",
        "components.json"
    ]
    
    # Copy essential files
    for item in files_to_copy:
        src = Path(item)
        if src.exists():
            if src.is_file():
                shutil.copy2(src, package_dir / src.name)
            elif src.is_dir():
                shutil.copytree(src, package_dir / src.name)
    
    # Create package.json for EXE (rename from package-electron.json)
    electron_package = package_dir / "package-electron.json"
    if electron_package.exists():
        electron_package.rename(package_dir / "package.json")
    
    # Create assets directory with placeholder icon
    assets_dir = package_dir / "assets"
    assets_dir.mkdir()
    
    # Create simple README for the package
    readme_content = """# Juno Fast - Windows EXE Builder

## Quick Start
1. Install Node.js from https://nodejs.org/
2. Open Command Prompt in this folder
3. Run: npm install
4. Run: npm run build-exe
5. Find your .exe in dist-electron/ folder

## Files Included
- electron-main.js - Main Electron app
- All source code (client, server, shared)
- Build configurations
- Complete documentation

## Requirements
- Windows 10/11
- Node.js 16+ 
- 2GB free space

Your app will be a complete desktop version of Juno Fast admin dashboard!
"""
    
    with open(package_dir / "README.md", "w") as f:
        f.write(readme_content)
    
    # Create ZIP package
    zip_path = "juno-fast-windows-exe.zip"
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(package_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, package_dir.parent)
                zipf.write(file_path, arcname)
    
    print(f"✓ Created package: {zip_path}")
    print(f"✓ Package size: {os.path.getsize(zip_path) / 1024 / 1024:.1f} MB")
    
    # Cleanup temp directory
    shutil.rmtree(package_dir)
    
    return zip_path

if __name__ == "__main__":
    create_exe_package()