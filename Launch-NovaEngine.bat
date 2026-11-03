@echo off
title Launch NovaEngine 3D Studio
echo ===================================================
echo     NOVA ENGINE 3D - UNREAL EDITION
echo ===================================================
echo Dang khoi dong NovaEngine 3D Native Desktop App...
echo.

if exist "NovaEngine-3D.exe" (
    start "" "NovaEngine-3D.exe"
    goto :done
)

if exist "dist\NovaEngine-3D.exe" (
    start "" "dist\NovaEngine-3D.exe"
    goto :done
)

start index.html

:done
echo Hoan tat!
