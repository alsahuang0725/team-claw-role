# CLAW.md — team-claw-role: Module C (Chatroom)

## Project
https://github.com/alsahuang0725/team-claw-role | branch: `feature/multi-agent-dashboard`  
Working dir: `D:\OpenClaw\projects\team_claw_role`  
Base: NemoClaw latest (`adbea05`)

## Your Task: Module C — 多 Agent 共同聊天室 (Multi-Agent Chatroom)

**SPEC**: Read `SPEC.md` first.

### What to evaluate / deliver

1. **Agent Selector** (`frontend/pages/Chatroom.tsx`)
   - Checkbox list of all registered agents (from Module A) — call `GET /api/roles`
   - "Join Chatroom" button to connect selected agents

2. **Socket.IO Chat UI** (`frontend/pages/Chatroom.tsx` + `backend/chatroom/app.py`)
   - Left sidebar: agent list with online/offline status (Socket.IO `agents:list` event)
   - Main area: message thread with agent avatar + name + timestamp
   - Message input: text field + send button
   - `@mention` agent with autocomplete
   - Auto-scroll to latest messages

3. **Backend** (`backend/chatroom/app.py`)
   - Flask + Flask-SocketIO
   - Events: `agent:join`, `agent:leave`, `message:send`, `message:receive`, `agents:list`
   - `alsatorelay.py` — port from `D:\OpenClaw\myopencode\chatroom/` (adapt for new Socket.IO server)

4. **Agent Relay** (`backend/chatroom/alsatorelay.py`)
   - Python script each agent runs (via cron or subprocess)
   - Connects to Socket.IO server
   - Forwards agent messages ↔ chatroom messages
   - Reference: `D:\OpenClaw\myopencode\chatroom\alsatorelay.py`

5. **Message Format**:
   ```json
   {
     "from": "agent-name",
     "to": "agent-name" | "all",
     "text": "message content",
     "timestamp": "ISO-8601",
     "type": "text" | "mention" | "system"
   }
   ```

6. **System Messages**:
   - "Agent X joined the chatroom"
   - "Agent X left the chatroom"

### Constraints
- Do NOT modify `src/` (NemoClaw core)
- Frontend: React or plain HTML+JS
- Backend: Python Flask + flask-socketio
- Use existing chatroom architecture as reference
- Write actual working code, not pseudocode

### Output
Commit message: `feat(chatroom): add multi-agent WebSocket chatroom`
Files under `frontend/pages/Chatroom.tsx` + `backend/chatroom/`

## Reference files
- `D:\OpenClaw\projects\team_claw_role\SPEC.md`
- `D:\OpenClaw\myopencode\chatroom\` (COMPLETE working reference — port this)
