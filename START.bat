@echo off
chcp 65001 >nul
echo ========================================
echo   E-Bar - Запуск приложения
echo ========================================
echo.

echo [1/2] Запуск Backend сервера...
start "E-Bar Backend" cmd /k "cd backend && .\venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Запуск Frontend сервера...
start "E-Bar Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Серверы запускаются...
echo ========================================
echo.
echo Backend API: http://localhost:8000
echo Frontend:    http://localhost:5173
echo.
echo Документация API: http://localhost:8000/docs
echo.
echo Для остановки серверов закройте окна терминалов
echo или нажмите Ctrl+C в каждом из них.
echo.
pause

