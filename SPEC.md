# team-claw-role — SPEC.md

## 1. Project Overview

**Repository**: https://github.com/alsahuang0725/team-claw-role  
**Branch**: `feature/multi-agent-dashboard`  
**Base**: NVIDIA/NemoClaw latest (`adbea05`)  
**Stack**: TypeScript + Node.js + React (dashboard UI) + Python (voice/chatroom backend)  
**Goal**: Enterprise multi-agent management platform built on NemoClaw, with four new feature modules.

---

## 2. Feature Modules

### Module A — 角色總表 (Agent Role Dashboard)

**Route**: `/roles`

**Purpose**: List, create, edit, and delete Agent roles with full metadata.

**Sub-features**:
- **Role List**: Card grid with avatar photo (uploaded) + agent name + type badge (main/sub-agent) + last active time
- **Role Card Actions**: [Edit] [Delete] buttons per card
- **Delete Confirmation**: Modal with "type the role name to confirm" anti-accident guard
- **Create New Role Wizard** (multi-step modal or page):
  1. Select type: `main` or `sub-agent`
  2. Enter role name
  3. Select default TTS voice from edge-tts voice picker (see Module D for voice list)
  4. Enter job description (free-text field — the AI will use this to generate all `.md` files)
  5. **AI Preview**: LLM generates draft `SOUL.md`, `IDENTITY.md`, `AGENTS.md`, `USER.md`, `HEARTBEAT.md`, `MEMORY.md`, `TOOLS.md` from the job description; user sees all files in an editable text area
  6. User edits/adjusts preview files, then confirms
  7. Upload avatar image (for webchat display)
  8. Bind communication channels (LINE / WhatsApp — guide user through OAuth setup)
  9. Save → writes each `.md` file into the agent workspace directory + updates `openclaw.json`
  10. Return to Role List (new role appears)

**Data Model**:
```typescript
interface AgentRole {
  id: string;                  // UUID
  name: string;                // display name
  type: 'main' | 'sub-agent';
  workspaceDir: string;         // e.g. workspaces/{id}/
  ttsVoice: string;            // edge-tts voice name
  avatarPath: string;          // local file path or URL
  channels: ChannelBinding[];  // LINE, WhatsApp
  mdFiles: {
    soul?: string; identity?: string; agents?: string;
    user?: string; heartbeat?: string; memory?: string; tools?: string;
  };
  createdAt: string;
  updatedAt: string;
}
interface ChannelBinding {
  channel: 'line' | 'whatsapp';
  accountId?: string;
  status: 'pending' | 'active';
}
```

---

### Module B — 企業 Policy 設定 (Policy Engine)

**Route**: `/policies`

**Purpose**: Configure per-agent permission policies, referencing AISOClaw's default enterprise policies as fallbacks.

**Sub-features**:
- **Policy List**: Table with columns: Policy Name | Target Agent(s) | Actions [Edit] [Delete]
- **AISOClaw Default Policies** (read-only, shown with a badge "Shared Default"): These are the baseline templates every tenant inherits if not overridden.
- **Add Policy**:
  1. Select target agent(s) from dropdown (multi-select; or "All agents")
  2. Tool/Skill Permission Matrix (UI grid):
     - Rows: each available skill/tool
     - Columns: each selected agent
     - Cell values: `Allow` / `Deny` / `Audit`
  3. **Custom Policy block** (optional textarea): write free-form policy rules in YAML or natural language that apply to specific or all agents
  4. Save → writes to `policies/agents/{policy-id}.yaml`
- **Edit/Delete**: same flow, with confirmation for delete

**Data Model**:
```yaml
# policies/agents/{policy-id}.yaml
id: uuid
name: string
targetAgents: [agent-id, ...] | "all"
rules:
  - skill: skill-name
    agent: agent-id | "all"
    permission: allow | deny | audit
customRules: |
  # freeform policy text
```

---

### Module C — 多 Agent 共同聊天室 (Multi-Agent Chatroom)

**Route**: `/chatroom`

**Purpose**: Real-time WebSocket chatroom where selected agents can converse with each other and with users, powered by David-deployed Socket.IO backend.

**Sub-features**:
- **Agent Selector**: Checkbox list of all registered agents (from Module A) to invite into the chatroom
- **WebSocket Integration**: Auto-connect selected agents' relay scripts (`alsatorelay.py`) to the Socket.IO server
- **Chat UI**:
  - Left sidebar: agent list with online/offline status
  - Main area: message thread with agent avatars + timestamps
  - Message input: text + optional voice-to-text
  - "Mention" agent with `@agentname`
