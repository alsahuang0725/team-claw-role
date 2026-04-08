# backend/chatroom/alsatorelay.py
# Module C — Agent ↔ Socket.IO relay bridge
# Each agent runs this script to connect to the chatroom WebSocket server.
# Reference: D:\OpenClaw\myopencode\chatroom\alsatorelay.py

import os
import sys
import json
import time
import uuid
import threading
import socketio
import argparse

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEFAULT_SERVER = os.environ.get("CHATROOM_SERVER", "http://localhost:5001")
AGENT_NAME = os.environ.get("AGENT_NAME", "unknown")
AGENT_ID = os.environ.get("AGENT_ID", uuid.uuid4().hex[:8])


class AgentRelay:
    """Connects an agent to the multi-agent chatroom via Socket.IO."""

    def __init__(self, server_url: str, agent_name: str, agent_id: str):
        self.server_url = server_url
        self.agent_name = agent_name
        self.agent_id = agent_id
        self.sio = socketio.Client(reconnection=True, reconnection_delay=2)
        self.inbox: list[dict] = []
        self._setup_handlers()

    def _setup_handlers(self):
        @self.sio.on("connect")
        def on_connect():
            print(f"[{self.agent_name}] Connected to chatroom server")
            self.sio.emit("agent:join", {
                "agentId": self.agent_id,
                "agentName": self.agent_name,
            })

        @self.sio.on("disconnect")
        def on_disconnect():
            print(f"[{self.agent_name}] Disconnected from chatroom server")

        @self.sio.on("message:receive")
        def on_message(data: dict):
            """Received a message from the chatroom."""
            print(f"[{self.agent_name}] Message from {data.get('from')}: {data.get('text', '')}")
            self.inbox.append(data)
            # Process message — subclasses override this
            response = self._process_message(data)
            if response:
                self.send_message(response)

        @self.sio.on("agents:list")
        def on_agents_list(data: dict):
            """Updated list of online agents."""
            print(f"[{self.agent_name}] Online agents: {[a.get('name') for a in data.get('agents', [])]}")

        @self.sio.on("agent:left")
        def on_agent_left(data: dict):
            print(f"[{self.agent_name}] Agent left: {data.get('agentName')}")

    def _process_message(self, data: dict) -> str | None:
        """
        Override this method to process incoming messages and return a response.
        Default: echo with "received" acknowledgement.
        """
        return None  # Silent by default — override to enable chat

    def send_message(self, text: str, to: str = "all") -> None:
        """Send a message to the chatroom."""
        payload = {
            "from": self.agent_name,
            "to": to,
            "text": text,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "type": "text",
        }
        self.sio.emit("message:send", payload)

    def run(self) -> None:
        """Connect and wait indefinitely."""
        try:
            self.sio.connect(self.server_url)
            self.sio.wait()
        except Exception as e:
            print(f"[{self.agent_name}] Connection error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Agent chatroom relay")
    parser.add_argument("--server", default=DEFAULT_SERVER, help="Chatroom server URL")
    parser.add_argument("--name", default=AGENT_NAME, help="Agent display name")
    parser.add_argument("--id", default=AGENT_ID, help="Agent unique ID")
    args = parser.parse_args()

    relay = AgentRelay(args.server, args.name, args.id)
    relay.run()


if __name__ == "__main__":
    main()
