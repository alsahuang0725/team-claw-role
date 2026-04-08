# backend/policies/app.py
# Flask API for Policy CRUD — Module B of team-claw-role

import os
import json
import subprocess
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

from .yaml_utils import (
    load_policy,
    save_policy,
    delete_policy,
    list_policies,
    get_policies_dir,
)

app = Flask(__name__)
app.config["SECRET_KEY"] = "team-claw-role-secret"
CORS(app)

# ---------------------------------------------------------------------------
# Shared Default Policies (read-only baseline from AISOClaw)
# Stored in policies/shared/ — not deletable via API
# ---------------------------------------------------------------------------

SHARED_DEFAULTS = [
    {
        "id": "aiso-actions-v1",
        "name": "AISOClaw Actions Policy",
        "isSharedDefault": True,
        "description": "Baseline require_approval / auto_approve rules from AISOClaw.",
        "targetAgents": ["all"],
        "rules": [
            {"skill": "actions:send_message:external", "permission": "audit"},
            {"skill": "actions:post_public", "permission": "deny"},
            {"skill": "actions:delete_file", "permission": "deny"},
            {"skill": "actions:trading_open", "permission": "deny"},
            {"skill": "actions:modify_config", "permission": "audit"},
            {"skill": "actions:read_file", "permission": "allow"},
            {"skill": "actions:check_status", "permission": "allow"},
            {"skill": "actions:send_to_ryan", "permission": "allow"},
        ],
        "customRules": "",
        "createdAt": "2026-03-19T00:00:00Z",
        "updatedAt": "2026-03-19T00:00:00Z",
    },
    {
        "id": "aiso-exec-whitelist-v1",
        "name": "AISOClaw Exec Whitelist",
        "isSharedDefault": True,
        "description": "Baseline exec allowlist from AISOClaw.",
        "targetAgents": ["all"],
        "rules": [
            {"skill": "exec:allowed_scripts", "permission": "allow"},
            {"skill": "exec:system_commands", "permission": "allow"},
            {"skill": "exec:dangerous_patterns", "permission": "deny"},
        ],
        "customRules": "",
        "createdAt": "2026-03-19T00:00:00Z",
        "updatedAt": "2026-03-19T00:00:00Z",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _all_policies() -> list[dict]:
    """Return shared defaults + user-defined policies."""
    return SHARED_DEFAULTS + list_policies()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/policies", methods=["GET"])
def get_policies():
    """List all policies (shared defaults + user-defined)."""
    return jsonify({"policies": _all_policies()})


@app.route("/api/policies/<policy_id>", methods=["GET"])
def get_policy(policy_id: str):
    """Get a single policy by ID."""
    for d in SHARED_DEFAULTS:
        if d["id"] == policy_id:
            return jsonify(d)
    p = load_policy(policy_id)
    if p is None:
        return jsonify({"error": "Policy not found"}), 404
    return jsonify(p)


@app.route("/api/policies", methods=["POST"])
def create_policy():
    """Create a new policy."""
    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"error": "Policy name is required"}), 400

    policy = {
        "name": data["name"],
        "targetAgents": data.get("targetAgents", ["all"]),
        "rules": data.get("rules", []),
        "customRules": data.get("customRules", ""),
        "description": data.get("description", ""),
    }
    policy_id = save_policy(policy)
    return jsonify({"id": policy_id, **policy}), 201


@app.route("/api/policies/<policy_id>", methods=["PUT"])
def update_policy(policy_id: str):
    """Update an existing policy."""
    for d in SHARED_DEFAULTS:
        if d["id"] == policy_id:
            return jsonify({"error": "Shared default policies are read-only"}), 403

    existing = load_policy(policy_id)
    if existing is None:
        return jsonify({"error": "Policy not found"}), 404

    data = request.get_json() or {}
    existing["name"] = data.get("name", existing["name"])
    existing["targetAgents"] = data.get("targetAgents", existing["targetAgents"])
    existing["rules"] = data.get("rules", existing["rules"])
    existing["customRules"] = data.get("customRules", existing["customRules"])
    existing["description"] = data.get("description", existing["description"])
    save_policy(existing)
    return jsonify(existing)


@app.route("/api/policies/<policy_id>", methods=["DELETE"])
def remove_policy(policy_id: str):
    """Delete a policy. Shared defaults cannot be deleted."""
    for d in SHARED_DEFAULTS:
        if d["id"] == policy_id:
            return jsonify({"error": "Shared default policies cannot be deleted"}), 403

    if delete_policy(policy_id):
        return jsonify({"deleted": policy_id})
    return jsonify({"error": "Policy not found"}), 404


@app.route("/api/skills", methods=["GET"])
def get_skills():
    """List available skills/tools from the workspace."""
    skills_dir = Path(__file__).parent.parent.parent / "skills"
    skills = []
    if skills_dir.exists():
        for d in skills_dir.iterdir():
            if d.is_dir() and (d / "SKILL.md").exists():
                skills.append({
                    "id": d.name,
                    "name": d.name.replace("-", " ").replace("_", " ").title(),
                    "path": str(d),
                })
    return jsonify({"skills": sorted(skills, key=lambda s: s["name"])})


@app.route("/api/roles", methods=["GET"])
def get_roles_for_policy():
    """Return roles that can be targeted by policies (from Module A workspaces/)."""
    from pathlib import Path
    import json as _json

    base = Path(__file__).parent.parent.parent
    workspaces = base / "workspaces"
    roles = []
    if workspaces.exists():
        for role_dir in workspaces.iterdir():
            manifest = role_dir / "manifest.json"
            if manifest.exists():
                try:
                    data = _json.loads(manifest.read_text(encoding="utf-8"))
                    roles.append({"id": role_dir.name, "name": data.get("name", role_dir.name)})
                except Exception:
                    pass
    return jsonify({"roles": roles})
