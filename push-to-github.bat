@echo off
title Integrated Systemics — Push to GitHub
cd /d "%~dp0"

echo.
echo  Integrated Systemics
echo  ─────────────────────────────────────────
echo  Pushing to GitHub Pages...
echo.

:: Ensure git is available
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo  ERROR: git not found. Install Git from https://git-scm.com
  pause & exit /b 1
)

:: Initialise repo if needed
if not exist ".git" (
  echo  Initialising git repository...
  git init
  git branch -M main
)

:: Set remote if not already set
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo  Adding remote origin...
  git remote add origin https://github.com/kurtrowley/integratedsystemics-site.git
)

:: Stage all files
echo  Staging changes...
git add .

:: Check if there is anything to commit
git diff --cached --quiet
if %ERRORLEVEL% equ 0 (
  echo.
  echo  Nothing to commit — working tree is already up to date.
  echo.
  pause & exit /b 0
)

:: Commit with timestamp
set TIMESTAMP=%DATE% %TIME%
git commit -m "Update site — %TIMESTAMP%"

:: Push
echo.
echo  Pushing to origin/main...
git push -u origin main

if %ERRORLEVEL% equ 0 (
  echo.
  echo  Done. Live at:
  echo  https://kurtrowley.github.io/integratedsystemics-site/
  echo.
) else (
  echo.
  echo  Push failed. If this is a first push you may need to:
  echo    1. Create the repo at https://github.com/new
  echo    2. Authenticate via: git credential-manager
  echo.
)

pause
