// frontend/pages/Roles.tsx
// Module A — Agent Role Dashboard (main page)
// Uses RoleWizard component from John

import React, { useState, useEffect, useCallback } from "react";
import { rolesApi, type AgentRole } from "../api/client";
import RoleWizard from "../components/RoleWizard";

const AVATAR_FALLBACK = "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=agent";

function RoleCard({ role, onEdit, onDelete }: {
  role: AgentRole;
  onEdit: (r: AgentRole) => void;
  onDelete: (r: AgentRole) => void;
}) {
  const [deleteInput, setDeleteInput] = useState("");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={role.avatarPath || AVATAR_FALLBACK}
          alt={role.name}
          className="w-12 h-12 rounded-full bg-gray-100 object-cover flex-shrink-0"
          onError={e => { (e.target as HTMLImageElement).src = AVATAR_FALLBACK; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{role.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
              ${role.type === "main" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
              {role.type === "main" ? "Main" : "Sub-agent"}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {role.ttsVoice || "未設定語音"}
          </p>
        </div>
      </div>

      {/* Channels */}
      {role.channels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {role.channels.map(ch => (
            <span key={ch.channel}
              className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${ch.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"}`}>
              {ch.channel.toUpperCase()} {ch.status === "active" ? "🟢" : "⚪"}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(role)}
          className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
        >
          編輯
        </button>
        <button
          onClick={() => onDelete(role)}
          className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
        >
          刪除
        </button>
      </div>
    </div>
  );
}

export default function Roles() {
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editRole, setEditRole] = useState<AgentRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentRole | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await rolesApi.list();
      setRoles(data || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openCreate() {
    setEditRole(null); setWizardOpen(true);
  }

  function openEdit(role: AgentRole) {
    setEditRole(role); setWizardOpen(true);
  }

  function closeWizard() {
    setWizardOpen(false); setEditRole(null);
    fetchRoles();
    showToast(editRole ? "Role 已更新 ✅" : "Role 已建立 ✅");
  }

  async function confirmDelete() {
    if (deleteConfirm !== deleteTarget?.name) return;
    await rolesApi.delete(deleteTarget.id);
    setDeleteTarget(null); setDeleteConfirm("");
    fetchRoles();
    showToast("Role 已刪除 🗑️");
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">角色總表</h1>
          <p className="text-sm text-gray-500 mt-1">
            設定、管理 Agent 角色 — 支援 AI 自動生成 .md 設定檔、語音、TTS。
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                     font-medium shadow-sm transition flex items-center gap-2"
        >
          <span className="text-lg">+</span> 新增角色
        </button>
      </div>

      {/* Role Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">載入中…</div>
      ) : roles.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl py-16 text-center">
          <p className="text-gray-500 mb-4">尚未建立任何角色</p>
          <button onClick={openCreate} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            建立第一個角色
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={openEdit}
              onDelete={r => { setDeleteTarget(r); setDeleteConfirm(""); }}
            />
          ))}
        </div>
      )}

      {/* Role Wizard Modal */}
      {wizardOpen && (
        <RoleWizard
          initialRole={editRole || undefined}
          onClose={closeWizard}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-2 text-red-700">⚠️ 確認刪除角色</h3>
            <p className="text-sm text-gray-600 mb-1">
              即將刪除角色：「<strong>{deleteTarget.name}</strong>」
            </p>
            <p className="text-xs text-gray-500 mb-4">
              所有相關檔案（workspace 目錄、.md 設定檔）將被刪除，此操作無法復原。
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              請輸入「<strong>{deleteTarget.name}</strong>」確認：
            </label>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && confirmDelete()}
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mb-4
                         focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirm(""); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirm !== deleteTarget.name}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
