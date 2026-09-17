# Dockerfile for the Email Assistant FastAPI service
#
# Build stage uses a lightweight Python image, installs dependencies and copies the
# application code.  The final image runs ``uvicorn``.

FROM python:3.12-slim AS builder
WORKDIR /app

# Install build dependencies (none required for pure python packages)
# Copy only requirements first to leverage Docker cache.
COPY requirements.txt ./
# Add additional fastapi dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir fastapi[all] uvicorn[standard] python-dotenv aiosmtplib && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
