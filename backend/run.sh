#!/bin/bash
# Ruta Segura Perú - Run Backend Server
# Run this script after install.sh

echo "========================================"
echo "  Ruta Segura Perú - Starting Server"
echo "========================================"

# Activate virtual environment
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate

# Check .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "   Run install.sh first or copy .env.example to .env"
    exit 1
fi

echo ""
echo "🚀 Starting FastAPI server..."
echo "   API Docs: http://localhost:8000/docs"
echo "   Health:   http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Run uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
