import type { MaterialComponent, Scene3D, Vec3 } from "../scene/schema";
import { setKeyframe, updateComponentAtIndex } from "../scene/sceneUtils";
import type { SceneDiff, ToolCall } from "./agentSession";

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const findFirstMesh = (scene: Scene3D) =>
  scene.objects.find((o) => o.components.some((c) => c.type === "mesh"));

// ── Agent handle ──────────────────────────────────────────────────────────────

/**
 * Mock agent emits canned tool-call streams via the session APIs supplied by
 * the caller, then resolves with the SceneDiff to stage as pendingDiff.
 *
 * Real LLM integration (Anthropic / OpenRouter / local) replaces this in V2.
 * Tool-call schema kept generic so the streaming UI doesn't need changes.
 */

export type RunAgentArgs = {
  prompt: string;
  scene: Scene3D;
  selectedId: string | null;
  appendToolCall: (name: string, args: Record<string, unknown>) => ToolCall;
  updateToolCall: (id: string, patch: Partial<ToolCall>) => void;
  appendAgentMessage: (text: string) => void;
};

export const runMockAgent = async ({
  prompt,
  scene,
  selectedId,
  appendToolCall,
  updateToolCall,
  appendAgentMessage,
}: RunAgentArgs): Promise<SceneDiff | null> => {
  const lower = prompt.toLowerCase();
  const target =
    (selectedId && scene.objects.find((o) => o.id === selectedId)) ||
    findFirstMesh(scene);

  if (!target) {
    appendAgentMessage("No mesh found in the scene to act on.");
    return null;
  }

  // Always start by "reading" the scene.
  const readCall = appendToolCall("read_scene", {
    objectId: target.id,
    name: target.name,
  });
  await sleep(160);
  updateToolCall(readCall.id, { status: "streaming" });
  await sleep(220);
  updateToolCall(readCall.id, {
    status: "complete",
    result: `→ found ${scene.objects.length} objects; primary target = "${target.name}"`,
  });

  // Route by intent.
  if (lower.includes("bounce") || lower.includes("jump") || lower.includes("zıpla")) {
    return planBounce(target, appendToolCall, updateToolCall, appendAgentMessage);
  }
  if (lower.includes("spin") || lower.includes("rotate") || lower.includes("döndür")) {
    return planSpin(target, appendToolCall, updateToolCall, appendAgentMessage);
  }
  if (lower.includes("red") || lower.includes("kırmızı")) {
    return planRecolor(target, "#e74c3c", appendToolCall, updateToolCall, appendAgentMessage);
  }
  if (lower.includes("blue") || lower.includes("mavi")) {
    return planRecolor(target, "#4a9bd4", appendToolCall, updateToolCall, appendAgentMessage);
  }
  if (lower.includes("green") || lower.includes("yeşil")) {
    return planRecolor(target, "#7ab841", appendToolCall, updateToolCall, appendAgentMessage);
  }

  appendAgentMessage(
    `I can act on "${target.name}". Try: "bounce", "spin", or "make it red".`,
  );
  return null;
};

// ── Plans ─────────────────────────────────────────────────────────────────────

async function planBounce(
  target: { id: string; name: string; components: { type: string }[] },
  appendToolCall: RunAgentArgs["appendToolCall"],
  updateToolCall: RunAgentArgs["updateToolCall"],
  appendAgentMessage: RunAgentArgs["appendAgentMessage"],
): Promise<SceneDiff> {
  const transformIdx = target.components.findIndex((c) => c.type === "transform");
  const basePos: Vec3 = [0, 0.5, 0];
  const apex: Vec3 = [0, 3, 0];

  const c1 = appendToolCall("set_keyframe", {
    objectId: target.id,
    property: "position",
    frame: 0,
    value: basePos,
  });
  await sleep(180);
  updateToolCall(c1.id, { status: "streaming" });
  await sleep(160);
  updateToolCall(c1.id, { status: "complete", result: "ok" });

  const c2 = appendToolCall("set_keyframe", {
    objectId: target.id,
    property: "position",
    frame: 15,
    value: apex,
  });
  await sleep(160);
  updateToolCall(c2.id, { status: "streaming" });
  await sleep(160);
  updateToolCall(c2.id, { status: "complete", result: "ok" });

  const c3 = appendToolCall("set_keyframe", {
    objectId: target.id,
    property: "position",
    frame: 30,
    value: basePos,
  });
  await sleep(160);
  updateToolCall(c3.id, { status: "streaming" });
  await sleep(160);
  updateToolCall(c3.id, { status: "complete", result: "ok" });

  appendAgentMessage(
    `Drafted a 30-frame bounce for "${target.name}". Apply to commit.`,
  );

  return {
    id: `diff-${Date.now()}`,
    summary: `Bounce "${target.name}" (3 keyframes · 30 frames)`,
    changes: [
      `+ AnimationComponent on ${target.name}`,
      `+ position track: [0,0.5,0] @ f0`,
      `+ position track: [0,3,0] @ f15`,
      `+ position track: [0,0.5,0] @ f30`,
    ],
    apply: (s) => {
      let next = s;
      next = setKeyframe(next, target.id, "position", 0, basePos, "ease-out");
      next = setKeyframe(next, target.id, "position", 15, apex, "ease-in");
      next = setKeyframe(next, target.id, "position", 30, basePos, "ease-out");
      return next;
    },
  };
}

