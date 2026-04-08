# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

"""
LLM-powered file generation for agent role workspaces.
Uses MiniMax API via Maton or falls back to OpenAI-compatible direct call.
"""

import json
import urllib.request
import urllib.error
import os
import time
from typing import Optional

# Load Maton API key from environment
MATON_API_KEY = os.getenv("MATON_API_KEY", "")
MINIMAX_DIRECT_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2"
MINIMAX_DIRECT_MODEL = "MiniMax-Text-01"


# ---------------------------------------------------------------------------
# MiniMax API call
# ---------------------------------------------------------------------------


def _call_minimax(messages: list[dict], model: str = MINIMAX_DIRECT_MODEL) -> str:
    """Call MiniMax ChatCompletion API directly."""
    body = json.dumps(
        {
            "model": model,
            "messages": messages,
            "max_tokens": 1024,
            "temperature": 0.7,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        MINIMAX_DIRECT_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {MATON_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
        return data["choices"][0]["message"]["content"]


def _call_with_retry(messages: list[dict], retries: int = 3) -> str:
    """Call with exponential back-off on rate-limit / 5xx."""
    for attempt in range(retries):
        try:
            return _call_minimax(messages)
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < retries - 1:
                wait = (2**attempt) + (time.time() % 1)
                time.sleep(wait)
                continue
            raise
    raise RuntimeError("MiniMax API failed after retries")


# ---------------------------------------------------------------------------
# System prompt for file generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an AI assistant helping to create agent role workspace files.
Given the job description, generate the following .md files for the new agent:

1. SOUL.md — Core character, attitude, tone, and values. Be specific and vivid.
2. IDENTITY.md — Technical identity, capabilities, and constraints.
3. AGENTS.md — Team role and relationship to other agents.
4. USER.md — Who the user is and how the agent should relate to them.
5. HEARTBEAT.md — Periodic health-check behaviour (what to monitor, what to report).
6. MEMORY.md — Memory strategy (short/long term, files to maintain).
7. TOOLS.md — Available tools, skills, and shortcuts.

Return ONLY a valid JSON object with keys: soul, identity, agents, user, heartbeat, memory, tools
Each value must be the full Markdown content of the file.
Do NOT include any explanation outside the JSON object."""


# ---------------------------------------------------------------------------
# Main generation function
# ---------------------------------------------------------------------------


def generate_role_files(
    job_description: str,
    role_type: str = "sub-agent",
    name: str = "Agent",
) -> dict[str, str]:
    """
    Generate draft .md workspace files from a job description.

    Returns dict of {filename: content} for all seven files.
    """
    if not MATON_API_KEY:
        raise RuntimeError(
            "MATON_API_KEY environment variable is not set. "
            "Set it to your Maton API key to use AI generation."
        )

    user_prompt = f"""Create workspace files for a **{role_type}** named **{name}**.

Job description:
---
{job_description}
---

Generate the seven .md files in JSON format."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    response_text = _call_with_retry(messages)

    # Strip markdown code fences if present
    response_text = response_text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    response_text = response_text.strip()

    try:
        files = json.loads(response_text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"LLM returned invalid JSON. Response:\n{response_text[:500]}"
        ) from exc

    # Normalise keys
    key_map = {
        "SOUL.md": "soul",
        "IDENTITY.md": "identity",
        "AGENTS.md": "agents",
        "USER.md": "user",
        "HEARTBEAT.md": "heartbeat",
        "MEMORY.md": "memory",
        "TOOLS.md": "tools",
    }
    result = {}
    for file_key, content in files.items():
        # Try both raw key and normalised key
        norm = file_key.strip().lower().replace(".md", "")
        for target in ("soul", "identity", "agents", "user", "heartbeat", "memory", "tools"):
            if target in norm:
                result[target] = content
                break
        else:
            # Fallback: try mapping dict
            for orig, tgt in key_map.items():
                if orig.lower().replace(".md", "") in norm or norm in orig.lower().replace(".md", ""):
                    result[tgt] = content
                    break

    return result
