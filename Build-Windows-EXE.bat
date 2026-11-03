@echo off
title Build Windows EXE - NovaEngine 3D
echo ===================================================
echo     DONG GOI NOVA ENGINE 3D THANH FILE .EXE
echo ===================================================
echo.
echo [1/2] Dang bien dich Native Windows Executable qua .NET C#...

set CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC_PATH%" (
    set CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
)

if not exist "dist" mkdir "dist"

"%CSC_PATH%" /target:winexe /optimize /r:System.Windows.Forms.dll,System.Drawing.dll /out:"NovaEngine-3D.exe" "NovaEngineHost.cs"
if %errorlevel% neq 0 (
    echo [ERROR] Loi khi bien dich NovaEngine-3D.exe!
    pause
    exit /b %errorlevel%
)

copy /Y "NovaEngine-3D.exe" "dist\NovaEngine-3D.exe" >nul

echo.
echo ===================================================
echo   XUAT FILE EXE HOAN TAT!
echo.
echo   File chay truc tiep:
echo   - e:\game-engine\NovaEngine-3D.exe
echo   - e:\game-engine\dist\NovaEngine-3D.exe
echo.
echo   Ban chi can double-click file NovaEngine-3D.exe de choi!
echo ===================================================
pause
