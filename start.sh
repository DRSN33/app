#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  yarn install
fi
yarn start &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID' EXIT
wait
