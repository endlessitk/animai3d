import type { SceneDiff, ToolCall } from "./agentSession";
import { createDefaultRunRequest } from "./provider";
import { mockAgentProvider } from "./mockProvider";
import type { Scene3D, StudioProject } from "../scene/schema";

export type RunAgentArgs = {
  prompt: string;
  project: StudioProject;
  scene: Scene3D;
  selectedId: string | null;
  currentFrame?: number;
  appendToolCall: (name: string, args: Record<string, unknown>) => ToolCall;
  updateToolCall: (id: string, patch: Partial<ToolCall>) => void;
  appendAgentMessage: (text: string) => void;
};

export const runMockAgent = async ({
  prompt,
  project,
  scene,
  selectedId,
  currentFrame = 0,
  appendToolCall,
  updateToolCall,
  appendAgentMessage,
}: RunAgentArgs): Promise<SceneDiff | null> => {
  let patch: SceneDiff | null = null;
  const callIds = new Map<string, string>();
  const request = createDefaultRunRequest(
    prompt,
    project,
    scene,
    selectedId,
    selectedId ? [selectedId] : [],
    currentFrame,
  );

  for await (const event of mockAgentProvider.run(request)) {
    if (event.type === "message_delta") {
      appendAgentMessage(event.text);
    } else if (event.type === "tool_call_started") {
      const call = appendToolCall(event.call.name, event.call.args);
      callIds.set(event.call.name, call.id);
      updateToolCall(call.id, { status: "streaming" });
    } else if (event.type === "tool_call_completed") {
      const id = event.callId ?? callIds.get(event.name);
      if (id) updateToolCall(id, { status: "complete", result: event.result });
    } else if (event.type === "patch_proposed") {
      patch = event.patch;
    } else if (event.type === "run_failed") {
      appendAgentMessage(`Error: ${event.message}`);
    }
  }

  return patch;
};
