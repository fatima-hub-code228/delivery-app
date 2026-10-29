#!/usr/bin/env bash
set -e

echo "============================================================================"
echo "  QUICK SHOP PARTNER (com.quickshop.partner) - 1-CLICK APK BUILDER"
echo "  Shared Customer App Supabase Backend: https://rbdsjgalxoehuwskzvit.supabase.co"
echo "============================================================================"
echo ""

echo "[1/4] Installing dependencies..."
rm -f package-lock.json
npm install --legacy-peer-deps --no-package-lock

echo "[2/4] Building production web bundle (rbdsjgalxoehuwskzvit.supabase.co)..."
export VITE_SUPABASE_URL="https://rbdsjgalxoehuwskzvit.supabase.co"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZHNqZ2FseG9laHV3c2t6dml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NDk4MjEsImV4cCI6MjEwODUyNTgyMX0.rWVGoz323VwEXvWqw5XpsDER54z-E69gLWMAFZJjPSA}"
npm run build

echo "[3/4] Syncing Capacitor Android project..."
npx cap sync android

echo "[4/4] Running Gradle assembleDebug..."
cd android
chmod +x ./gradlew
./gradlew assembleDebug

echo ""
echo "============================================================================"
echo "  SUCCESS! Installable Android APK generated at:"
echo "  $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
echo "============================================================================"
