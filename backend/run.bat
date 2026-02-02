@echo off
REM Ruta Segura Perú - Run Backend Server for Windows
REM Run this script after install.bat

echo ========================================
echo   Ruta Segura Peru - Starting Server
echo ========================================

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo    Run install.bat first or copy .env.example to .env
    pause
    exit /b 1
)

echo.
echo Starting FastAPI server...
echo    API Docs: http://localhost:8000/docs
echo    Health:   http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Run uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
