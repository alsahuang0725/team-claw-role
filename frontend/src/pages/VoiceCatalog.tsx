// frontend/pages/VoiceCatalog.tsx
// Module D — edge-tts Voice Catalog UI

import React, { useState, useEffect } from "react";
import { voicesApi, type Voice } from "../api/client";

const VOICE_DESCRIPTIONS: Record<string, string> = {
  "zh-CN-YunxiNeural": "沉穩自然的中國大陸男聲，適合專業場合",
  "zh-TW-HsiaoChenNeural": "溫柔年輕的台灣女聲，Alsa 專屬語音",
  "zh-CN-XiaoxiaoNeural": "清新活潑的中國大陸女聲",
  "zh-TW-YunJheNeural": "自然的台灣男聲",
};

const PREVIEW_TEXTS: Record<string, string> = {
  "zh-CN-YunxiNeural": "你好，歡迎使用企業智能助理系統。",
  "zh-TW-HsiaoChenNeural": "嗨！我是 Alsa，很高興為您服務。",
  "zh-CN-XiaoxiaoNeural": "嗨嗨！今天想聊什麼呢？",
  "zh-TW-YunJheNeural": "你好，歡迎使用智能助理系統。",
};

export default function VoiceCatalog() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "male" | "female">("all");
  const [generateText, setGenerateText] = useState("");
  const [generateVoice, setGenerateVoice] = useState("zh-TW-HsiaoChenNeural");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    voicesApi.list()
      .then(setVoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = voices.filter(v =>
    filter === "all" ? true : v.gender === filter
  );

  function playVoice(voice: Voice) {
    if (playing) return;
    setPlaying(voice.id);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(PREVIEW_TEXTS[voice.id] || "測試語音");
      utt.lang = voice.locale === "zh-TW" ? "zh-TW" : "zh-CN";
      utt.onend = () => setPlaying(null);
      utt.onerror = () => setPlaying(null);
      window.speechSynthesis.speak(utt);
    } else {
      // Try backend preview endpoint
      const audio = new Audio(`/api/voices/${voice.id}/preview`);
      audio.onended = () => setPlaying(null);
      audio.onerror = () => setPlaying(null);
      audio.play().catch(() => setPlaying(null));
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!generateText.trim()) return;
    setGenerating(true);
    setResultUrl(null);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: generateText, voice: generateVoice }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">語音設定</h1>
        <p className="text-sm text-gray-500 mt-1">
          edge-tts 內建語音庫（無需 API Key）· Microsoft Edge TTS 技術
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(["all", "male", "female"] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f === "all" ? "全部" : f === "male" ? "男聲" : "女聲"}
          </button>
        ))}
      </div>

      {/* Voice Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">載入中…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {filtered.map(voice => (
            <div key={voice.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{voice.name}</h3>
                  <span className="text-xs text-gray-400">{voice.id}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${voice.gender === "male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                  {voice.gender === "male" ? "♂ 男" : "♀ 女"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {VOICE_DESCRIPTIONS[voice.id] || voice.description || "邊緣 TTS 語音"}
              </p>
              <p className="text-xs text-gray-400 mb-3">語言：{voice.locale === "zh-TW" ? "繁體中文" : "簡體中文"}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => playVoice(voice)}
                  disabled={playing === voice.id}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5
                    ${playing === voice.id
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"}`}
                >
                  {playing === voice.id ? "🔊 播放中…" : "▶ 播放預覽"}
                </button>
                <span className={`px-3 py-1.5 rounded-lg text-xs
                  ${voice.id === "zh-TW-HsiaoChenNeural"
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "bg-gray-100 text-gray-500"}`}>
                  {voice.id === "zh-TW-HsiaoChenNeural" ? "⭐ Alsa 預設" : "可選"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TTS Generator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🔊 語音生成</h2>
        <p className="text-sm text-gray-500 mb-4">
          輸入文字，選擇語音，生成 MP3 音檔。
        </p>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">選擇語音</label>
            <select
              value={generateVoice}
              onChange={e => setGenerateVoice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {voices.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">輸入文字</label>
            <textarea
              value={generateText}
              onChange={e => setGenerateText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="輸入要轉換語音的文字…"
            />
          </div>
          <button
            type="submit"
            disabled={generating || !generateText.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {generating ? "生成中…" : "生成 MP3"}
          </button>
        </form>

        {resultUrl && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-2">✅ 語音已生成！</p>
            <audio src={resultUrl} controls className="w-full" />
            <a href={resultUrl} download="voice.mp3"
              className="mt-2 inline-block px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              下載 MP3
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
