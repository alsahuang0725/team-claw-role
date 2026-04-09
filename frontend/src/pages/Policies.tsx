// frontend/pages/Policies.tsx
// Module B — Enterprise Policy Management Dashboard

import React, { useState, useEffect, useCallback } from "react";
import PolicyMatrix from "../components/PolicyMatrix";
import CustomRulesEditor from "../components/CustomRulesEditor";
import { policiesApi, rolesApi, type Policy, type AgentRole } from "../api/client";

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard state
  const [wizardName, setWizardName] = useState("");
  const [wizardDescription, setWizardDescription] = useState("");
  const [wizardTargets, setWizardTargets] = useState<string[]>(["all"]);
  const [wizardRules, setWizardRules] = useState<Policy["rules"]>([]);
  const [wizardCustom, setWizardCustom] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      const d = await policiesApi.list();
      setPolicies(d);
    } catch {
      setPolicies([]);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const d = await rolesApi.list();
      setRoles(Array.isArray(d) ? d.map((r: any) => ({ id: r.id, name: r.name })) : []);
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPolicies(), fetchRoles()]).finally(() => setLoading(false));
  }, [fetchPolicies, fetchRoles]);

  function openCreate() {
    setWizardName(""); setWizardDescription(""); setWizardTargets(["all"]);
    setWizardRules([]); setWizardCustom(""); setWizardStep(1);
    setEditPolicy(null); setWizardOpen(true);
  }

  function openEdit(p: Policy) {
    setWizardName(p.name); setWizardDescription(p.description || "");
    setWizardTargets(p.targetAgents); setWizardRules(p.rules);
    setWizardCustom(p.customRules || ""); setWizardStep(1);
    setEditPolicy(p); setWizardOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: wizardName,
        description: wizardDescription,
        targetAgents: wizardTargets,
        rules: wizardRules,
        customRules: wizardCustom,
      };
      if (editPolicy) {
        await policiesApi.update(editPolicy.id, payload);
      } else {
        await policiesApi.create(payload);
      }
      await fetchPolicies();
      setWizardOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(policyId: string) {
    await policiesApi.delete(policyId);
    setDeleteConfirm(null);
    await fetchPolicies();
  }

  if (loading) return <div className="p-8 text-gray-500">載入中…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業 Policy 設定</h1>
          <p className="text-sm text-gray-500 mt-1">
            設定 Agent 工具 / Skill 權限矩陣，AISOClaw 預設政策為唯讀基底。
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + 新增 Policy
        </button>
      </div>

      {/* Policy Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Policy 名稱</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">適用 Agent</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">規則數</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {policies.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">尚無 Policy，點擊上方新增</td></tr>
            )}
            {policies.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.isSharedDefault && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        Shared Default
                      </span>
                    )}
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {p.targetAgents.join(", ") || "all"}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.rules.length} 條</td>
                <td className="px-4 py-3 text-right">
                  {p.isSharedDefault ? (
                    <span className="text-xs text-gray-400 italic">唯讀</span>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-sm">
                        編輯
                      </button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="text-red-600 hover:underline text-sm">
                        刪除
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Wizard Modal */}
      {wizardOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editPolicy ? "編輯 Policy" : "新增 Policy"}</h2>
              <div className="flex gap-2">
                {/* Step indicators */}
                {[1,2,3,4].map(s => (
                  <div key={s}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${wizardStep === s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Step 1: Basic Info */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Step 1：基本資訊</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Policy 名稱 *</label>
                    <input value={wizardName} onChange={e => setWizardName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="例如：行銷 Agent 限制" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea value={wizardDescription} onChange={e => setWizardDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      rows={2} placeholder="這個 Policy 的用途簡述…" />
                  </div>
                </div>
              )}

              {/* Step 2: Target Agents */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Step 2：目標 Agent</h3>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-1.5 border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={wizardTargets.includes("all")}
                        onChange={e => setWizardTargets(e.target.checked ? ["all"] : [])}
                        className="rounded" />
                      <span className="text-sm">所有 Agent</span>
                    </label>
                    {roles.map(r => (
                      <label key={r.id}
                        className={`flex items-center gap-1.5 border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50
                          ${wizardTargets.includes(r.id) ? "border-blue-500 bg-blue-50" : ""}`}>
                        <input type="checkbox" checked={wizardTargets.includes(r.id)}
                          onChange={e => {
                            const next = wizardTargets.includes("all")
                              ? [r.id]
                              : wizardTargets.includes(r.id)
                                ? wizardTargets.filter(x => x !== r.id)
                                : [...wizardTargets, r.id];
                            setWizardTargets(next.length ? next : ["all"]);
                          }}
                          className="rounded" />
                        <span className="text-sm">{r.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Permission Matrix */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Step 3：權限矩陣</h3>
                  <PolicyMatrix rules={wizardRules} onChange={setWizardRules} />
                </div>
              )}

              {/* Step 4: Custom Rules */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Step 4：自訂規則（選填）</h3>
                  <p className="text-sm text-gray-500">以 YAML 或自然語言撰寫進階規則，會附加在權限矩陣之後。</p>
                  <CustomRulesEditor value={wizardCustom} onChange={setWizardCustom} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex justify-between">
              <button onClick={() => wizardStep > 1 ? setWizardStep(s => s - 1) : setWizardOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                {wizardStep > 1 ? "← 上一步" : "取消"}
              </button>
              <div className="flex gap-2">
                {wizardStep < 4 && (
                  <button onClick={() => setWizardStep(s => s + 1)}
                    disabled={wizardStep === 1 && !wizardName}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    下一步 →
                  </button>
                )}
                {wizardStep === 4 && (
                  <button onClick={handleSave} disabled={saving || !wizardName}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {saving ? "儲存中…" : "儲存 Policy"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-2">確認刪除 Policy</h3>
            <p className="text-sm text-gray-600 mb-4">此操作無法復原。請輸入 Policy 名稱確認刜除。</p>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
              placeholder={policies.find(p => p.id === deleteConfirm)?.name}
              onKeyDown={e => e.key === "Enter" && handleDelete(deleteConfirm)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">確認刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
