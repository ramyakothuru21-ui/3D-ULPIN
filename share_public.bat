@echo off
title 3D-ULPIN Public Sharing Server
echo ===================================================
echo   Starting 3D-ULPIN Public Sharing Tunnel...
echo ===================================================
cd /d "%~dp0"

if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64" (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64;%PATH%"
)
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe" (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"
)

echo Starting local Vite server on port 5173...
start /b cmd /c "npm.cmd run dev"

echo Waiting 3 seconds for local server to be ready...
timeout /t 3 /nobreak >nul

echo Starting Cloudflare Public Tunnel...
echo ===================================================
echo Look for the 'https://*.trycloudflare.com' link below!
echo Share that link with your friends so they can view it.
echo ===================================================
cloudflared.exe tunnel --url http://localhost:5173
pause
