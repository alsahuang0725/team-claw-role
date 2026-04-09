// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Shared TypeScript types for Module A — Agent Role Dashboard.
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
  mdFiles: MdFiles;
  createdAt: string;
  updatedAt: string;
}

export interface MdFiles {
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

/** Wizard step definition */
export type WizardStepId =
  | "type"
  | "name"
  | "voice"
  | "job"
  | "preview"
  | "avatar"
  | "channels"
  | "save";

export interface WizardState {
  step: WizardStepId;
  roleType: "main" | "sub-agent" | "";
  roleName: string;
  ttsVoice: string;
  jobDescription: string;
  generatedFiles: Partial<MdFiles>;
  avatarFile: File | null;
  avatarUrl: string;
  channels: ChannelBinding[];
  isGenerating: boolean;
  isSaving: boolean;
  error: string;
}
