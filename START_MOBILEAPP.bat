@echo off
title Ruta Segura Peru - Mobile App (Expo)
color 0E

echo.
echo ============================================
echo     RUTA SEGURA PERU - MOBILE APP
echo ============================================
echo.

cd /d "%~dp0apps\mobile"

echo Directorio: %CD%
echo.

if not exist "node_modules" (
    echo [1/2] Instalando dependencias...
    call npm install
    echo.
)

echo [2/2] Iniciando Expo...
echo.
echo ============================================
echo   Escanea el QR con Expo Go
echo   Web: http://localhost:8081
echo ============================================
echo.
echo Presiona 'w' para abrir en web
echo Presiona 'a' para abrir en Android
echo Presiona 'i' para abrir en iOS
echo.

call npx expo start

pause
