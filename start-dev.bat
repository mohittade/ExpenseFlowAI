@echo off
echo Starting ExpenseFlow AI Development Servers...

echo.
echo Installing backend dependencies...
cd backend
call ..\venv\Scripts\pip.exe install -r requirements.txt
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
if not exist node_modules npm install
cd ..

echo.
echo Starting backend on http://localhost:8000
start "ExpenseFlow Backend" cmd /k "cd backend && call ..\venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting frontend on http://localhost:5173
start "ExpenseFlow Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servers started!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window (servers will continue running in separate windows)
pause >nul