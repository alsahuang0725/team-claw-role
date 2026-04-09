# backend/Dockerfile — Python Flask backend for team-claw-role
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies (edge-tts, Flask, Socket.IO, PostgreSQL adapter)
RUN pip install --no-cache-dir \
    flask \
    flask-cors \
    flask-socketio \
    python-socketio \
    python-engineio \
    edge-tts \
    pyyaml \
    psycopg2-binary \
    werkzeug

# Copy backend source (agents/, policies/, chatroom/, tts/, server.py)
COPY agents/   ./agents/
COPY policies/ ./policies/
COPY chatroom/ ./chatroom/
COPY tts/      ./tts/
COPY server.py ./
COPY __init__.py ./

EXPOSE 8000

# Run via DispatcherMiddleware + wsgiref (threaded)
# In Docker, wsgiref doesn't have the Windows port-sharing conflict
CMD ["python", "server.py"]
