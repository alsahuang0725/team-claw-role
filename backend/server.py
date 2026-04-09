"""
Unified backend server — mounts all four module Flask apps under one server.
Access via:
  /api/agents/*   → Module A (Role CRUD + AI file generation)
  /api/policies/* → Module B (Policy Engine)
  /api/chatroom/* → Module C (Socket.IO chatroom)
  /api/voices/*   → Module D (edge-tts voice catalog + generation)
"""

from agents.app import app as agents_app
from policies.app import app as policies_app
from chatroom.app import app as chatroom_app
from tts.app import create_tts_app as tts_factory

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

# Main app — used for health check + static files
main = Flask(__name__)
main.config["SECRET_KEY"] = "team-claw-role"
CORS(main)

socketio = SocketIO(main, cors_allowed_origins="*", async_mode="threading")

# Reuse the chatroom socketio instance (singleton)
import chatroom.app as cr_app
cr_app.socketio = socketio

# Mount module apps
main.register_blueprint(agents_app, url_prefix="/api/agents")
main.register_blueprint(policies_app, url_prefix="/api/policies")
main.register_blueprint(chatroom_app, url_prefix="/api/chatroom")

tts_app = tts_factory()
tts_app.config["SECRET_KEY"] = "team-claw-role"
main.register_blueprint(tts_app, url_prefix="/api")

@main.route("/health")
def health():
    return {"status": "ok", "service": "team-claw-role-backend"}


if __name__ == "__main__":
    socketio.run(main, host="0.0.0.0", port=8000, debug=False)
