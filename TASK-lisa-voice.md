# CLAW.md — team-claw-role: Module D (Voice)

## Project
https://github.com/alsahuang0725/team-claw-role | branch: `feature/multi-agent-dashboard`  
Working dir: `D:\OpenClaw\projects\team_claw_role`  
Base: NemoClaw latest (`adbea05`)

## Your Task: Module D — edge-tts 語音系統 (Voice System)

**SPEC**: Read `SPEC.md` first.

### What to evaluate / deliver

1. **Voice Catalog** (`frontend/pages/VoiceCatalog.tsx`)
   - Grid of voice cards (4 built-in voices):
     - `zh-CN-YunxiNeural` — Male (default)
     - `zh-TW-HsiaoChenNeural` — Taiwan Female (default)
     - `zh-CN-XiaoxiaoNeural` — Female
     - `zh-TW-YunJheNeural` — Male/Taiwan
   - Each card: voice name, language, gender, play button (▶)
   - "Play" calls `GET /api/voices/{id}/preview` → backend returns short .mp3

2. **Voice Picker** (for Module A wizard Step 3)
   - Embeddable component: `frontend/components/VoicePicker.tsx`
   - Same voice grid, but radio selection instead of cards
   - Call `/api/voices` to get the list

3. **Backend TTS API** (`backend/tts/generate.py`)
   - `GET /api/voices` — return voice catalog (no auth needed)
   - `GET /api/voices/{voice}/preview` — generate and stream 5-second .mp3 preview
   - `POST /api/tts` — full TTS generation:
     ```json
     { "text": "...", "voice": "zh-TW-HsiaoChenNeural" }
     ```
     → returns `.mp3` file path or stream

4. **edge-tts Installation** (`skills/edge-tts/`)
   - `skills/edge-tts/SKILL.md` — port from `D:\OpenClaw\skills\edge-tts\SKILL.md`
   - `skills/edge-tts/install.sh` — pip install edge-tts
   - `skills/edge-tts/scripts/generate.py` — ported TTS generation script
   - Voice list (hardcoded):
     ```python
     VOICES = [
       {"id": "zh-CN-YunxiNeural", "name": "Yunxi", "gender": "Male", "lang": "zh-CN"},
       {"id": "zh-TW-HsiaoChenNeural", "name": "HsiaoChen", "gender": "Female", "lang": "zh-TW"},
       {"id": "zh-CN-XiaoxiaoNeural", "name": "Xiaoxiao", "gender": "Female", "lang": "zh-CN"},
       {"id": "zh-TW-YunJheNeural", "name": "YunJhe", "gender": "Male", "lang": "zh-TW"},
     ]
     ```

5. **Channel TTS Integration** (bonus if time permits)
   - WhatsApp: send voice message as `.mp3` attachment
   - LINE: use LINE Messaging API to send audio message
   - Nest Mini: `catt -d {ip} cast {file}.mp3` (for local deployment)

### Constraints
- Do NOT modify `src/` (NemoClaw core)
- edge-tts requires NO external API key (Microsoft Edge TTS — free)
- Python only for TTS backend
- Write actual working code, not pseudocode

### Output
Commit message: `feat(voice): add edge-tts voice system with catalog UI`
Files under `frontend/components/VoicePicker.tsx`, `frontend/pages/VoiceCatalog.tsx`, `backend/tts/`, `skills/edge-tts/`

## Reference files
- `D:\OpenClaw\projects\team_claw_role\SPEC.md`
- `D:\OpenClaw\skills\edge-tts\SKILL.md` (COMPLETE — port this)
- `D:\OpenClaw\TOOLS.md` (edge-tts usage notes)
