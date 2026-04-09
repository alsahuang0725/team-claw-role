// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * REST API client for the team-claw-role backend.
 * Matches backend/agents/app.py and backend/policies/app.py response formats.
 */

export interface ChannelBinding {
  channel: "line" | "whatsapp";
  accountId?: string;
  status: "pending" | "active";
}

export interface AgentRole {
  id: string;
  name: string;
  type: "main" | "sub-agent";
  workspaceDir: string;
  ttsVoice: string;
  avatarPath: string;
  channels: ChannelBinding[];
  mdFiles: {
    soul?: string;
    identity?: string;
    agents?: string;
    user?: string;
    heartbeat?: string;
    memory?: string;
    tools?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFiles {
  soul?: string;
  identity?: string;
  agents?: string;
  user?: string;
  heartbeat?: string;
  memory?: string;
  tools?: string;
}

export interface Voice {
  id: string;
  name: string;
  edgeVoice: string;
  gender: "male" | "female";
  locale: "zh-CN" | "zh-TW";
  description: string;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  targetAgents: string[];
  rules: Array<{ skill: string; agent?: string; permission: "allow" | "deny" | "audit" }>;
  customRules?: string;
  isSharedDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------------------------
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(!(init?.body instanceof FormData) ? {} : { "Content-Type": "multipart/form-data" }),
      ...init?.headers,
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Roles API (Module A)
// ---------------------------------------------------------------------------
export const rolesApi = {
  list: () => request<AgentRole[]>("/roles"),
  get: (id: string) => request<AgentRole>(`/roles/${id}`),
  create: (data: Partial<AgentRole>) => request<AgentRole>("/roles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AgentRole>) =>
    request<AgentRole>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string, confirmName?: string) => {
    const qs = confirmName ? `?confirm=${encodeURIComponent(confirmName)}` : "";
    return request<{ deleted: string }>(`/roles/${id}${qs}`, { method: "DELETE" });
  },
  generate: (payload: { jobDescription: string; type: string; name: string }) =>
    request<GeneratedFiles>("/roles/generate", { method: "POST", body: JSON.stringify(payload) }),
};

// ---------------------------------------------------------------------------
// Policies API (Module B)
// ---------------------------------------------------------------------------
export const policiesApi = {
  list: () => request<{ policies: Policy[] }>("/policies").then(d => d.policies),
  get: (id: string) => request<Policy>(`/policies/${id}`),
  create: (data: Partial<Policy>) =>
    request<{ id: string } & Partial<Policy>>("/policies", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Policy>) =>
    request<Policy>(`/policies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<{ deleted: string }>(`/policies/${id}`, { method: "DELETE" }),
  listSkills: () => request<{ skills: Array<{ id: string; name: string }> }>("/skills").then(d => d.skills),
};

// ---------------------------------------------------------------------------
// Voices API (Module D)
// ---------------------------------------------------------------------------
export const voicesApi = {
  list: (params?: { locale?: string; gender?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<Voice[]>(`/voices${qs}`);
  },
  preview: (voiceId: string) => `${BASE}/api/voices/${voiceId}/preview`,
};

// ---------------------------------------------------------------------------
// Upload API
// ---------------------------------------------------------------------------
export async function uploadFile(file: File, roleId?: string): Promise<{ url: string; path: string }> {
  const form = new FormData();
  form.append("file", file);
  if (roleId) form.append("roleId", roleId);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  return res.json();
}
