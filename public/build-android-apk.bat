@echo off
echo ============================================================================
echo   QUICK SHOP PARTNER (com.quickshop.partner) - 1-CLICK APK BUILDER
echo   Shared Customer App Supabase Backend: https://rbdsjgalxoehuwskzvit.supabase.co
echo ============================================================================
echo.

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Node.js / npm is not installed. Please install Node.js 20+ from https://nodejs.org
  pause
  exit /b 1
)

echo [1/4] Installing project dependencies...
call npm install

echo [2/4] Building production web assets (connected to rbdsjgalxoehuwskzvit.supabase.co)...
set VITE_SUPABASE_URL=https://rbdsjgalxoehuwskzvit.supabase.co
if "%VITE_SUPABASE_ANON_KEY%"=="" set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZHNqZ2FseG9laHV3c2t6dml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NDk4MjEsImV4cCI6MjEwODUyNTgyMX0.rWVGoz323VwEXvWqw5XpsDER54z-E69gLWMAFZJjPSA
call npm run build

echo [3/4] Syncing Capacitor Android project...
call npx cap sync android

echo [4/4] Compiling Android Debug APK via Gradle...
cd android
call gradlew.bat assembleDebug

echo.
if exist "app\build\outputs\apk\debug\app-debug.apk" (
  echo ============================================================================
  echo   SUCCESS! Your installable APK file is ready at:
  echo   %CD%\app\build\outputs\apk\debug\app-debug.apk
  echo ============================================================================
  explorer.exe /select,"app\build\outputs\apk\debug\app-debug.apk"
) else (
  echo [INFO] Web bundle synced to /android. Open the /android folder in Android Studio
  echo        and click Build ^> Build Bundle(s) / APK(s) ^> Build APK(s).
)
pause
