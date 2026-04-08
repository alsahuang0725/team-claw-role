# backend/tts/generate.py
# Module D — edge-tts TTS generation
# Uses subprocess to call edge-tts CLI (no pip install needed)

import os
import uuid
import tempfile
import subprocess
from pathlib import Path

def get_output_dir() -> Path:
    base = Path(__file__).parent.parent.parent  # team-claw-role/
    out = base / "backend" / "tts" / "outputs"
    out.mkdir(parents=True, exist_ok=True)
    return out


def generate_tts(text: str, voice: str, output_filename: str | None = None) -> Path:
    """
    Generate TTS audio using edge-tts via subprocess.
    voice: edge-tts voice shortcode (e.g. "zh-TW-HsiaoChenNeural")
    Returns: Path to the generated .mp3 file.
    """
    output_dir = get_output_dir()
    filename = output_filename or f"{uuid.uuid4().hex[:8]}.mp3"
    output_path = output_dir / filename

    # Use Python's edge-tts module if available, otherwise call edge-tts CLI
    python_exe = _find_python()
    cmd = [
        str(python_exe),
        "-m", "edge_tts",
        "--voice", voice,
        "--text", text,
        "--write-media", str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"edge-tts failed: {result.stderr}")

    return output_path


def generate_preview(voice: str, text: str | None = None) -> Path:
    """Generate a short 5-second preview MP3."""
    preview_text = text or "你好，這是語音預覽。"
    filename = f"preview_{voice}.mp3"
    return generate_tts(preview_text, voice, filename)


def _find_python() -> Path:
    """Find the Python executable."""
    import sys
    return Path(sys.executable)


def is_edge_tts_available() -> bool:
    """Check if edge-tts is available."""
    try:
        python_exe = _find_python()
        r = subprocess.run(
            [str(python_exe), "-m", "edge_tts", "--version"],
            capture_output=True, text=True, timeout=10,
        )
        return r.returncode == 0
    except Exception:
        return False
