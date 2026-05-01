#!/bin/bash

echo ""
echo "======================================"
echo "Starting VVC Application"
echo "======================================"
echo ""

# Start Backend
echo "Starting Laravel backend on port 8000..."
cd backend
php artisan serve &
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
