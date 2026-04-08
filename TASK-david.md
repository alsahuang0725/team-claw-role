# CLAW.md — team-claw-role: Module B

## Project
https://github.com/alsahuang0725/team-claw-role | branch: `feature/multi-agent-dashboard`  
Working dir: `D:\OpenClaw\projects\team_claw_role`  
Base: NemoClaw latest (`adbea05`)

## Your Task: Module B — 企業 Policy 設定 (Policy Engine)

**SPEC**: Read `SPEC.md` first.

### What to evaluate / deliver

1. **Policy List UI** (`frontend/pages/Policies.tsx`)
   - Table: Policy Name | Target Agent(s) | [Edit] [Delete]
   - AISOClaw default policies shown with "Shared Default" badge (read-only)
   - Empty state with "Add Policy" CTA

2. **Add/Edit Policy Wizard** (multi-step)
   Step 1: Enter policy name
   Step 2: Select target agent(s) — multi-select dropdown from registered agents (call `GET /api/roles`)
   Step 3: **Permission Matrix** — UI grid:
     - Rows: list of all available skills (from `openclaw skills list`) and tools
     - Columns: selected agents
     - Cell: radio buttons `Allow` / `Deny` / `Audit`
   Step 4: **Custom Rules** — optional YAML/text textarea for free-form policy rules
   Step 5: Save → `POST /api/policies`

3. **Backend API** (`backend/policies/routes.py`)
   - `GET /api/policies` — list all policies
   - `POST /api/policies` — create policy (write to `policies/agents/{id}.yaml`)
   - `PUT /api/policies/{id}` — update
   - `DELETE /api/policies/{id}` — delete with confirmation
   - `GET /api/skills` — list available skills from OpenClaw

4. **AISOClaw Default Policies** (reference):
   Read `D:\OpenClaw\policies\` for existing policy format and content. These become the read-only "Shared Default" baseline in the UI.

5. **Policy YAML format** (output):
   ```yaml
   # policies/agents/{uuid}.yaml
   id: uuid
   name: string
   targetAgents: [agent-id, ...] | "all"
   rules:
     - skill: skill-name
       agent: agent-id | "all"
       permission: allow | deny | audit
   customRules: |
     # freeform YAML
   createdAt: ISO timestamp
   updatedAt: ISO timestamp
   ```

### Constraints
- Do NOT modify `src/` (NemoClaw core)
- TypeScript + React for frontend, Python Flask for backend
- Policies directory: `D:\OpenClaw\projects\team_claw_role\policies\agents\`
- Write actual working code, not pseudocode

### Output
Commit message: `feat(policies): add policy engine with permission matrix UI`
Files under `frontend/pages/Policies.tsx` + `backend/policies/`

## Reference files
- `D:\OpenClaw\projects\team_claw_role\SPEC.md`
- `D:\OpenClaw\policies\` (AISOClaw policy templates — read first)
