@echo off
REM Start team-claw-role backend server
REM Run from team_claw_role root:  run_backend.bat
cd /d "%~dp0.."
C:\Users\Ryan\documents\comfyui\python_embeded\python.exe -m backend.server %*
