@echo off
echo ====================================================
echo   Geo-Context Engineering Brief Generator -- E4C
echo ====================================================
echo.

SET ROOT=%~dp0

echo [1/4] Installing frontend dependencies (npm workspaces)...
cd /d "%ROOT%"
call npm install
IF %ERRORLEVEL% NEQ 0 ( echo Frontend install failed & pause & exit /b 1 )

echo [2/4] Installing backend Python dependencies...
cd /d "%ROOT%apps\api"
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 ( echo Backend install failed & pause & exit /b 1 )

echo [3/4] Starting backend API on port 8000...
start "GeoBrief API" cmd /k "cd /d "%ROOT%apps\api" && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo [4/4] Starting frontend dev server on port 5173...
start "GeoBrief Web" cmd /k "cd /d "%ROOT%apps\web" && npm run dev"

echo.
echo ======================================================
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/api/docs
echo   Frontend: http://localhost:5173
echo ======================================================
echo.
echo Both servers are starting in separate windows.
echo Close those windows or press Ctrl+C in each to stop.
echo.
pause
