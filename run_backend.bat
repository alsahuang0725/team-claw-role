@echo off
REM team-claw-role backend runner
REM Must be run from team_claw_role root directory
cd /d "%~dp0"
REM Use ComfyUI Python (which has flask, flask-cors, flask-socketio, edge-tts)
"C:\Users\Ryan\documents\comfyui\python_embeded\python.exe" backend/server.py %*
