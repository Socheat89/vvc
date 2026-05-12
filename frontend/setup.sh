#!/bin/bash

echo ""
echo "======================================"
echo "VVC - Full Stack Application Setup"
echo "======================================"
echo ""

# Check if composer is installed
if ! command -v composer &> /dev/null; then
    echo "Error: Composer is not installed"
    echo "Please install Composer from https://getcomposer.org"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Setup Backend
echo ""
echo "======================================"
echo "Setting up Backend (Laravel)..."
echo "======================================"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "Installing Composer dependencies..."
composer install

echo "Generating application key..."
php artisan key:generate

echo ""
echo "======================================"
echo "Database Setup"
echo "======================================"
echo ""
echo "Please ensure MySQL is running and the vvc_db database exists."
echo "If not, run:"
echo "  mysql -u root -e 'CREATE DATABASE vvc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'"
echo ""

echo "Running migrations..."
php artisan migrate --force

echo "Seeding database..."
php artisan db:seed

cd ..

# Setup Frontend
echo ""
echo "======================================"
echo "Setting up Frontend (React)..."
echo "======================================"
cd frontend

echo "Installing npm dependencies..."
npm install

cd ..

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start Backend Server:"
echo "   cd backend"
echo "   php artisan serve"
echo ""
echo "2. In a new terminal, Start Frontend Server:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open browser to http://localhost:3000"
echo ""
echo "Admin Credentials:"
echo "   Email: admin@example.com"
echo "   Password: password123"
echo ""
