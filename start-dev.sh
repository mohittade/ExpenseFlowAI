#!/bin/bash
# Start ExpenseFlow AI Development Servers

set -e

echo "Starting ExpenseFlow AI Development Servers..."

# Check if backend venv exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python3 -m venv venv
fi

# Activate venv and install backend dependencies
echo "Installing backend dependencies..."
source venv/bin/activate
pip install -r backend/requirements.txt

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# Start backend in background
echo "Starting backend on http://localhost:8000"
cd backend
source ../venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend in background
echo "Starting frontend on http://localhost:5173"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Servers started!"
echo "Backend:  http://localhost:8000 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C and kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait