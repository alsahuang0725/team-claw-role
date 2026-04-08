// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState, useCallback } from "react";
import type { Voice } from "../api/client";
import { api } from "../api/client";

interface Props {
  value: string;
  onChange: (voiceId: string) => void;
}

export function VoicePicker({ value, onChange }: Props) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "male" | "female">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listVoices()
      .then(setVoices)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const playVoice = useCallback(async (voice: Voice) => {
    if (playing) return;
    setPlaying(voice.id);
    try {
      // Use edge-tts via a public preview endpoint or the browser's Web Speech API as fallback
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(
          "你好，我是" + voice.name.split(" ")[0] + "。",
        );
        utt.lang = voice.locale === "zh-TW" ? "zh-TW" : "zh-CN";
        utt.onend = () => setPlaying(null);
        utt.onerror = () => setPlaying(null);
        window.speechSynthesis.speak(utt);
      } else {
        setPlaying(null);
      }
    } catch {
      setPlaying(null);
    }
  }, [playing]);

  const stopVoice = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(null);
  }, []);

  const filtered = voices.filter((v) => {
    if (filter === "male") return v.gender === "male";
    if (filter === "female") return v.gender === "female";
    return true;
  });

  return (
    <div className="voice-picker">
      {/* Filter tabs */}
      <div className="voice-picker__filters" role="group" aria-label="Filter by gender">
        {(["all", "male", "female"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`voice-picker__filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "全部" : f === "male" ? "男性" : "女性"}
          </button>
        ))}
      </div>

      {loading && <p className="voice-picker__status">載入語音列表中…</p>}
      {error && <p className="voice-picker__error" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="voice-picker__grid" role="radiogroup" aria-label="Select TTS voice">
          {filtered.map((voice) => (
            <button
              key={voice.id}
              type="button"
              className={`voice-card ${value === voice.edgeVoice ? "selected" : ""}`}
              onClick={() => onChange(voice.edgeVoice)}
              aria-pressed={value === voice.edgeVoice}
              title={voice.description}
            >
              <span className="voice-card__badge voice-card__badge--${voice.gender}">
                {voice.gender === "female" ? "♀" : "♂"}
              </span>
              <span className="voice-card__label">{voice.name}</span>
              <span className="voice-card__locale">
                {voice.locale === "zh-TW" ? "🇹🇼" : "🇨🇳"} {voice.locale}
              </span>
              <span className="voice-card__desc">{voice.description}</span>
              <span
                className="voice-card__play"
                role="button"
                aria-label={playing === voice.id ? "停止預覽" : "播放預覽"}
                onClick={(e) => {
                  e.stopPropagation();
                  playing === voice.id ? stopVoice() : playVoice(voice);
                }}
              >
                {playing === voice.id ? "⏹" : "▶"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
