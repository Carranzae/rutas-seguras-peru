@echo off
title Ruta Segura Peru - INICIAR TODO
color 0F

echo.
echo ============================================
echo     RUTA SEGURA PERU - SISTEMA COMPLETO
echo ============================================
echo.

cd /d "%~dp0"

REM Verificar si hay dependencias instaladas
if not exist "node_modules" (
    echo [0/4] Instalando dependencias del workspace...
    call npm install
    echo.
)

echo Iniciando todos los servicios...
echo.

REM Iniciar Backend en nueva ventana
echo [1/4] Iniciando Backend API...
start "Backend API" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat 2>nul && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Esperar 3 segundos
timeout /t 3 /nobreak >nul

REM Iniciar Super Admin Dashboard en nueva ventana
echo [2/4] Iniciando Super Admin Dashboard...
start "Super Admin" cmd /k "cd /d %~dp0apps\super-admin && npm run dev"

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Iniciar Agency Dashboard en nueva ventana
echo [3/4] Iniciando Agency Dashboard...
start "Agency Web" cmd /k "cd /d %~dp0apps\agency-web && npm run dev"

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Iniciar Mobile App en nueva ventana
echo [4/4] Iniciando Mobile App (Expo)...
start "Mobile App" cmd /k "cd /d %~dp0apps\mobile && npx expo start"

echo.
echo ============================================
echo   TODOS LOS SERVICIOS INICIADOS!
echo ============================================
echo.
echo   Backend API:   http://localhost:8000/docs
echo   Super Admin:   http://localhost:3000
echo   Agency Web:    http://localhost:3001
echo   Mobile App:    http://localhost:8081
echo.
echo   Login Super Admin: admin@rutaseguraperu.com / Admin123!
echo ============================================
echo.
echo Cierra esta ventana cuando termines.
echo Para detener servicios, cierra cada ventana individualmente.
echo.

pause
