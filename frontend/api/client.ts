// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * REST API client for the team-claw-role backend.
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

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Roles
export const api = {
  listRoles: () => request<AgentRole[]>("/roles"),

  createRole: (data: Partial<AgentRole>) =>
    request<AgentRole>("/roles", { method: "POST", body: JSON.stringify(data) }),

  updateRole: (id: string, data: Partial<AgentRole>) =>
    request<AgentRole>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteRole: (id: string, confirmName: string) =>
    request<{ deleted: string }>(
      `/roles/${id}?confirm=${encodeURIComponent(confirmName)}`,
      { method: "DELETE" },
    ),

  generateFiles: (payload: { jobDescription: string; type: string; name: string }) =>
    request<GeneratedFiles>("/roles/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Voices
  listVoices: (params?: { locale?: string; gender?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return request<Voice[]>(`/voices${qs}`);
  },

  // Upload
  uploadFile: async (file: File, roleId?: string): Promise<{ url: string; path: string }> => {
    const form = new FormData();
    form.append("file", file);
    if (roleId) form.append("roleId", roleId);
    const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ url: string; path: string }>;
  },
};
