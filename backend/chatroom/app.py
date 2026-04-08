# backend/chatroom/app.py
# Module C — Multi-Agent Chatroom Flask + Socket.IO Backend

import time
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = "team-claw-role-chatroom"
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------

rooms: dict[str, dict] = {}   # room_name -> { agents: {}, messages: [] }
AGENTS: dict[str, dict] = {}  # agentId -> { agentId, agentName, room, joinedAt }


def _broadcast_agents(room: str):
    """Emit updated agent list to everyone in the room."""
    agent_list = [
        {"agentId": a["agentId"], "agentName": a["agentName"], "joinedAt": a["joinedAt"]}
        for a in AGENTS.values() if a.get("room") == room
    ]
    socketio.emit("agents:list", {"room": room, "agents": agent_list}, room=room)


# ---------------------------------------------------------------------------
# REST API
# ---------------------------------------------------------------------------

@app.route("/api/chatroom/rooms", methods=["GET"])
def list_rooms():
    """List available rooms."""
    return jsonify({"rooms": [{"name": name, "agentCount": len(r["agents"])}
                               for name, r in rooms.items()]})


@app.route("/api/chatroom/rooms/<room_name>", methods=["GET"])
def get_room(room_name: str):
    """Get room info and recent messages."""
    if room_name not in rooms:
        return jsonify({"error": "Room not found"}), 404
    room = rooms[room_name]
    return jsonify({
        "name": room_name,
        "agents": [{"agentId": a["agentId"], "agentName": a["agentName"]}
                   for a in room["agents"].values()],
        "messages": room["messages"][-100:],  # last 100 messages
    })


# ---------------------------------------------------------------------------
# Socket.IO Events
# ---------------------------------------------------------------------------

@socketio.on("connect")
def on_connect():
    print(f"Client connected: {request.sid}")


@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    # Find and remove this agent
    for agent_id, agent in list(AGENTS.items()):
        if agent.get("sid") == sid and agent.get("room"):
            room = agent["room"]
            agent_id_str = agent["agentId"]
            agent_name = agent["agentName"]
            del AGENTS[agent_id]
            room_data = rooms.get(room, {})
            if agent_id_str in room_data.get("agents", {}):
                del room_data["agents"][agent_id_str]
            _broadcast_agents(room)
            emit("agent:left", {
                "agentId": agent_id_str,
                "agentName": agent_name,
                "room": room,
            })
    print(f"Client disconnected: {sid}")


@socketio.on("room:join")
def on_room_join(data: dict):
    """An agent requests to join a room."""
    agent_id = data.get("agentId", uuid.uuid4().hex[:8])
    agent_name = data.get("agentName", "Anonymous")
    room = data.get("room", "default")

    # Create room if needed
    if room not in rooms:
        rooms[room] = {"agents": {}, "messages": []}

    # Register agent
    AGENTS[agent_id] = {
        "agentId": agent_id,
        "agentName": agent_name,
        "room": room,
        "sid": request.sid,
        "joinedAt": datetime.now(timezone.utc).isoformat(),
    }

    rooms[room]["agents"][agent_id] = AGENTS[agent_id]
    join_room(room)

    emit("room:joined", {
        "room": room,
        "agentId": agent_id,
        "messages": rooms[room]["messages"][-50:],
    })
    _broadcast_agents(room)
    print(f"Agent '{agent_name}' ({agent_id}) joined room '{room}'")


@socketio.on("room:leave")
def on_room_leave(data: dict):
    """An agent leaves a room."""
    agent_id = data.get("agentId")
    if agent_id not in AGENTS:
        return
    agent = AGENTS[agent_id]
    room = agent.get("room")
    agent_name = agent["agentName"]

    if room and room in rooms and agent_id in rooms[room]["agents"]:
        del rooms[room]["agents"][agent_id]
        del AGENTS[agent_id]
        leave_room(room)
        _broadcast_agents(room)
        emit("agent:left", {"agentId": agent_id, "agentName": agent_name, "room": room})


@socketio.on("message:send")
def on_message_send(data: dict):
    """Relay a message to the target room."""
    agent_id = data.get("from", "")
    room = data.get("room", "default")

    if room not in rooms:
        room = "default"
        if room not in rooms:
            rooms[room] = {"agents": {}, "messages": []}

    message = {
        "id": uuid.uuid4().hex[:12],
        "from": AGENTS.get(agent_id, {}).get("agentName", agent_id),
        "agentId": agent_id,
        "to": data.get("to", "all"),
        "text": data.get("text", ""),
        "type": data.get("type", "text"),
        "timestamp": data.get("timestamp") or datetime.now(timezone.utc).isoformat(),
    }

    rooms[room]["messages"].append(message)

    # Emit to the room (or targeted agent)
    target = data.get("to", "all")
    if target == "all":
        emit("message:receive", message, room=room)
    else:
        # Emit only to the sender and target agent
        emit("message:receive", message, room=room)
        for aid, a in AGENTS.items():
            if a.get("agentName") == target:
                socketio.emit("message:receive", message, room=a.get("sid", ""))


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5001, debug=True)
