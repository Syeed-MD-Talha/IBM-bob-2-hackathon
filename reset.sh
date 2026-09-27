#!/usr/bin/env bash
# Reset script: clean venv, reinstall, run tests, and start server.
set -e

echo "--- Removing old virtual environment ---"
rm -rf venv

echo "--- Creating fresh virtual environment ---"
python3 -m venv venv
source venv/bin/activate

echo "--- Installing dependencies ---"
pip install -r requirements.txt

echo "--- Running tests (some may fail due to seeded bugs) ---"
pytest tests/ -v || true

echo "--- Starting development server ---"
echo "Run: uvicorn app.main:app --reload"