async function planSpin(
  target: { id: string; name: string; components: { type: string }[] },
  appendToolCall: RunAgentArgs["appendToolCall"],
  updateToolCall: RunAgentArgs["updateToolCall"],
  appendAgentMessage: RunAgentArgs["appendAgentMessage"],
): Promise<SceneDiff> {
  const start: Vec3 = [0, 0, 0];
  const end: Vec3 = [0, Math.PI * 2, 0];

  const c1 = appendToolCall("set_keyframe", {
    objectId: target.id,
    property: "rotation",
    frame: 0,
    value: start,
  });
  await sleep(180);
  updateToolCall(c1.id, { status: "streaming" });
  await sleep(160);
  updateToolCall(c1.id, { status: "complete", result: "ok" });

  const c2 = appendToolCall("set_keyframe", {
    objectId: target.id,
    property: "rotation",
    frame: 60,
    value: end,
  });
  await sleep(160);
  updateToolCall(c2.id, { status: "streaming" });
  await sleep(160);
  updateToolCall(c2.id, { status: "complete", result: "ok" });

  appendAgentMessage(`Drafted a 60-frame Y-spin for "${target.name}".`);

  return {
    id: `diff-${Date.now()}`,
    summary: `Spin "${target.name}" 360° on Y (60 frames)`,
    changes: [
      `+ AnimationComponent on ${target.name}`,
      `+ rotation track: [0,0,0] @ f0`,
      `+ rotation track: [0,2π,0] @ f60`,
    ],
    apply: (s) => {
      let next = s;
      next = setKeyframe(next, target.id, "rotation", 0, start, "linear");
      next = setKeyframe(next, target.id, "rotation", 60, end, "linear");
      return next;
    },
  };
}

async function planRecolor(
  target: { id: string; name: string; components: Array<{ type: string }> },
  color: string,
  appendToolCall: RunAgentArgs["appendToolCall"],
  updateToolCall: RunAgentArgs["updateToolCall"],
  appendAgentMessage: RunAgentArgs["appendAgentMessage"],
): Promise<SceneDiff | null> {
  const matIdx = target.components.findIndex((c) => c.type === "material");
  if (matIdx < 0) {
    appendAgentMessage(`"${target.name}" has no MaterialComponent to recolor.`);
    return null;
  }

  const c1 = appendToolCall("set_material_color", {
    objectId: target.id,
    color,
  });
  await sleep(220);
  updateToolCall(c1.id, { status: "streaming" });
  await sleep(180);
  updateToolCall(c1.id, { status: "complete", result: `→ #${color.replace("#", "")}` });

  appendAgentMessage(`Set "${target.name}" color to ${color}.`);

  return {
    id: `diff-${Date.now()}`,
    summary: `Recolor "${target.name}" → ${color}`,
    changes: [`~ material.color: ${color}`],
    apply: (s) => {
      const obj = s.objects.find((o) => o.id === target.id);
      const current = obj?.components[matIdx];
      if (!current || current.type !== "material") return s;
      const next: MaterialComponent = {
        ...current,
        material: { ...current.material, color },
      };
      return updateComponentAtIndex(s, target.id, matIdx, next);
    },
  };
}
