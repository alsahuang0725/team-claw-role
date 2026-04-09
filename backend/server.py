"""
team-claw-role backend server — starts all four module Flask apps in one process.
HTTP routing via DispatcherMiddleware:
  GET /health                           → health check
  /api/agents/*   → agents Flask app    (Module A — Role CRUD + AI file gen)
  /api/policies/* → policies Flask app  (Module B — Policy Engine)
  /api/chatroom/* → chatroom Flask app (Module C — Socket.IO chatroom)
  /api/voices/*   → tts Flask app       (Module D — edge-tts voice catalog)

WebSocket (Socket.IO) is served at /socket.io/ on the same port.

Run from team_claw_role root:
  python backend/server.py
"""

import sys
from pathlib import Path
from werkzeug.middleware.dispatcher import DispatcherMiddleware

# Add team_claw_role root + backend/ to sys.path (prepend — checked before ComfyUI)
_ROOT = Path(__file__).resolve().parent.parent
_BACKEND = Path(__file__).resolve().parent
for p in (_BACKEND, str(_ROOT)):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from agents.app import app as agents_app
from policies.app import app as policies_app
from chatroom.app import app as chatroom_app
from tts.app import create_tts_app as tts_factory

# Main Flask app — health check only
main = Flask(__name__)
main.config["SECRET_KEY"] = "team-claw-role"
CORS(main)

# Shared Socket.IO instance — wraps chatroom app so WebSocket works
import chatroom.app as cr_app
cr_app.socketio = SocketIO(cr_app.app, cors_allowed_origins="*", async_mode="threading")

# TTS app
tts_app = tts_factory()
tts_app.config["SECRET_KEY"] = "team-claw-role"

@main.route("/health")
def health():
    return {"status": "ok", "service": "team-claw-role-backend"}

# WSGI composite app — use .wsgi_app to get WSGI callable from each module Flask
application = DispatcherMiddleware(main, {
    "/api/agents":   agents_app.wsgi_app,
    "/api/policies": policies_app.wsgi_app,
    "/api/chatroom": chatroom_app.wsgi_app,
    "/api/voices":   tts_app.wsgi_app,
})


if __name__ == "__main__":
    import gevent.pywsgi
    print("Starting team-claw-role backend on http://0.0.0.0:8000")
    print("Routes:")
    print("  GET /health")
    print("  /api/agents/*   → Module A")
    print("  /api/policies/* → Module B")
    print("  /api/chatroom/* → Module C")
    print("  /api/voices/*   → Module D")
    srv = gevent.pywsgi.WSGIServer(("0.0.0.0", 8000), application)
    srv.serve_forever()
