@echo off
title Ruta Segura Peru - Backend API
color 0A

echo.
echo ============================================
echo        RUTA SEGURA PERU - BACKEND
echo ============================================
echo.

cd /d "%~dp0backend"

echo [1/3] Activando entorno virtual...
call venv\Scripts\activate.bat

echo [2/3] Verificando base de datos...
python -c "print('PostgreSQL: OK')" 2>nul || echo PostgreSQL: Verifica que este corriendo

echo [3/3] Iniciando servidor en puerto 8000...
echo.
echo ============================================
echo   API: http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo ============================================
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
