@echo off
title 3D-ULPIN Server (Port 5173)
echo ===================================================
echo   Starting 3D-ULPIN System...
echo ===================================================
cd /d "%~dp0"

echo Opening browser at http://localhost:5173/ ...
start http://localhost:5173/

if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64" (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64;%PATH%"
)

where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Vite dev server via npm...
    call npm.cmd run dev
) else (
    where py >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Node/npm not found. Starting via Python 3...
        py server.py 5173
    ) else (
        echo Neither npm nor Python was found. Please install Node.js or Python 3.
        pause
    )
)
