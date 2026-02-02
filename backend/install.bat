@echo off
REM Ruta Segura Perú - Backend Installation Script for Windows
REM Run this script to install all dependencies without Docker

echo ========================================
echo   Ruta Segura Peru - Backend Setup
echo ========================================

REM Check Python version
echo.
echo [1/5] Checking Python version...
python --version

REM Create virtual environment
echo.
echo [2/5] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

REM Activate virtual environment
echo.
echo [3/5] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo [4/5] Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt

REM Create .env if not exists
echo.
echo [5/5] Setting up environment...
if not exist ".env" (
    copy .env.example .env
    echo [OK] Created .env file from .env.example
    echo [WARNING] Please edit .env with your database credentials!
) else (
    echo [OK] .env file already exists
)

REM Create logs directory
if not exist "logs" mkdir logs

echo.
echo ========================================
echo   [OK] Installation Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env with your PostgreSQL credentials
echo   2. Make sure PostgreSQL is running with PostGIS
echo   3. Run: run.bat
echo.
pause
