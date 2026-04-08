# skills/edge-tts — edge-tts Voice Skill

## Overview

This skill integrates Microsoft Edge TTS (edge-tts) into the team-claw-role environment for offline, free text-to-speech voice generation. No API key required.

## Voices

| ID | Edge Voice | Gender | Locale | Description |
|----|------------|--------|--------|-------------|
| yunxi | zh-CN-YunxiNeural | male | zh-CN | Default male voice |
| hsiaochen | zh-TW-HsiaoChenNeural | female | zh-TW | Taiwan female — Alsa's voice |
| xiaoxiao | zh-CN-XiaoxiaoNeural | female | zh-CN | Lively female |
| yunjhe | zh-TW-YunJheNeural | male | zh-TW | Taiwan male |

## Installation

```bash
pip install edge-tts
```

Or use without pip:
```bash
python -m edge_tts --voice zh-TW-HsiaoChenNeural --text "你好" --write-media output.mp3
```

## Usage

### Python API

```python
from backend.tts.generate import generate_tts, is_edge_tts_available

# Check availability
print(is_edge_tts_available())  # True/False

# Generate speech
path = generate_tts("你好，歡迎使用！", "zh-TW-HsiaoChenNeural")
print(path)  # D:\...\outputs\abc123.mp3
```

### CLI

```bash
python -m edge_tts \
  --voice "zh-TW-HsiaoChenNeural" \
  --text "你好，這是測試語音" \
  --write-media output.mp3
```

### Preview voices

```bash
# List all available edge-tts voices
python -m edge_tts --list-voices
```

## HTTP API

- `GET /api/voices` — list all voices (filter: `?locale=zh-TW&gender=female`)
- `GET /api/voices/:id/preview` — stream 5-second preview .mp3
- `POST /api/tts` — body: `{ "text": "...", "voice": "zh-TW-HsiaoChenNeural" }` → .mp3

## Requirements

- Python 3.8+
- `edge-tts` package (or call via `python -m edge_tts`)
- Internet access (edge-tts calls Microsoft Edge TTS service — free, no auth)

## Channel TTS Integration

### WhatsApp
Generate `.mp3` → send as voice message attachment via WhatsApp API.

### LINE
Use LINE Messaging API to send audio message with the generated `.mp3`.

### Nest Mini
```bash
catt -d 192.168.0.198 cast output.mp3
```

## Alsa Voice

Alsa's current voice: **zh-TW-HsiaoChenNeural**

Used in:
- Morning greeting (Alsa Morning Greeting cron job)
- WhatsApp/Telegram responses
- Forum notification TTS
