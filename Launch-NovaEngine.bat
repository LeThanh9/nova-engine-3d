@echo off
title Launch NovaEngine 3D Studio
echo ===================================================
echo     NOVA ENGINE 3D - UNREAL EDITION
echo ===================================================
echo Dang khoi dong NovaEngine 3D...
echo.

where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo [1/2] Dang chay qua Electron Desktop Runtime...
    npx electron .
    if %errorlevel% equ 0 goto :done
)

echo [2/2] Mo truc tiep tren Trinh Duyet Web...
start index.html

:done
echo Hoan tat!
