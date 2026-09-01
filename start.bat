@echo off
title Kosisko Prime Django Server
echo ===================================================
echo   Starting Kosisko Prime Multi-Tenant Server...
echo ===================================================
echo.

:: 1. Navigate to Project Directory
cd /d %~dp0

:: 2. Activate Virtual Environment (मानकर चल रहे हैं कि फोल्डर का नाम venv है)
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate
) else (
    echo [WARNING] venv folder not found! Trying global python...
)

:: 3. Run Django Development Server
python manage.py runserver 0.0.0.0:8000

pause