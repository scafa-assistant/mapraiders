@echo off
echo Starting MapRaiders...
"C:\Program Files\Git\bin\bash.exe" "%~dp0start.sh"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Start failed. Run setup.bat first.
)
pause
