@echo off
title Integrated Systemics R^&D — Local Server
echo.
echo  Integrated Systemics R^&D
echo  ─────────────────────────────────────────
echo  Starting local development server...
echo  (ES modules require HTTP — file:// will not work)
echo.

:: Try Python first (most commonly available)
where python >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  Using Python http.server
  echo  Open: http://localhost:8000
  echo.
  echo  Press Ctrl+C to stop.
  echo.
  python -m http.server 8000
  goto :done
)

:: Try Python3 explicitly (macOS / some Windows installs)
where python3 >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  Using Python3 http.server
  echo  Open: http://localhost:8000
  echo.
  echo  Press Ctrl+C to stop.
  echo.
  python3 -m http.server 8000
  goto :done
)

:: Try Node / npx serve
where node >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  Using npx serve
  echo  Open: http://localhost:3000
  echo.
  echo  Press Ctrl+C to stop.
  echo.
  npx serve -p 3000 .
  goto :done
)

echo  ERROR: Neither Python nor Node.js found.
echo.
echo  Install one of:
echo    Python  — https://python.org
echo    Node.js — https://nodejs.org
echo.
pause
:done
