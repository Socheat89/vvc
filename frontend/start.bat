@echo off
echo.
echo ======================================
echo Starting VVC Application
echo ======================================
echo.

REM Start Backend
echo Starting Laravel backend on port 8000...
start cmd /k "cd backend && php -d upload_max_filesize=200M -d post_max_size=220M -d memory_limit=1024M -d max_execution_time=300 -d max_input_time=300 -S 127.0.0.1:8000 -t public public/index.php"

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
