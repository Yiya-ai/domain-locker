@echo off
setlocal
cd /d "%~dp0"
if not exist "dist\analog\server\index.mjs" (
  echo Build Domain Locker first: npm ci ^&^& npm run build
  pause
  exit /b 1
)
set "NITRO_HOST=127.0.0.1"
set "NITRO_PORT=43973"
if not defined DL_PORTFOLIO_CURRENCY set "DL_PORTFOLIO_CURRENCY=CNY"
echo Domain Locker: http://127.0.0.1:43973/domains/ledger
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0scripts\start-private.ps1"
set "launcher_exit=%errorlevel%"
if not "%launcher_exit%"=="0" pause
exit /b %launcher_exit%
