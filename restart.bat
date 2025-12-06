@echo off
chcp 65001 >nul
echo ========================================
echo   Перезапуск E-Bar серверов
echo ========================================
echo.

echo [1/3] Остановка существующих процессов...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Запуск Backend сервера...
start "E-Bar Backend" cmd /k "cd backend && .\venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [3/3] Запуск Frontend сервера...
start "E-Bar Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Серверы перезапущены!
echo ========================================
echo.
echo Backend API: http://localhost:8000
echo Frontend:    http://localhost:5173
echo.
echo Для остановки серверов закройте окна терминалов
echo или нажмите Ctrl+C в каждом из них.
echo.
pause

