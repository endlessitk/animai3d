import type { ScenePatch } from "../scene/patch";
import type { Scene3D, StudioProject } from "../scene/schema";
import type { ToolCall } from "./agentSession";

export type AgentProviderConfig = {
  providerId: string;
  modelId?: string;
  endpoint?: string;
  apiKeyStatus?: "missing" | "configured" | "not-required";
};

export type AgentRunRequest = {
  prompt: string;
  project: StudioProject;
  sceneSnapshot: Scene3D;
  selection: {
    selectedId: string | null;
    selectedIds: string[];
  };
  currentFrame: number;
  constraints: {
    allowSilentApply: false;
    allowedOperations: string[];
  };
  providerConfig: AgentProviderConfig;
};

export type AgentRunEvent =
  | { type: "message_delta"; text: string }
  | { type: "tool_call_started"; call: Pick<ToolCall, "name" | "args"> & { id?: string } }
  | { type: "tool_call_completed"; callId?: string; name: string; result: string }
  | { type: "patch_proposed"; patch: ScenePatch }
  | { type: "validation_issue"; message: string; severity: "error" | "warning" | "info" }
  | { type: "run_failed"; message: string }
  | { type: "run_completed"; message?: string };

export type AgentModelInfo = {
  id: string;
  label: string;
};

export interface AgentProvider {
  id: string;
  label: string;
  listModels: () => Promise<AgentModelInfo[]>;
  run: (request: AgentRunRequest) => AsyncGenerator<AgentRunEvent>;
  cancel: (runId: string) => void;
}

export const DEFAULT_AGENT_CONFIG: AgentProviderConfig = {
  providerId: "mock",
  modelId: "mock-planner",
  apiKeyStatus: "not-required",
};

export const createDefaultRunRequest = (
  prompt: string,
  project: StudioProject,
  scene: Scene3D,
  selectedId: string | null,
  selectedIds: string[],
  currentFrame: number,
): AgentRunRequest => ({
  prompt,
  project,
  sceneSnapshot: scene,
  selection: { selectedId, selectedIds },
  currentFrame,
  constraints: {
    allowSilentApply: false,
    allowedOperations: [
      "object.add",
      "object.rename",
      "transform.setField",
      "animation.setKeyframe",
      "material.setColor",
      "light.set",
      "camera.set",
    ],
  },
  providerConfig: DEFAULT_AGENT_CONFIG,
});
