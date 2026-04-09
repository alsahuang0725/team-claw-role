// frontend/components/CustomRulesEditor.tsx
// YAML textarea for free-form policy rules

import React from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const TEMPLATE = `# 自訂規則範例（選填）：
# 套用到所有 Agent：
targetAgents: all

# 特殊權限：
rules:
  # 允許特定目錄下的檔案操作
  - skill: file:path
    path: D:\\OpenClaw\\workspace\\
    permission: allow

  # 限制交易時間
  - skill: trading:time
    window: "09:00-21:00 Asia/Taipei"
    permission: allow

  # 禁止的關鍵字
  - skill: content:keyword_block
    keywords: ["password", "api_key", "secret"]
    permission: deny
`;

export default function CustomRulesEditor({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <textarea
        value={value || TEMPLATE}
        onChange={e => onChange(e.target.value)}
        onFocus={e => { if (!value) onChange(TEMPLATE); }}
        className="w-full font-mono text-xs border border-gray-300 rounded-lg px-4 py-3 bg-gray-50
                   focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        rows={14}
        spellCheck={false}
        placeholder={TEMPLATE}
      />
      <p className="text-xs text-gray-400">
        支援 YAML 語法。規則會附加在權限矩陣之後，以相同的格式寫入 policies/agents/{"{id}"}.yaml 的 customRules 欄位。
      </p>
    </div>
  );
}
