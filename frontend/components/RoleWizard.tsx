// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState, useCallback } from "react";
import { VoicePicker } from "./VoicePicker";
import { rolesApi, uploadFile } from "../api/client";
import type { GeneratedFiles } from "../api/client";

// Wizard step IDs
type WizardStepId = "type" | "name" | "voice" | "job" | "preview" | "avatar" | "channels" | "save";

interface WizardState {
  type: "main" | "sub-agent";
  name: string;
  voice: string;
  jobDescription: string;
  generatedFiles: GeneratedFiles;
  editedFiles: GeneratedFiles;
  avatarFile: File | null;
  channels: Array<{ channel: "line" | "whatsapp"; status: "pending" | "active" }>;
}

// Wizard step sequence
const STEPS: { id: WizardStepId; label: string }[] = [
  { id: "type", label: "角色類型" },
  { id: "name", label: "角色名稱" },
  { id: "voice", label: "語音設定" },
  { id: "job", label: "任務描述" },
  { id: "preview", label: "AI 預覽" },
  { id: "avatar", label: "頭像上傳" },
  { id: "channels", label: "頻道設定" },
  { id: "save", label: "儲存" },
];

const FILE_LABELS: Record<keyof GeneratedFiles, string> = {
  soul: "SOUL.md — 核心人格",
  identity: "IDENTITY.md — 身份定位",
  agents: "AGENTS.md — 團隊角色",
  user: "USER.md — 用戶設定",
  heartbeat: "HEARTBEAT.md — 心跳報告",
  memory: "MEMORY.md — 記憶策略",
  tools: "TOOLS.md — 工具技能",
};

