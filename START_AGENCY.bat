@echo off
title Ruta Segura Peru - Agency Control Center
color 0A

echo.
echo ============================================
echo     RUTA SEGURA - AGENCY CONTROL CENTER
echo ============================================
echo.

cd /d "%~dp0apps\agency-web"

echo Directorio: %CD%
echo.

if not exist "node_modules" (
    echo [1/2] Instalando dependencias...
    call npm install
    echo.
)

echo [2/2] Iniciando servidor de desarrollo...
echo.
echo ============================================
echo   Dashboard: http://localhost:3001
echo ============================================
echo.
echo Presiona Ctrl+C para detener
echo.

call npm run dev

pause
