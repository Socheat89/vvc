#!/bin/bash

echo ""
echo "======================================"
echo "Starting VVC Application"
echo "======================================"
echo ""

# Start Backend
echo "Starting Laravel backend on port 8000..."
cd backend
php -d upload_max_filesize=200M -d post_max_size=220M -d memory_limit=1024M -d max_execution_time=300 -d max_input_time=300 -S 127.0.0.1:8000 -t public public/index.php &
BACKEND_PID=$!

cd ..

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo "Starting React frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "======================================"
echo "Servers Started"
echo "======================================"
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
