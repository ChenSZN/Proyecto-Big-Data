@echo off
setlocal
title SAT ITNL - Sistema de Alertas Tempranas

echo ======================================================
echo    SAT ITNL ^| SISTEMA DE INTELIGENCIA ACADEMICA
echo ======================================================
echo.

:: 1. Limpieza total de procesos y cache
echo [1/3] Limpiando entorno de trabajo...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1
if exist "frontend\.next" (
    echo Borrando cache de Next.js...
    rmdir /s /q "frontend\.next"
)
echo.

:: 2. Inicio del Backend (Puerto 8001 para evitar conflictos)
echo [2/3] Iniciando Servidor de Datos (FastAPI en Puerto 8001)...
start "BACKEND_SERVER" python main.py
echo.

:: 3. Inicio del Frontend y Apertura de Navegador
echo [3/3] Iniciando Interfaz Web (Next.js)...
echo La web se abrira automaticamente en unos segundos...
echo.

cd frontend
start /B timeout /t 10 > nul && start http://localhost:3000
npm run dev

pause
