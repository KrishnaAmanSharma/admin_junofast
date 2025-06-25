@echo off
echo Building Juno Fast Desktop Application...
echo.

echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Building frontend...
call npm run build

echo.
echo Step 3: Creating Windows executable...
call npx electron-builder --win --x64

echo.
echo Build complete! Check the dist-electron folder for your .exe file
pause