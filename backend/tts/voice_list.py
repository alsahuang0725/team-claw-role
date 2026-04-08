# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

"""
Built-in edge-tts voice catalog for Module A voice picker + Module D TTS.
No API key required — uses the Microsoft Edge TTS service directly.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Voice:
    id: str  # internal key e.g. "yunxi"
    name: str  # display label e.g. "Yunxi (Male, Mainland)"
    edge_voice: str  # actual edge-tts voice shortcode
    gender: str  # "male" | "female"
    locale: str  # "zh-CN" | "zh-TW"
    description: str = ""


VOICES: list[Voice] = [
    Voice(
        id="yunxi",
        name="Yunxi (Male, Mainland)",
        edge_voice="zh-CN-YunxiNeural",
        gender="male",
        locale="zh-CN",
        description="Default male voice for mainland Chinese accent.",
    ),
    Voice(
        id="hsiaochen",
        name="HsiaoChen (Female, Taiwan)",
        edge_voice="zh-TW-HsiaoChenNeural",
        gender="female",
        locale="zh-TW",
        description="Taiwan female voice — Alsa's current voice.",
    ),
    Voice(
        id="xiaoxiao",
        name="Xiaoxiao (Female, Mainland)",
        edge_voice="zh-CN-XiaoxiaoNeural",
        gender="female",
        locale="zh-CN",
        description="Young, lively mainland Chinese female voice.",
    ),
    Voice(
        id="yunjhe",
        name="YunJhe (Male, Taiwan)",
        edge_voice="zh-TW-YunJheNeural",
        gender="male",
        locale="zh-TW",
        description="Taiwan male voice, slightly deeper tone.",
    ),
    Voice(
        id="xiaoyi",
        name="XiaoYi (Female, Mainland)",
        edge_voice="zh-CN-XiaoyiNeural",
        gender="female",
        locale="zh-CN",
        description="Young female voice with clear articulation.",
    ),
    Voice(
        id="yunyang",
        name="YunYang (Male, Mainland)",
        edge_voice="zh-CN-YunYangNeural",
        gender="male",
        locale="zh-CN",
        description="Professional male voice, good for news/reading.",
    ),
    Voice(
        id="hsiaoyu",
        name="HsiaoYu (Female, Taiwan)",
        edge_voice="zh-TW-HsiaoYuNeural",
        gender="female",
        locale="zh-TW",
        description="Taiwan female voice, softer and warmer tone.",
    ),
    Voice(
        id="yunxia",
        name="YunXia (Female, Mainland)",
        edge_voice="zh-CN-YunXiaNeural",
        gender="female",
        locale="zh-CN",
        description="Young female with cute, high-pitched voice.",
    ),
]


def get_voices(
    locale: Optional[str] = None,
    gender: Optional[str] = None,
) -> list[Voice]:
    """Return voices filtered by locale and/or gender."""
    result = VOICES
    if locale:
        result = [v for v in result if v.locale == locale]
    if gender:
        result = [v for v in result if v.gender == gender]
    return result


def get_voice_by_id(voice_id: str) -> Optional[Voice]:
    return next((v for v in VOICES if v.id == voice_id), None)


def get_edge_voice_name(voice_id: str) -> str:
    """Return the edge-tts shortcode for a given voice id."""
    voice = get_voice_by_id(voice_id)
    return voice.edge_voice if voice else voice_id


# ---------------------------------------------------------------------------
# FastAPI route compatible serializer
# ---------------------------------------------------------------------------


def voices_api() -> list[dict]:
    return [
        {
            "id": v.id,
            "name": v.name,
            "edgeVoice": v.edge_voice,
            "gender": v.gender,
            "locale": v.locale,
            "description": v.description,
        }
        for v in VOICES
    ]
