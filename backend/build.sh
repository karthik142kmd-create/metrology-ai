#!/usr/bin/env bash
# Render.com build script — installs Tesseract and Python deps

set -e

echo "=== Installing system dependencies (Tesseract OCR) ==="
apt-get update -qq && apt-get install -y -qq \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

echo "=== Tesseract version ==="
tesseract --version

echo "=== Installing Python dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Running database migrations (if Alembic is configured) ==="
# Uncomment the line below if you have Alembic migrations set up:
# alembic upgrade head

echo "=== Build complete ==="
