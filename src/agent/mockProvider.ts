import type { AgentProvider, AgentRunEvent, AgentRunRequest } from "./provider";
import { createScenePatch, type SceneOperation } from "../scene/patch";
import type { GameObject, Scene3D, Vec3 } from "../scene/schema";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const findFirstMesh = (scene: Scene3D): GameObject | undefined =>
  scene.objects.find((object) => object.components.some((component) => component.type === "mesh"));

const findTarget = (request: AgentRunRequest): GameObject | undefined =>
  (request.selection.selectedId &&
    request.sceneSnapshot.objects.find((object) => object.id === request.selection.selectedId)) ||
  findFirstMesh(request.sceneSnapshot);

const findCamera = (scene: Scene3D): GameObject | undefined =>
  scene.objects.find((object) => object.components.some((component) => component.type === "camera"));

const emitTool = async function* (
  name: string,
  args: Record<string, unknown>,
  result: string,
): AsyncGenerator<AgentRunEvent> {
  yield { type: "tool_call_started", call: { name, args } };
  await sleep(120);
  yield { type: "tool_call_completed", name, result };
};

const agentProvenance = (request: AgentRunRequest) => ({
  source: "agent" as const,
  providerId: request.providerConfig.providerId,
  modelId: request.providerConfig.modelId,
  prompt: request.prompt,
});

const makeBounceOps = (objectId: string, startFrame: number, duration = 30): SceneOperation[] => {
  const base: Vec3 = [0, 0.5, 0];
  const apex: Vec3 = [0, 3, 0];
  const mid = startFrame + Math.round(duration / 2);
  const end = startFrame + duration;
  return [
    { type: "animation.setKeyframe", objectId, path: "transform.position", frame: startFrame, value: base, easing: "ease-out" },
    { type: "animation.setKeyframe", objectId, path: "transform.position", frame: mid, value: apex, easing: "ease-in" },
    { type: "animation.setKeyframe", objectId, path: "transform.position", frame: end, value: base, easing: "ease-out" },
  ];
};

const makeSpinOps = (objectId: string, startFrame: number, duration = 60): SceneOperation[] => [
  { type: "animation.setKeyframe", objectId, path: "transform.rotation", frame: startFrame, value: [0, 0, 0], easing: "linear" },
  { type: "animation.setKeyframe", objectId, path: "transform.rotation", frame: startFrame + duration, value: [0, Math.PI * 2, 0], easing: "linear" },
];

const makeCameraOrbitOps = (
  cameraId: string,
  startFrame: number,
  duration: number,
): SceneOperation[] => [
  { type: "animation.setKeyframe", objectId: cameraId, path: "transform.position", frame: startFrame, value: [4, 3, 6], easing: "ease-in-out" },
  { type: "animation.setKeyframe", objectId: cameraId, path: "transform.position", frame: startFrame + Math.round(duration / 2), value: [-6, 3.2, 3], easing: "ease-in-out" },
  { type: "animation.setKeyframe", objectId: cameraId, path: "transform.position", frame: startFrame + duration, value: [4, 3, 6], easing: "ease-in-out" },
];

