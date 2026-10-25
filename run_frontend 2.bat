@echo off
title Setu Moolya Frontend (सेतुमूल्य)
cd /d "%~dp0setu-moolya-frontend"
echo ====================================================
echo  🌿 Launching Setu Moolya Glassmorphic Frontend
echo  🌾 Green Farm Scene & Transparent Overlapping Portal
echo  📡 Local URL: http://localhost:3000
echo ====================================================
start "" http://localhost:3000
python -m http.server 3000
pause
