@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required. Please install Node.js first.
  pause
  exit /b 1
)
start "" "http://localhost:3000"
node server.js
if errorlevel 1 echo Could not start PvP server. Check port 3000 and Node.js version.
pause
