@echo off
echo.
echo ======================================
echo Starting VVC Application
echo ======================================
echo.

REM Start Backend
echo Starting Laravel backend on port 8000...
start cmd /k "cd backend && php artisan serve"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start Frontend
echo Starting React frontend on port 3000...
start cmd /k "cd frontend && npm run dev"

echo.
echo ======================================
echo Servers Started
echo ======================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C in each terminal to stop
echo.
