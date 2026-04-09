# team-claw-role

> **Status:** development · Module E (UI 驗收) pending Ryan review

Enterprise multi-agent management platform built on [NVIDIA NemoClaw](https://github.com/NVIDIA/NemoClaw).

## Architecture

```
team-claw-role/
├── frontend/           React + TypeScript + Vite
├── backend/
│   ├── agents/        Module A — Role CRUD + AI file generation
│   ├── policies/      Module B — Policy Engine
│   ├── chatroom/      Module C — Socket.IO chatroom
│   └── tts/           Module D — edge-tts voice catalog
├── nemoclaw/          NemoClaw plugin (TypeScript, OpenClaw extension)
├── docker-compose.yml
└── Dockerfile         (NemoClaw sandbox image — for full OpenClaw deployment)
```

### Modules

| Module | Description |
|--------|-------------|
| **A — Roles** | Agent role CRUD, SOUL.md/IDENTITY.md/AGENTS.md generation via LLM |
| **B — Policies** | Policy Engine with 19-skill permission matrix (Allow/Deny/Audit) |
| **C — Chatroom** | Socket.IO real-time group chat with AgentRelay |
| **D — Voice** | edge-tts voice catalog + TTS generation |

## Local Development

### Prerequisites

- Python 3.12 (ComfyUI embedded Python at `C:\Users\Ryan\documents\comfyui\python_embeded\python.exe`)
- Node.js 22+
- Docker (optional, for Docker deployment)

### Backend

```bash
cd team_claw_role
C:\Users\Ryan\documents\comfyui\python_embeded\python.exe backend/server.py
# → http://localhost:8000
```

**API endpoints:**

| Path | Description |
|------|-------------|
| `GET /health` | Health check |
| `GET /api/roles` | List all roles |
| `POST /api/roles` | Create role |
| `GET|POST /api/policies` | Policy Engine |
| `GET /api/chatroom/rooms/<room>` | Chatroom |
| `GET /api/voices` | Voice catalog |
| `POST /api/voices/generate` | TTS generation |

### Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000 (dev mode with API proxy)
npm run build   # production build
```

## Docker Deployment

```bash
cd team_claw_role
docker compose up --build
# → Frontend: http://localhost:3001
# → Backend:  http://localhost:8000
```

## Version Info

- **NemoClaw base:** [adbea05](https://github.com/NVIDIA/NemoClaw/commit/adbea05)
- **OpenClaw:** Inherits version from host Alsa gateway (v2026.3.28+)
- **Node.js:** ≥22.16.0 required

## Team

| Member | Role |
|--------|------|
| John | System architecture, Module A/B |
| David | Policy Engine, Module C |
| Lisa | Voice/Avatar, Module D |
| Alsa | Project lead, coordination |
