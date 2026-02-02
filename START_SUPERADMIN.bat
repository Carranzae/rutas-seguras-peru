@echo off
title Ruta Segura Peru - Super Admin Dashboard
color 0B

echo.
echo ============================================
echo     RUTA SEGURA PERU - SUPER ADMIN
echo ============================================
echo.

cd /d "%~dp0apps\super-admin"

echo Directorio: %CD%
echo.

if not exist "node_modules" (
    echo [1/2] Instalando dependencias...
    call npm install
    echo.
)

echo [2/2] Iniciando dashboard en puerto 3000...
echo.
echo ============================================
echo   Dashboard: http://localhost:3000
echo   Login: admin@rutaseguraperu.com / Admin123!
echo ============================================
echo.
echo Presiona Ctrl+C para detener
echo.

call npm run dev

pause
