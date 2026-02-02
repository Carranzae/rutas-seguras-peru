#!/bin/bash
# Ruta Segura Perú - Backend Installation Script
# Run this script to install all dependencies without Docker

echo "========================================"
echo "  Ruta Segura Perú - Backend Setup"
echo "========================================"

# Check Python version
echo ""
echo "[1/5] Checking Python version..."
python --version 2>&1 | grep -q "Python 3.1"
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Python 3.10+ is recommended"
    echo "   Current: $(python --version)"
fi

# Create virtual environment
echo ""
echo "[2/5] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "[3/5] Activating virtual environment..."
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate

# Install dependencies
echo ""
echo "[4/5] Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if not exists
echo ""
echo "[5/5] Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please edit .env with your database credentials!"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs

echo ""
echo "========================================"
echo "  ✅ Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your PostgreSQL credentials"
echo "  2. Make sure PostgreSQL is running with PostGIS"
echo "  3. Run: ./run.sh"
echo ""
