# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

"""
Flask API for agent role CRUD + AI file generation.
Serves Module A of the team-claw-role dashboard.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

from .generate import generate_role_files
from ..tts.voice_list import voices_api

BASE_DIR = Path(__file__).parent.parent.parent  # team-claw-role/
WORKSPACES_DIR = BASE_DIR / "workspaces"
UPLOADS_DIR = BASE_DIR / "uploads"

app = Flask(__name__)
app.config["SECRET_KEY"] = "team-claw-role-secret"
CORS(app)

WORKSPACES_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _workspace_manifest(role_id: str) -> Path:
    return WORKSPACES_DIR / role_id / "manifest.json"


def _load_roles() -> list[dict]:
    """Scan all workspaces/ and return a list of role manifests."""
    roles = []
    for role_dir in WORKSPACES_DIR.iterdir():
        if not role_dir.is_dir():
            continue
        manifest_path = role_dir / "manifest.json"
        if manifest_path.exists():
            try:
                roles.append(json.loads(manifest_path.read_text(encoding="utf-8")))
            except Exception:
                pass
    roles.sort(key=lambda r: r.get("createdAt", ""))
    return roles


def _save_manifest(role_id: str, data: dict) -> None:
    manifest_path = _workspace_manifest(role_id)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/api/voices", methods=["GET"])
def list_voices():
    """Return the built-in edge-tts voice catalog."""
    locale = request.args.get("locale")
    gender = request.args.get("gender")
    from ..tts.voice_list import get_voices
    voices = get_voices(locale=locale, gender=gender)
    return jsonify([{
        "id": v.id,
        "name": v.name,
        "edgeVoice": v.edge_voice,
        "gender": v.gender,
        "locale": v.locale,
        "description": v.description,
    } for v in voices])


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()})


# GET /api/roles — list all roles
@app.route("/api/roles", methods=["GET"])
def list_roles():
    roles = _load_roles()
    return jsonify(roles)


# POST /api/roles — create a new role
@app.route("/api/roles", methods=["POST"])
def create_role():
    body = request.get_json() or {}

    role_id = body.get("id", str(uuid.uuid4()))
    name = body.get("name", "").strip()
    role_type = body.get("type", "sub-agent")
    tts_voice = body.get("ttsVoice", "zh-TW-HsiaoChenNeural")
    avatar_path = body.get("avatarPath", "")
    channels = body.get("channels", [])
    md_files = body.get("mdFiles", {})
    workspace_dir = WORKSPACES_DIR / role_id

    if not name:
        return jsonify({"error": "name is required"}), 400

    now = datetime.now(timezone.utc).isoformat()

    # Write each .md file
    for filename, content in md_files.items():
        if content:
            file_path = workspace_dir / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content, encoding="utf-8")

    manifest = {
        "id": role_id,
        "name": name,
        "type": role_type,
        "workspaceDir": str(workspace_dir),
        "ttsVoice": tts_voice,
        "avatarPath": avatar_path,
        "channels": channels,
        "mdFiles": {k: v for k, v in md_files.items() if v},
        "createdAt": now,
        "updatedAt": now,
    }
    _save_manifest(role_id, manifest)
    return jsonify(manifest), 201


# PUT /api/roles/<id> — update a role
@app.route("/api/roles/<role_id>", methods=["PUT"])
def update_role(role_id: str):
    manifest_path = _workspace_manifest(role_id)
    if not manifest_path.exists():
        return jsonify({"error": "role not found"}), 404

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    body = request.get_json() or {}

    for field in ("name", "type", "ttsVoice", "avatarPath", "channels", "mdFiles"):
        if field in body:
            manifest[field] = body[field]

    manifest["updatedAt"] = datetime.now(timezone.utc).isoformat()

    # Update .md files on disk
    for filename, content in manifest.get("mdFiles", {}).items():
        if content:
            (Path(manifest["workspaceDir"]) / filename).write_text(content, encoding="utf-8")

    _save_manifest(role_id, manifest)
    return jsonify(manifest)


# DELETE /api/roles/<id> — delete a role
@app.route("/api/roles/<role_id>", methods=["DELETE"])
def delete_role(role_id: str):
    manifest_path = _workspace_manifest(role_id)
    if not manifest_path.exists():
        return jsonify({"error": "role not found"}), 404

    confirm_name = request.args.get("confirm", "")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if confirm_name and confirm_name != manifest.get("name", ""):
        return jsonify({"error": "confirmation name mismatch"}), 400

    import shutil
    workspace_dir = Path(manifest.get("workspaceDir", WORKSPACES_DIR / role_id))
    if workspace_dir.exists():
        shutil.rmtree(workspace_dir)

    return jsonify({"deleted": role_id})


# POST /api/roles/generate — LLM generate draft .md files
@app.route("/api/roles/generate", methods=["POST"])
def generate_role():
    body = request.get_json() or {}
    job_description = body.get("jobDescription", "").strip()
    role_type = body.get("type", "sub-agent")
    name = body.get("name", "").strip() or "Agent"

    if not job_description:
        return jsonify({"error": "jobDescription is required"}), 400

    try:
        files = generate_role_files(job_description, role_type, name)
        return jsonify(files)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# POST /api/upload — avatar file upload
@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "no file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "empty filename"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
        return jsonify({"error": "unsupported image type"}), 400

    role_id = request.form.get("roleId", "")
    filename = f"{role_id}_avatar{ext}" if role_id else file.filename
    save_path = UPLOADS_DIR / filename
    file.save(save_path)

    return jsonify({"url": f"/uploads/{filename}", "path": str(save_path)})


# Serve uploaded files in dev
@app.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename: str):
    from flask import send_from_directory
    return send_from_directory(UPLOADS_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
