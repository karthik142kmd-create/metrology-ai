FROM python:3.11-slim

# Install system dependencies including Tesseract OCR & OpenCV requirements
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    tesseract-ocr-tam \
    tesseract-ocr-tel \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code into /app
COPY backend/ .

# Create persistent storage directories
RUN mkdir -p uploads reports

# Expose default port (Render will dynamically assign PORT env var)
EXPOSE 8000

# Run uvicorn respecting Render's dynamic $PORT or fallback to 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
