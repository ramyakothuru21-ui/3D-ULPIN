@echo off
title Push 3D-ULPIN to GitHub
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%LOCALAPPDATA%\Programs\Git\mingw64\bin;%PATH%"
cd /d "C:\Users\K V Ramya\Desktop\3D_ULPIN_WEBSITE_CODE"
echo ==============================================================
echo   Pushing 3D-ULPIN Code to GitHub (ramyakothuru21-ui/3D-ULPIN)
echo ==============================================================
echo.
git push -u origin main
echo.
echo ==============================================================
echo   Finished!
echo ==============================================================
pause
