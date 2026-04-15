#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "===================================================="
echo "  Geo-Context Engineering Brief Generator — E4C"
echo "===================================================="
echo ""

# Install frontend dependencies
echo "[1/4] Installing frontend dependencies..."
cd "$ROOT/apps/web"
npm install

# Install backend dependencies
echo "[2/4] Installing backend dependencies..."
cd "$ROOT/apps/api"
if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
else
    pip install -r requirements.txt
fi

echo "[3/4] Starting backend API (port 8000)..."
cd "$ROOT/apps/api"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
API_PID=$!

sleep 2

echo "[4/4] Starting frontend dev server (port 5173)..."
cd "$ROOT/apps/web"
npm run dev &
WEB_PID=$!

echo ""
echo "======================================================"
echo "  Backend: http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/docs"
echo "  Frontend: http://localhost:5173"
echo "======================================================"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $API_PID $WEB_PID 2>/dev/null; exit 0" INT TERM
wait
