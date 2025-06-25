@echo off
echo Deploying Juno Fast to Firebase Hosting...
echo Project: junofast-ebd0a
echo.

echo Step 1: Building production version...
call npm run build

echo.
echo Step 2: Deploying to Firebase...
call firebase deploy --only hosting

echo.
echo Deployment complete!
echo Your app is live at: https://junofast-ebd0a.web.app
echo.
pause