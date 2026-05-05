@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"
call :resolve_php
if errorlevel 1 exit /b 1
call :resolve_composer
if errorlevel 1 exit /b 1

echo.
echo ======================================
echo VVC - Full Stack Application Setup
echo ======================================
echo.

echo Using PHP: %PHP_CMD%
echo.

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
cd /d "%ROOT_DIR%backend"

if not exist "bootstrap\cache" (
    echo Creating bootstrap\cache directory...
    mkdir "bootstrap\cache"
)

for %%D in (
    "storage\app\public"
    "storage\framework\cache\data"
    "storage\framework\sessions"
    "storage\framework\testing"
    "storage\framework\views"
    "storage\logs"
) do (
    if not exist %%~D mkdir %%~D
)

if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

echo Installing Composer dependencies...
if defined COMPOSER_PHAR (
    call "%PHP_CMD%" "%COMPOSER_PHAR%" install --no-interaction
) else (
    call composer install --no-interaction
)

echo Generating application key...
call "%PHP_CMD%" artisan key:generate

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
call "%PHP_CMD%" artisan migrate --force

echo Seeding database...
call "%PHP_CMD%" artisan db:seed

cd /d "%ROOT_DIR%"

REM Setup Frontend
echo.
echo ======================================
echo Setting up Frontend (React)...
echo ======================================
cd /d "%ROOT_DIR%frontend"

echo Installing npm dependencies...
call npm install

cd /d "%ROOT_DIR%"

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo.
echo 1. Start Backend Server:
echo    cd backend
echo    "%PHP_CMD%" artisan serve
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
exit /b 0

:resolve_php
set "PHP_CMD="

where php >nul 2>nul
if %errorlevel% equ 0 set "PHP_CMD=php"

if not defined PHP_CMD if exist "C:\xampp\php\php.exe" set "PHP_CMD=C:\xampp\php\php.exe"

if not defined PHP_CMD (
    for /d %%D in ("C:\laragon\bin\php\php-*") do (
        if exist "%%~fD\php.exe" set "PHP_CMD=%%~fD\php.exe"
    )
)

if not defined PHP_CMD (
    for /d %%D in ("C:\wamp64\bin\php\php*") do (
        if exist "%%~fD\php.exe" set "PHP_CMD=%%~fD\php.exe"
    )
)

if defined PHP_CMD exit /b 0

echo Error: PHP was not found.
echo Install PHP or add it to PATH, then run setup again.
echo Example for XAMPP: add C:\xampp\php to PATH
pause
exit /b 1

:resolve_composer
set "COMPOSER_PHAR="

if exist "C:\ProgramData\ComposerSetup\bin\composer.phar" (
    set "COMPOSER_PHAR=C:\ProgramData\ComposerSetup\bin\composer.phar"
    exit /b 0
)

where composer >nul 2>nul
if %errorlevel% equ 0 exit /b 0

echo Error: Composer is not installed.
echo Please install Composer from https://getcomposer.org
pause
exit /b 1
