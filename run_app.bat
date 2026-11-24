@echo off
cd /d "%~dp0"
call venv\Scripts\activate

echo Starting ExpenseFlow AI Backend on port 8000...
start "ExpenseFlow Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for backend to start...
timeout /t 4 /nobreak >nul

echo Starting ExpenseFlow AI Frontend on port 5173...
start "ExpenseFlow Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo Both services started:
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
pause