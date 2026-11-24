#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start ExpenseFlow AI development servers (backend + frontend)
#>

Write-Host "Starting ExpenseFlow AI Development Servers..." -ForegroundColor Green

# Check if backend venv exists
$venvPath = ".\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate venv and install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
& "$venvPath\Scripts\pip.exe" install -r backend\requirements.txt

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
cd frontend
if (-not (Test-Path "node_modules")) {
    npm install
}
cd ..

# Start both servers
Write-Host "Starting backend on http://localhost:8000" -ForegroundColor Green
Write-Host "Starting frontend on http://localhost:5173" -ForegroundColor Green

# Use start-process to run in separate windows
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; & \"$PSScriptRoot\venv\Scripts\python.exe\" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Servers started! Press Ctrl+C to stop." -ForegroundColor Green