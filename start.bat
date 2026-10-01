@echo off
SET ROOT=%~dp0
cd /d "%ROOT%backend"
if not exist .venv (
  python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -r requirements.txt
start "DRSN33 Backend" cmd /k uvicorn server:app --host 0.0.0.0 --port 8000 --reload

cd /d "%ROOT%frontend"
if not exist node_modules (
  yarn install
)
start "DRSN33 Frontend" cmd /k yarn start
