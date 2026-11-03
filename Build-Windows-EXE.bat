@echo off
title Build Windows EXE - NovaEngine 3D
echo ===================================================
echo     DONG GOI NOVA ENGINE 3D THANH FILE .EXE
echo ===================================================
echo.
echo Dang kiem tra moi truong dong goi...

call npm install
if %errorlevel% neq 0 (
    echo Loi khi cai dat dependencies. Hay dam bao ban da ket noi internet.
    pause
    exit /b %errorlevel%
)

echo Dang dong goi thanh ung dung Portable Windows EXE vao thu muc dist\...
call npm run dist

echo.
echo ===================================================
echo   XUAT FILE EXE HOAN TAT!
echo   Kiem tra file .exe tai thu muc: e:\game-engine\dist\
echo ===================================================
pause
