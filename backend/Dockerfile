# backend/Dockerfile — Python FastAPI backend for team-claw-role
FROM python:3.12-slim AS builder

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy pyproject.toml + lock
COPY pyproject.toml ./
COPY uv.lock ./

# Freeze-install deps
RUN uv sync --frozen --no-dev

# Copy source
COPY agents/ ./agents/
COPY policies/ ./policies/
COPY chatroom/ ./chatroom/
COPY tts/ ./tts/
COPY server.py ./

# Runtime image
FROM python:3.12-slim

WORKDIR /app

# Install runtime deps
COPY --from=builder /app/.venv /app/.venv
COPY agents/ ./agents/
COPY policies/ ./policies/
COPY chatroom/ ./chatroom/
COPY tts/ ./tts/
COPY server.py ./

# edge-tts needs access to a Python with the module
RUN pip install --no-cache-dir edge-tts flask flask-cors flask-socketio python-socketio pyyaml

EXPOSE 8000

CMD ["python", "server.py"]