- **Backend**: Reuse `D:\OpenClaw\myopencode\chatroom/` architecture (Flask + Socket.IO + Python relay agents); port to `team-claw-role` repo under `backend/chatroom/`

**Tech Stack**:
- Frontend: React (Vite) or plain HTML + vanilla JS
- Backend: Python Flask + python-socketio
- Agent Relay: `alsatorelay.py` (Node ↔ Socket.IO bridge)
- Message format: JSON `{ from: string; to: string | "all"; text: string; timestamp: string }`

---

### Module D — edge-tts 語音系統 (Voice System)

**Purpose**: Integrate edge-tts into NemoClaw environment with pre-configured voices; allow agents to respond with voice in their channel.

**Sub-features**:
- **Voice Catalog** (built-in, no API key required):
  - Male voice: `zh-CN-YunxiNeural` (default)
  - Taiwan female voice: `zh-TW-HsiaoChenNeural` (default — this is Alsa's current voice)
  - Optional extras: `zh-CN-XiaoxiaoNeural`, `zh-TW-YunJheNeural`
- **Voice Picker UI** in Module A (create/edit role wizard): play button for each voice, click to preview
- **TTS Generation API**:
  ```python
  # backend/tts.py
  from edge_tts import EdgeTTS
  def generate_voice(text: str, voice: str, output_path: str):
      await EdgeTTS().generate(text, voice, output_path)
  ```
- **Channel Voice Reply**: When an agent selects a TTS voice, its responses in LINE/WhatsApp are spoken rather than (or in addition to) text. Implementation: generate `.mp3` → send as voice attachment or play via Nest Mini/NaturalSpeech device.

**Files to port from D:\OpenClaw**:
```
skills/edge-tts/SKILL.md
skills/edge-tts/scripts/
scripts/tts-converter.js   (if used)
```

---

## 3. Architecture

```
team-claw-role/
├── SPEC.md                   ← this file
├── README.md
├── src/                     ← NemoClaw core CLI (TypeScript, untouched)
├── nemoclaw/                ← NemoClaw OpenClaw plugin
├── docs/                    ← NemoClaw docs
├── frontend/                ← NEW: React dashboard
│   ├── pages/
│   │   ├── Roles.tsx        ← Module A
│   │   ├── Policies.tsx      ← Module B
│   │   ├── Chatroom.tsx     ← Module C
│   │   └── Voice.tsx       ← Module D (voice catalog)
│   ├── components/
│   ├── api/                 ← REST API client
│   └── App.tsx
├── backend/                 ← NEW: Python Flask backend
│   ├── chatroom/            ← Module C backend (Flask + Socket.IO)
│   │   ├── app.py
│   │   ├── alsatorelay.py
│   │   └── index.html       ← chat UI (or serve from frontend/)
│   ├── tts/                 ← Module D: edge-tts wrapper
│   │   └── generate.py
│   └── agents/              ← Agent CRUD API
│       └── routes.py
├── workspaces/              ← Agent role .md files generated by Module A
├── policies/                ← Policy YAML files from Module B
│   └── agents/
└── skills/                  ← Ported edge-tts skill
```

---

## 4. Implementation Phases

| Phase | Module | Owner | Description |
|-------|--------|-------|-------------|
| 0 | Setup | Alsa | Repo init, branch, SPEC commit, CI/CD skeleton |
| 1 | Module A | John + Lisa | Agent CRUD + Role Wizard + file generation |
| 2 | Module B | David | Policy engine + permission matrix UI |
| 3 | Module C | David + John | Socket.IO chatroom + relay agents |
| 4 | Module D | Lisa | edge-tts port + voice picker + channel TTS |

---

## 5. Constraints & Non-Goals

- **Do NOT** modify `src/` NemoClaw core CLI (base layer stays clean)
- **Do NOT** fork NVIDIA/NemoClaw publicly with custom changes (keep our repo independent)
- All new code must pass `eslint` + `vitest` (CI gate)
- Voice generation must work offline (edge-tts, no external TTS API)
- No breaking changes to existing NemoClaw CLI commands

---

## 6. Reference Files (already verified)

| File | Location | Purpose |
|------|----------|---------|
| edge-tts skill | `D:\OpenClaw\skills\edge-tts\SKILL.md` | Voice generation (complete) |
| Chatroom backend | `D:\OpenClaw\myopencode\chatroom\` | Socket.IO + relay architecture (complete) |
| AISOClaw defaults | `D:\OpenClaw\policies\` | Policy templates |
| NemoClaw src | `D:\OpenClaw\projects\team_claw_role\src\` | Base code reference |

---

_Last updated: 2026-04-08 by Alsa_
