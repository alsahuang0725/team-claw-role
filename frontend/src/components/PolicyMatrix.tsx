// frontend/components/PolicyMatrix.tsx
// Permission matrix UI: rows = skills, columns = agents, cells = Allow/Deny/Audit

import React from "react";

interface Rule {
  skill: string;
  agent?: string;
  permission: "allow" | "deny" | "audit";
}

interface Props {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
  skills?: Array<{ id: string; name: string }>;
}

const BUILT_IN_SKILLS = [
  { id: "actions:send_message", name: "發送訊息" },
  { id: "actions:post_public", name: "公開發文" },
  { id: "actions:delete_file", name: "刪除檔案" },
  { id: "actions:delete_cron", name: "刪除 Cron Job" },
  { id: "actions:trading_open", name: "外匯開倉" },
  { id: "actions:trading_close", name: "外匯平倉" },
  { id: "actions:modify_config", name: "修改設定檔" },
  { id: "actions:restart_gateway", name: "重啟 Gateway" },
  { id: "actions:install_skill", name: "安裝 Skill" },
  { id: "actions:modify_cron", name: "修改 Cron Job" },
  { id: "read_file", name: "讀取檔案" },
  { id: "check_status", name: "檢查系統狀態" },
  { id: "send_to_ryan", name: "發訊息給 Ryan" },
  { id: "subagent_dispatch", name: "派發子任務" },
  { id: "image_generation", name: "圖像生成" },
  { id: "research_web", name: "網路搜尋" },
  { id: "exec:allowed_scripts", name: "執行允許腳本" },
  { id: "exec:system_commands", name: "系統指令" },
  { id: "exec:dangerous_patterns", name: "危險指令模式" },
];

const PERMISSIONS: Array<"allow" | "deny" | "audit"> = ["allow", "deny", "audit"];

function getPerm(rules: Rule[], skill: string): Rule["permission"] {
  const match = rules.find(r => r.skill === skill);
  return match?.permission ?? "audit";
}

function setPerm(rules: Rule[], skill: string, perm: Rule["permission"]): Rule[] {
  const exists = rules.findIndex(r => r.skill === skill);
  if (exists >= 0) {
    const next = [...rules];
    next[exists] = { ...next[exists], permission: perm };
    return next;
  }
  return [...rules, { skill, permission: perm }];
}

export default function PolicyMatrix({ rules, onChange }: Props) {
  const skills = BUILT_IN_SKILLS;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold text-gray-700 border border-gray-300 w-48">
              技能 / 工具
            </th>
            {PERMISSIONS.map(p => (
              <th key={p} className="px-3 py-2 text-center font-semibold text-gray-700 border border-gray-300 min-w-[80px]">
                {p === "allow" ? "✅ 允許" : p === "deny" ? "🚫 拒絕" : "👁️ 審計"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map(skill => {
            const current = getPerm(rules, skill.id);
            return (
              <tr key={skill.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border border-gray-300 font-medium text-gray-800">
                  {skill.name}
                  <span className="block text-xs text-gray-400 font-normal">{skill.id}</span>
                </td>
                {PERMISSIONS.map(p => (
                  <td key={p} className="border border-gray-300 text-center py-1">
                    <input
                      type="radio"
                      name={`perm-${skill.id}`}
                      checked={current === p}
                      onChange={() => onChange(setPerm(rules, skill.id, p))}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                      title={p}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">
        預設值為「審計」(audit)。編輯後直接修改該列。
      </p>
    </div>
  );
}
