@echo off
echo Starting Gridwalker setup...
"C:\Program Files\Git\bin\bash.exe" "%~dp0setup.sh"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Setup failed. Make sure Git Bash is installed.
)
pause