function emptyState(): WizardState {
  return {
    step: "type",
    roleType: "",
    roleName: "",
    ttsVoice: "zh-TW-HsiaoChenNeural",
    jobDescription: "",
    generatedFiles: {},
    avatarFile: null,
    avatarUrl: "",
    channels: [],
    isGenerating: false,
    isSaving: false,
    error: "",
  };
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export function RoleWizard({ onClose, onSaved }: Props) {
  const [s, setS] = useState<WizardState>(emptyState);

  const set = useCallback(<K extends keyof WizardState>(key: K, val: WizardState[K]) => {
    setS((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Step navigation
  const stepIndex = STEPS.findIndex((s2) => s2.id === s.step);

  const goTo = (stepId: WizardStepId) => set("step", stepId);
  const next = () => {
    const idx = STEPS.findIndex((s2) => s2.id === s.step);
    if (idx < STEPS.length - 1) set("step", STEPS[idx + 1].id);
  };
  const back = () => {
    const idx = STEPS.findIndex((s2) => s2.id === s.step);
    if (idx > 0) set("step", STEPS[idx - 1].id);
  };
  const canProceed = () => {
    switch (s.step) {
      case "type": return s.roleType !== "";
      case "name": return s.roleName.trim().length > 0;
      case "voice": return s.ttsVoice !== "";
      case "job": return s.jobDescription.trim().length > 10;
      case "preview": return true;
      case "avatar": return true; // optional
      case "channels": return true; // optional
      case "save": return true;
      default: return false;
    }
  };

  // Generate AI preview files
  const handleGenerate = useCallback(async () => {
    set("isGenerating", true);
    set("error", "");
    try {
      const files = await rolesApi.generate({
        jobDescription: s.jobDescription,
        type: s.roleType,
        name: s.roleName || "Agent",
      });
      set("generatedFiles", files);
      set("step", "preview");
    } catch (err) {
      set("error", (err as Error).message);
    } finally {
      set("isGenerating", false);
    }
  }, [s.jobDescription, s.roleType, s.roleName]);

  // Upload avatar
  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      set("avatarFile", file);
      set("avatarUrl", URL.createObjectURL(file));
    },
    [],
  );

  // Save role
  const handleSave = useCallback(async () => {
    set("isSaving", true);
    set("error", "");
    try {
      let avatarPath = "";
      if (s.avatarFile) {
        const uploaded = await uploadFile(s.avatarFile);
        avatarPath = uploaded.url;
      }
      await rolesApi.create({
        name: s.roleName,
        type: s.roleType as "main" | "sub-agent",
        ttsVoice: s.ttsVoice,
        avatarPath,
        channels: s.channels,
        mdFiles: s.generatedFiles,
      });
      onSaved();
    } catch (err) {
      set("error", (err as Error).message);
    } finally {
      set("isSaving", false);
    }
  }, [s]);

  return (
    <div className="role-wizard-overlay" role="dialog" aria-modal="true" aria-label="建立角色精靈">
      {/* Header */}
      <div className="role-wizard__header">
        <h2 className="role-wizard__title">建立新角色</h2>
        <div className="role-wizard__progress">
          {STEPS.map((step, i) => (
            <span
              key={step.id}
              className={`role-wizard__step-dot ${i <= stepIndex ? "active" : ""} ${i === stepIndex ? "current" : ""}`}
              title={step.label}
            />
          ))}
        </div>
        <button type="button" className="role-wizard__close" onClick={onClose} aria-label="關閉">✕</button>
      </div>

      {/* Step indicator */}
      <div className="role-wizard__step-bar">
        <span className="role-wizard__step-label">
          步驟 {stepIndex + 1}/{STEPS.length}：{STEPS[stepIndex].label}
        </span>
      </div>

      {/* Body */}
      <div className="role-wizard__body">

        {/* ── Step 1: Role Type ── */}
        {s.step === "type" && (
          <section className="role-wizard__section">
            <h3 className="role-wizard__section-title">選擇角色類型</h3>
            <div className="type-grid">
              {(["main", "sub-agent"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`type-card ${s.roleType === t ? "selected" : ""}`}
                  onClick={() => { set("roleType", t); }}
                  aria-pressed={s.roleType === t}
                >
                  <span className="type-card__icon">{t === "main" ? "👑" : "🤖"}</span>
                  <span className="type-card__title">{t === "main" ? "主 Agent" : "Sub-Agent"}</span>
                  <span className="type-card__desc">
                    {t === "main"
                      ? "團隊 Leader，負責統籌協調其他 Agent"
                      : "執行者，負責特定任務或領域"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Step 2: Role Name ── */}
        {s.step === "name" && (
          <section className="role-wizard__section">
            <h3 className="role-wizard__section-title">輸入角色名稱</h3>
            <label className="field-label" htmlFor="role-name">
              角色名稱
              <input
                id="role-name"
                type="text"
                className="text-input"
                placeholder="例如：Elvi、David、Henry"
                value={s.roleName}
                onChange={(e) => set("roleName", e.target.value)}
                maxLength={64}
                autoFocus
              />
            </label>
            <p className="field-hint">這會成為 Agent 的顯示名稱，也會作為 workspace 目錄名稱。</p>
          </section>
        )}

        {/* ── Step 3: Voice Picker ── */}
        {s.step === "voice" && (
          <section className="role-wizard__section">
            <h3 className="role-wizard__section-title">選擇預設 TTS 語音</h3>
            <VoicePicker
              value={s.ttsVoice}
              onChange={(voiceId) => set("ttsVoice", voiceId)}
            />
          </section>
        )}

        {/* ── Step 4: Job Description ── */}
        {s.step === "job" && (
          <section className="role-wizard__section">
            <h3 className="role-wizard__section-title">輸入任務描述</h3>
            <p className="field-hint">
              AI 會根據以下描述自動生成 SOUL.md、IDENTITY.md 等七份 workspace 檔案。
              請盡量詳細描述角色職責、性格、技能和目標。
            </p>
            <label className="field-label" htmlFor="job-desc">
              任務描述
              <textarea
                id="job-desc"
                className="textarea"
                placeholder="例如：Elvi 是團隊的小主管，協助 Alsa 分擔統籌工作。需要具備良好的時間管理能力、任務優先排序能力…"
                value={s.jobDescription}
                onChange={(e) => set("jobDescription", e.target.value)}
                rows={8}
                autoFocus
              />
            </label>
            <p className="field-hint field-hint--count">
              {s.jobDescription.length} 字（建議至少 50 字）
            </p>
          </section>
        )}

        {/* ── Step 5: AI Preview ── */}
        {s.step === "preview" && (
          <section className="role-wizard__section">
            <h3 className="role-wizard__section-title">AI 預覽 — 產出檔案</h3>
            <p className="field-hint">
              以下為 AI 根據任務描述自動生成的草案。你可以編輯或調整任何內容後，再儲存角色。
            </p>
            {(Object.keys(s.generatedFiles) as (keyof GeneratedFiles)[]).length === 0 ? (
              <div className="preview-empty">
                <p>尚無生成內容。</p>
                <button type="button" className="btn btn--secondary" onClick={() => set("step", "job")}>
                  返回修改任務描述
                </button>
              </div>
            ) : (
              <div className="preview-grid">
                {(Object.keys(s.generatedFiles) as (keyof GeneratedFiles)[]).map((fileKey) => (
                  <div key={fileKey} className="preview-file">
                    <label className="preview-file__label" htmlFor={`file-${fileKey}`}>
                      {FILE_LABELS[fileKey]}
                    </label>
                    <textarea
                      id={`file-${fileKey}`}
                      className="textarea preview-file__textarea"
                      value={s.generatedFiles[fileKey] ?? ""}
                      onChange={(e) =>
                        set("generatedFiles", { ...s.generatedFiles, [fileKey]: e.target.value })
                      }
                      rows={10}
                    />
                  </div>
                ))}
              </div>
            )}
            {s.error && <p className="field-error" role="alert">{s.error}</p>}
          </section>
        )}

        {/* ── Step 6: Avatar Upload ── */}
        {s.step === "avatar" && (
          <section className="role-wizard__section">
            <h3 className="role-wizard__section-title">上傳頭像</h3>
            <p className="field-hint">支援 PNG / JPG / GIF / WebP，大小上限 5MB。（可略過）</p>
            <div className="avatar-upload">
              {s.avatarUrl && (
                <img src={s.avatarUrl} alt="角色頭像預覽" className="avatar-upload__preview" />
              )}
              <label className="btn btn--secondary">
                {s.avatarFile ? "更換圖片" : "選擇圖片"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>
              {s.avatarFile && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => { set("avatarFile", null); set("avatarUrl", ""); }}
                >
                  移除
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Step 7: Channel Bind ── */}
        {s.step === "channels" && (
          <section className="role-wizard__section">
            <h3 className="role-wizard__section-title">綁定通訊頻道</h3>
            <p className="field-hint">可略過，稍後在角色編輯頁面再設定。</p>
            {(["line", "whatsapp"] as const).map((ch) => {
              const binding = s.channels.find((c) => c.channel === ch);
              return (
                <div key={ch} className="channel-row">
                  <span className="channel-row__icon">{ch === "line" ? "💬" : "📱"}</span>
                  <span className="channel-row__name">{ch === "line" ? "LINE" : "WhatsApp"}</span>
                  <button
                    type="button"
                    className={`btn btn--sm ${binding ? "btn--active" : "btn--ghost"}`}
                    onClick={() => {
                      if (binding) {
                        set("channels", s.channels.filter((c) => c.channel !== ch));
                      } else {
                        set("channels", [
                          ...s.channels,
                          { channel: ch, status: "pending" },
                        ]);
                      }
                    }}
                  >
                    {binding ? "已啟用" : "啟用"}
                  </button>
                  {binding && binding.status === "pending" && (
                    <a
                      href="#"
                      className="channel-row__guide"
                      onClick={(e) => e.preventDefault()}
                    >
                      OAuth 設定教學 ↗
                    </a>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ── Step 8: Save / Final Confirm ── */}
        {s.step === "save" && (
          <section className="role-wizard__section">
            <h3 className="role-wizard__section-title">確認並儲存</h3>
            <div className="save-summary">
              <dl className="save-summary__list">
                <dt>角色名稱</dt><dd>{s.roleName || "—"}</dd>
                <dt>類型</dt><dd>{s.roleType === "main" ? "主 Agent" : "Sub-Agent"}</dd>
                <dt>TTS 語音</dt><dd>{s.ttsVoice}</dd>
                <dt>Avatar</dt><dd>{s.avatarFile ? s.avatarFile.name : "未上傳"}</dd>
                <dt>頻道</dt>
                <dd>
                  {s.channels.length > 0
                    ? s.channels.map((c) => c.channel).join(", ")
                    : "無"}
                </dd>
              </dl>
            </div>
            {s.error && <p className="field-error" role="alert">{s.error}</p>}
          </section>
        )}
      </div>

      {/* Footer navigation */}
      <div className="role-wizard__footer">
        {stepIndex > 0 && (
          <button type="button" className="btn btn--ghost" onClick={back}>
            ← 上一步
          </button>
        )}
        <div className="role-wizard__footer-spacer" />
        {s.step === "job" ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleGenerate}
            disabled={s.isGenerating || !canProceed()}
          >
            {s.isGenerating ? "生成中…" : "✨ 產生 AI 草案"}
          </button>
        ) : s.step === "save" ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSave}
            disabled={s.isSaving}
          >
            {s.isSaving ? "儲存中…" : "💾 儲存角色"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={next}
            disabled={!canProceed()}
          >
            下一步 →
          </button>
        )}
      </div>
    </div>
  );
}
