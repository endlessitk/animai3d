import type { AgentTask } from "../scene/schema";

export const createAgentTask = (input: {
  prompt: string;
  selectedObjectIds: string[];
  desiredAction?: string;
  targetFiles?: string[];
  acceptanceCriteria?: string[];
}): AgentTask => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return {
    id: `task-${stamp}`,
    createdAt: new Date().toISOString(),
    status: "queued",
    prompt: input.prompt,
    selectedObjectIds: input.selectedObjectIds,
    desiredAction: input.desiredAction ?? "studio-edit",
    targetFiles: input.targetFiles ?? ["studio-data/scene.json", "studio-data/assets.json"],
    acceptanceCriteria: input.acceptanceCriteria ?? [
      "Changes are represented in studio-data JSON",
      "New or edited assets remain visible in the left library",
      "Remotion renderer can load the scene without errors"
    ],
  };
};
