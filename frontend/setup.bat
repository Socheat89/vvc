@echo off
setlocal enabledelayedexpansion

echo.
echo ======================================
echo VVC - Full Stack Application Setup
echo ======================================
echo.

REM Check if composer is installed
where composer >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Composer is not installed or not in PATH
    echo Please install Composer from https://getcomposer.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if MySQL is running
echo.
echo Checking MySQL connection...
mysql -u root -e "SELECT 1;" >nul 2>nul
if %errorlevel% neq 0 (
    echo Warning: MySQL might not be running
    echo Make sure MySQL service is started before continuing
    echo.
)

REM Setup Backend
echo.
echo ======================================
echo Setting up Backend (Laravel)...
echo ======================================
cd backend

if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

echo Installing Composer dependencies...
call composer install

echo Generating application key...
call php artisan key:generate

echo.
echo ======================================
echo Database Setup
echo ======================================
echo.

REM Check if database exists
for /f %%i in ('mysql -u root -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='vvc_db';" 2^>nul') do set DB_EXISTS=%%i

if not defined DB_EXISTS (
    echo Creating database...
    mysql -u root -e "CREATE DATABASE vvc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>nul
    if %errorlevel% equ 0 (
        echo Database created successfully
    ) else (
        echo Error: Could not create database
        echo Please create it manually:
        echo   CREATE DATABASE vvc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        pause
    )
) else (
    echo Database already exists
)

echo Running migrations...
call php artisan migrate --force

echo Seeding database...
call php artisan db:seed

cd ..

REM Setup Frontend
echo.
echo ======================================
echo Setting up Frontend (React)...
echo ======================================
cd frontend

echo Installing npm dependencies...
call npm install

cd ..

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo.
echo 1. Start Backend Server:
echo    cd backend
echo    php artisan serve
echo.
echo 2. In a new terminal, Start Frontend Server:
echo    cd frontend
echo    npm run dev
echo.
echo 3. Open browser to http://localhost:3000
echo.
echo Admin Credentials:
echo   Email: admin@example.com
echo   Password: password123
echo.
pause
