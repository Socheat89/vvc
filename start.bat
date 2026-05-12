@echo off
setlocal

set "ROOT_DIR=%~dp0"
call :resolve_php
if errorlevel 1 exit /b 1

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo Error: npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo.
echo ======================================
echo Starting VVC Application
echo ======================================
echo.

echo Using PHP: %PHP_CMD%
echo.

if not exist "%ROOT_DIR%backend\bootstrap\cache" (
    mkdir "%ROOT_DIR%backend\bootstrap\cache" >nul 2>nul
)

for %%D in (
    "%ROOT_DIR%backend\storage\app\public"
    "%ROOT_DIR%backend\storage\framework\cache\data"
    "%ROOT_DIR%backend\storage\framework\sessions"
    "%ROOT_DIR%backend\storage\framework\testing"
    "%ROOT_DIR%backend\storage\framework\views"
    "%ROOT_DIR%backend\storage\logs"
) do (
    if not exist "%%~D" mkdir "%%~D" >nul 2>nul
)

if not exist "%ROOT_DIR%backend\vendor\autoload.php" (
    echo Warning: Backend dependencies are missing.
    echo Please run setup.bat or run: cd backend ^&^& composer install
    echo.
)

REM Start Backend
echo Starting Laravel backend on port 8000...
start "VVC Backend" /D "%ROOT_DIR%backend" "%PHP_CMD%" artisan serve

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting React frontend on port 3000...
start "VVC Frontend" /D "%ROOT_DIR%frontend" npm.cmd run dev

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

echo.
echo Error: PHP was not found.
echo Install PHP or add it to PATH, then run again.
echo Example for XAMPP: add C:\xampp\php to PATH
echo.
pause
exit /b 1
