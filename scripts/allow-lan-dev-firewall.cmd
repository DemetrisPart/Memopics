@echo off
:: Double-click this file — Windows will ask for Administrator approval.
:: Allows your phone (same Wi-Fi) to reach ports 3000 (web) and 9000 (MinIO).

net session >nul 2>&1
if %errorLevel% neq 0 (
  echo Requesting Administrator privileges...
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo Adding Memopics dev firewall rules...

netsh advfirewall firewall add rule name="Memopics Web Dev 3000" dir=in action=allow protocol=TCP localport=3000 profile=private,public,domain 2>nul
if %errorLevel% equ 0 (echo OK: port 3000) else (echo Rule may already exist for port 3000)

netsh advfirewall firewall add rule name="Memopics MinIO Dev 9000" dir=in action=allow protocol=TCP localport=9000 profile=private,public,domain 2>nul
if %errorLevel% equ 0 (echo OK: port 9000) else (echo Rule may already exist for port 9000)

netsh advfirewall firewall add rule name="Memopics Node.js Dev" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes profile=private,public,domain 2>nul
if %errorLevel% equ 0 (echo OK: Node.js) else (echo Node.js rule may already exist)

echo.
echo Done. On your phone open:
echo   http://192.168.0.103:3000/auth/login
echo   or http://192.168.0.106:3000/auth/login
echo.
echo If Wi-Fi router blocks phones, use PC Mobile Hotspot:
echo   1. Settings - Network - Mobile hotspot - ON
echo   2. Connect iPhone to the PC hotspot Wi-Fi
echo   3. Open http://192.168.137.1:3000/auth/login
echo.
pause