const makeSmallSceneOps = (): SceneOperation[] => [
  {
    type: "object.add",
    object: {
      id: `agent-floor-${Date.now()}`,
      name: "Agent Floor",
      visible: true,
      locked: false,
      components: [
        { type: "transform", transform: { position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], scale: [1, 1, 1] } },
        { type: "mesh", primitive: { kind: "plane", width: 12, height: 12 } },
        { type: "material", material: { kind: "standard", color: "#303238", roughness: 0.9, metalness: 0 } },
      ],
    },
  },
  ...[-2, 0, 2].map<SceneOperation>((x, index) => ({
    type: "object.add",
    object: {
      id: `agent-sphere-${Date.now()}-${index}`,
      name: `Agent Sphere ${index + 1}`,
      visible: true,
      locked: false,
      components: [
        { type: "transform", transform: { position: [x, 0.6, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
        { type: "mesh", primitive: { kind: "sphere", radius: 0.6 } },
        { type: "material", material: { kind: "standard", color: index === 0 ? "#a78bfa" : index === 1 ? "#4a9bd4" : "#f4c842", roughness: 0.55, metalness: 0.05 } },
      ],
    },
  })),
  {
    type: "object.add",
    object: {
      id: `agent-warm-light-${Date.now()}`,
      name: "Agent Warm Key",
      visible: true,
      locked: false,
      components: [
        { type: "transform", transform: { position: [3, 5, 4], rotation: [0, 0, 0], scale: [1, 1, 1] } },
        { type: "light", kind: "directional", color: "#ffd4a3", intensity: 1.6, castShadow: false },
      ],
    },
  },
];

const planPatch = (request: AgentRunRequest) => {
  const lower = request.prompt.toLowerCase();
  const target = findTarget(request);
  const camera = findCamera(request.sceneSnapshot);
  const start = Math.max(0, Math.round(request.currentFrame));
  const fiveSeconds = Math.round(request.project.fps * 5);

  if (lower.includes("small scene") || lower.includes("scene with")) {
    return createScenePatch(
      "Create a small staged scene",
      makeSmallSceneOps(),
      agentProvenance(request),
    );
  }

  if (!target) return null;

  const operations: SceneOperation[] = [];
  if (lower.includes("bounce") || lower.includes("jump") || lower.includes("zipla")) {
    operations.push(...makeBounceOps(target.id, start, lower.includes("5 second") ? fiveSeconds : 30));
  }
  if (lower.includes("spin") || lower.includes("rotate") || lower.includes("turn")) {
    operations.push(...makeSpinOps(target.id, start, lower.includes("5 second") ? fiveSeconds : 60));
  }
  if (lower.includes("red")) {
    operations.push({ type: "material.setColor", objectId: target.id, color: "#e74c3c" });
    operations.push({ type: "animation.setKeyframe", objectId: target.id, path: "material.color", frame: start, value: "#a78bfa", easing: "linear" });
    operations.push({ type: "animation.setKeyframe", objectId: target.id, path: "material.color", frame: start + fiveSeconds, value: "#e74c3c", easing: "ease-in-out" });
  }
  if (lower.includes("blue")) {
    operations.push({ type: "material.setColor", objectId: target.id, color: "#4a9bd4" });
  }
  if (lower.includes("green")) {
    operations.push({ type: "material.setColor", objectId: target.id, color: "#7ab841" });
  }
  if ((lower.includes("orbit") || lower.includes("camera")) && camera) {
    operations.push(...makeCameraOrbitOps(camera.id, start, lower.includes("5 second") ? fiveSeconds : 90));
  }
  if (lower.includes("pulse") || lower.includes("light")) {
    const light = request.sceneSnapshot.objects.find((object) => object.components.some((component) => component.type === "light"));
    if (light) {
      operations.push({ type: "animation.setKeyframe", objectId: light.id, path: "light.intensity", frame: start, value: 0.4, easing: "ease-in" });
      operations.push({ type: "animation.setKeyframe", objectId: light.id, path: "light.intensity", frame: start + 20, value: 2.4, easing: "ease-out" });
      operations.push({ type: "animation.setKeyframe", objectId: light.id, path: "light.intensity", frame: start + 40, value: 1.0, easing: "ease-in-out" });
    }
  }

  if (operations.length === 0) return null;
  return createScenePatch(
    `Animate ${target.name} (${operations.length} operation${operations.length === 1 ? "" : "s"})`,
    operations,
    agentProvenance(request),
  );
};

export const mockAgentProvider: AgentProvider = {
  id: "mock",
  label: "Mock Agent Provider",
  listModels: async () => [{ id: "mock-planner", label: "Mock Planner" }],
  cancel: () => undefined,
  run: async function* (request) {
    yield* emitTool(
      "read_scene",
      {
        objects: request.sceneSnapshot.objects.length,
        selectedId: request.selection.selectedId,
        frame: request.currentFrame,
      },
      "scene snapshot loaded",
    );

    yield* emitTool(
      "plan_operations",
      { prompt: request.prompt, provider: request.providerConfig.providerId },
      "operation plan drafted",
    );

    const patch = planPatch(request);
    if (!patch) {
      yield { type: "message_delta", text: "I need a clearer animation action. Try bounce, spin, camera orbit, red, pulse light, or create a small scene." };
      yield { type: "run_completed", message: "No patch proposed." };
      return;
    }

    yield* emitTool(
      "validate_patch",
      { operations: patch.operations.length },
      "patch is serializable and ready for preview",
    );

    yield { type: "message_delta", text: `Drafted: ${patch.summary}. Review the Scene Diff, then Apply or Reject.` };
    yield { type: "patch_proposed", patch };
    yield { type: "run_completed", message: patch.summary };
  },
};
