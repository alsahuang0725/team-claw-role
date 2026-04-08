# CLAW.md — team-claw-role team

## Project
https://github.com/alsahuang0725/team-claw-role | branch: `feature/multi-agent-dashboard`  
Working dir: `D:\OpenClaw\projects\team_claw_role`  
Repo is NEW (empty), branch created from NemoClaw latest (`adbea05`).

## Architecture
- `src/` — NemoClaw core CLI (READ ONLY, do not modify)
- `frontend/` — NEW React dashboard (Module A/B/C/D UI)
- `backend/` — NEW Python Flask backend (API + Socket.IO chatroom + TTS)
- `workspaces/` — Agent role .md files (Module A output)
- `policies/` — Policy YAML files (Module B output)
- `skills/` — Ported edge-tts skill (Module D)

## Your Task: Module A — 角色總表 (Agent Role Dashboard)

**SPEC**: Read `SPEC.md` first.

### What to evaluate / deliver

1. **Frontend skeleton** (`frontend/pages/Roles.tsx`)
   - Role list: card grid with avatar + name + type badge + last active
   - Edit / Delete buttons per card
   - Delete confirmation modal ("type role name to confirm")

2. **Create Role Wizard** (multi-step)
   Step 1: Select type (`main` / `sub-agent`)
   Step 2: Enter role name
   Step 3: Select TTS voice (voice picker, call backend `/api/voices` to list edge-tts voices)
   Step 4: Enter job description (textarea)
   Step 5: **AI Preview** — call `/api/roles/generate` (backend LLM) to generate draft .md files; show all in editable `<textarea>` grid
   Step 6: Upload avatar (file input → upload to `/api/upload`)
   Step 7: Bind channels (LINE / WhatsApp checkboxes + OAuth guide link)
   Step 8: Save → `POST /api/roles`

3. **Backend API** (`backend/agents/routes.py`)
   - `GET /api/roles` — list all roles (from `workspaces/*.json` manifest)
   - `POST /api/roles` — create role: write .md files to `workspaces/{id}/`, create manifest JSON
   - `PUT /api/roles/{id}` — update role
   - `DELETE /api/roles/{id}` — delete (with confirmation)
   - `POST /api/roles/generate` — LLM generate draft .md files from job description
   - `POST /api/upload` — avatar file upload

4. **AI Preview generation prompt** (for the LLM call in Step 5):
   System prompt to generate: SOUL.md, IDENTITY.md, AGENTS.md, USER.md, HEARTBEAT.md, MEMORY.md, TOOLS.md based on job description.

### Constraints
- Do NOT modify `src/` (NemoClaw core)
- TypeScript + React for frontend, Python Flask for backend
- ESLint must pass
- Write actual working code, not pseudocode

### Output
Write all files under `D:\OpenClaw\projects\team_claw_role\frontend\` and `D:\OpenClaw\projects\team_claw_role\backend\agents\`
Commit with message: `feat(roles): add agent role dashboard with create wizard`

## Reference files
- `D:\OpenClaw\projects\team_claw_role\SPEC.md`
- `D:\OpenClaw\myopencode\chatroom\` (reference for Flask structure)
- `D:\OpenClaw\agents\` (reference for agent workspace format)
