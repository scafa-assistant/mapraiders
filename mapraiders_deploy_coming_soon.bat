@echo off
title MapRaiders — Coming Soon Update
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================
echo  MapRaiders — Coming Soon Deployment
echo ================================================
echo.

REM Paramiko installieren falls nicht vorhanden
pip install paramiko --break-system-packages --quiet 2>nul || py -m pip install paramiko -q

echo Starte Update fuer alle 13 Sprachversionen...
echo.
py mapraiders_coming_soon.py

echo.
echo ================================================
echo  Fertig! Seite pruefen: https://mapraiders.com
echo ================================================
pause
