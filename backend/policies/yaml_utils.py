# backend/policies/yaml_utils.py
# YAML read/write utilities for policy files

import os
import yaml
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Any


def get_policies_dir() -> Path:
    base = Path(__file__).parent.parent.parent  # team-claw-role/
    policies_dir = base / "policies" / "agents"
    policies_dir.mkdir(parents=True, exist_ok=True)
    return policies_dir


def load_policy(policy_id: str) -> dict | None:
    """Load a single policy YAML file."""
    path = get_policies_dir() / f"{policy_id}.yaml"
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def save_policy(data: dict) -> str:
    """Save a policy to YAML. Returns the policy_id."""
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    if "createdAt" not in data:
        data["createdAt"] = data["updatedAt"]

    path = get_policies_dir() / f"{data['id']}.yaml"
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False)
    return data["id"]


def delete_policy(policy_id: str) -> bool:
    """Delete a policy YAML file. Returns True if deleted."""
    path = get_policies_dir() / f"{policy_id}.yaml"
    if path.exists():
        path.unlink()
        return True
    return False


def list_policies() -> list[dict]:
    """List all policy YAML files in policies/agents/."""
    policies = []
    for path in get_policies_dir().glob("*.yaml"):
        try:
            with open(path, "r", encoding="utf-8") as f:
                policies.append(yaml.safe_load(f))
        except Exception:
            continue
    return sorted(policies, key=lambda p: p.get("createdAt", ""))
