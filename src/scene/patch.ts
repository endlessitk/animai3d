import type {
  AnimationPath,
  AnimatableValue,
  CameraComponent,
  ColorHex,
  Component,
  EasingName3D,
  GameObject,
  LightComponent,
  MaterialComponent,
  Scene3D,
  Vec3,
} from "./schema";
import { findComponent } from "./schema";
import {
  addComponent,
  addNewObject,
  renameObject,
  setKeyframe,
  setVec3Field,
  updateComponent,
  updateComponentAtIndex,
} from "./sceneUtils";
import { hasErrors, validateScene } from "./validation";

export type ScenePatchProvenance = {
  source: "human" | "agent";
  providerId?: string;
  modelId?: string;
  modelVersion?: string;
  prompt?: string;
};

export type SceneOperation =
  | { type: "object.add"; kind?: Parameters<typeof addNewObject>[1]; object?: GameObject; index?: number }
  | { type: "object.rename"; objectId: string; name: string }
  | { type: "transform.setField"; objectId: string; field: "position" | "rotation" | "scale"; value: Vec3 }
  | { type: "animation.setKeyframe"; objectId: string; path: AnimationPath; frame: number; value: AnimatableValue; easing?: EasingName3D }
  | { type: "material.setColor"; objectId: string; color: ColorHex }
  | { type: "light.set"; objectId: string; field: keyof Pick<LightComponent, "color" | "intensity" | "distance" | "angle" | "groundColor" | "castShadow">; value: LightComponent[keyof Pick<LightComponent, "color" | "intensity" | "distance" | "angle" | "groundColor" | "castShadow">] }
  | { type: "camera.set"; objectId: string; field: keyof Pick<CameraComponent, "fov" | "near" | "far" | "zoom" | "active">; value: CameraComponent[keyof Pick<CameraComponent, "fov" | "near" | "far" | "zoom" | "active">] };

export type ScenePatch = {
  id: string;
  summary: string;
  operations: SceneOperation[];
  changes?: string[];
  provenance?: ScenePatchProvenance;
  validation?: {
    status: "unchecked" | "passed" | "warning" | "blocked";
    messages: string[];
  };
  createdAt: string;
};

export type ScenePatchValidation = {
  beforeIssueCount: number;
  afterIssueCount: number;
  blocked: boolean;
  messages: string[];
  previewScene: Scene3D;
};

const updateMaterialColor = (scene: Scene3D, objectId: string, color: ColorHex): Scene3D => {
  const object = scene.objects.find((item) => item.id === objectId);
  const material = object && findComponent(object, "material");
  if (!object || !material) return scene;
  return updateComponent(scene, objectId, "material", (component): MaterialComponent => ({
    ...component,
    material: { ...component.material, color } as MaterialComponent["material"],
  }));
};

const addAgentMetadata = (scene: Scene3D, patch: ScenePatch): Scene3D => {
  if (patch.provenance?.source !== "agent") return scene;
  const now = new Date().toISOString();
  const touchedIds = new Set(
    patch.operations
      .map((operation) => "objectId" in operation ? operation.objectId : operation.object?.id)
      .filter((id): id is string => Boolean(id)),
  );
  let next = scene;
  for (const objectId of touchedIds) {
    const object = next.objects.find((item) => item.id === objectId);
    if (!object) continue;
    const existingIndex = object.components.findIndex((component) => component.type === "agentMetadata");
    const component: Component = {
      type: "agentMetadata",
      createdBy: {
        providerId: patch.provenance.providerId,
        modelId: patch.provenance.modelId,
        modelVersion: patch.provenance.modelVersion,
        createdAt: now,
        modifiedAt: now,
      },
      modifiedBy: {
        providerId: patch.provenance.providerId,
        modelId: patch.provenance.modelId,
        modelVersion: patch.provenance.modelVersion,
        modifiedAt: now,
      },
      reviewedByHuman: true,
    };
    next = existingIndex >= 0
      ? updateComponentAtIndex(next, objectId, existingIndex, component)
      : addComponent(next, objectId, component);
  }
  return next;
};

export const applySceneOperation = (scene: Scene3D, operation: SceneOperation): Scene3D => {
  switch (operation.type) {
    case "object.add":
      if (operation.object) {
        const objects = [...scene.objects];
        const index = operation.index ?? objects.length;
        objects.splice(index, 0, operation.object);
        return { ...scene, objects };
      }
      return operation.kind ? addNewObject(scene, operation.kind) : scene;
    case "object.rename":
      return renameObject(scene, operation.objectId, operation.name);
    case "transform.setField":
      return setVec3Field(scene, operation.objectId, operation.field, operation.value);
    case "animation.setKeyframe":
      return setKeyframe(scene, operation.objectId, operation.path, operation.frame, operation.value, operation.easing);
    case "material.setColor":
      return updateMaterialColor(scene, operation.objectId, operation.color);
    case "light.set":
      return updateComponent(scene, operation.objectId, "light", (component) => ({
        ...component,
        [operation.field]: operation.value,
      } as LightComponent));
    case "camera.set":
      return updateComponent(scene, operation.objectId, "camera", (component) => ({
        ...component,
        [operation.field]: operation.value,
      } as CameraComponent));
  }
};

export const applyScenePatch = (scene: Scene3D, patch: ScenePatch): Scene3D => {
  const patched = patch.operations.reduce(applySceneOperation, scene);
  return addAgentMetadata(patched, patch);
};

export const validateScenePatch = (scene: Scene3D, patch: ScenePatch): ScenePatchValidation => {
  const before = validateScene(scene);
  const previewScene = applyScenePatch(scene, patch);
  const after = validateScene(previewScene);
  const messages = after
    .filter((issue) => issue.severity !== "info")
    .map((issue) => issue.message);
  return {
    beforeIssueCount: before.length,
    afterIssueCount: after.length,
    blocked: hasErrors(after),
    messages,
    previewScene,
  };
};

export const describeSceneOperation = (operation: SceneOperation): string => {
  switch (operation.type) {
    case "object.add":
      return `+ object ${operation.object?.name ?? operation.kind ?? "unknown"}`;
    case "object.rename":
      return `~ rename ${operation.objectId} -> ${operation.name}`;
    case "animation.setKeyframe":
      return `+ key ${operation.path} @ f${operation.frame}`;
    case "material.setColor":
      return `~ material.color ${operation.color}`;
    case "transform.setField":
      return `~ transform.${operation.field} [${operation.value.join(", ")}]`;
    default:
      return `~ ${operation.type}`;
  }
};

// ── Field-level delta (before -> after) ──────────────────────────────────────

export type OperationDelta = {
  /** Stable label like "Cube · transform.position" — anchored to object name. */
  label: string;
  /** Pre-state rendered string. "—" when there is no prior value. */
  before: string;
  /** Post-state rendered string. */
  after: string;
  /** Visual kind hint for diff styling. */
  kind: "add" | "del" | "mod";
};

const formatValue = (value: AnimatableValue | undefined | null): string => {
  if (value === undefined || value === null) return "—";
  if (typeof value === "number") return Number.isInteger(value) ? `${value}` : value.toFixed(3);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return `[${value.map((v) => v.toFixed(2)).join(", ")}]`;
  return JSON.stringify(value);
};

const resolveObjectName = (scene: Scene3D, id: string | undefined): string => {
  if (!id) return "—";
  const obj = scene.objects.find((o) => o.id === id);
  return obj?.name ?? id;
};

const readAnimationValueAt = (
  obj: GameObject | undefined,
  path: AnimationPath,
  frame: number,
): AnimatableValue | null => {
  if (!obj) return null;
  const anim = findComponent(obj, "animation");
  const track = anim?.tracks.find((t) => (t.path ?? `transform.${t.property}`) === path);
  if (!track || track.keyframes.length === 0) return null;
  // Exact-frame match first, otherwise closest-before for context display.
  const exact = track.keyframes.find((k) => k.frame === frame);
  if (exact) return exact.value;
  const before = [...track.keyframes].reverse().find((k) => k.frame <= frame);
  return before?.value ?? track.keyframes[0].value;
};

const readTransformField = (
  obj: GameObject | undefined,
  field: "position" | "rotation" | "scale",
): Vec3 | null => {
  const t = obj && findComponent(obj, "transform");
  return t ? t.transform[field] : null;
};

export const describeOperationDelta = (scene: Scene3D, operation: SceneOperation): OperationDelta => {
  const obj = "objectId" in operation
    ? scene.objects.find((o) => o.id === operation.objectId)
    : undefined;
  const objName = "objectId" in operation
    ? resolveObjectName(scene, operation.objectId)
    : operation.type === "object.add"
      ? operation.object?.name ?? operation.kind ?? "new object"
      : "—";

  switch (operation.type) {
    case "object.add":
      return {
        label: `${objName} · object.add`,
        before: "—",
        after: operation.object?.name ?? operation.kind ?? "new object",
        kind: "add",
      };
    case "object.rename":
      return {
        label: `${objName} · object.rename`,
        before: obj?.name ?? "—",
        after: operation.name,
        kind: "mod",
      };
    case "transform.setField": {
      const before = readTransformField(obj, operation.field);
      return {
        label: `${objName} · transform.${operation.field}`,
        before: formatValue(before),
        after: formatValue(operation.value),
        kind: "mod",
      };
    }
    case "animation.setKeyframe": {
      const before = readAnimationValueAt(obj, operation.path, operation.frame);
      return {
        label: `${objName} · ${operation.path} @ f${operation.frame}`,
        before: formatValue(before),
        after: formatValue(operation.value),
        kind: before === null ? "add" : "mod",
      };
    }
    case "material.setColor": {
      const mat = obj && findComponent(obj, "material");
      return {
        label: `${objName} · material.color`,
        before: mat?.material.color ?? "—",
        after: operation.color,
        kind: "mod",
      };
    }
    case "light.set": {
      const light = obj && findComponent(obj, "light");
      const before = light ? (light as Record<string, unknown>)[operation.field as string] : undefined;
      return {
        label: `${objName} · light.${String(operation.field)}`,
        before: formatValue(before as AnimatableValue | undefined),
        after: formatValue(operation.value as AnimatableValue),
        kind: "mod",
      };
    }
    case "camera.set": {
      const cam = obj && findComponent(obj, "camera");
      const before = cam ? (cam as Record<string, unknown>)[operation.field as string] : undefined;
      return {
        label: `${objName} · camera.${String(operation.field)}`,
        before: formatValue(before as AnimatableValue | undefined),
        after: formatValue(operation.value as AnimatableValue),
        kind: "mod",
      };
    }
  }
};

export const createScenePatch = (
  summary: string,
  operations: SceneOperation[],
  provenance?: ScenePatchProvenance,
): ScenePatch => ({
  id: `patch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  summary,
  operations,
  changes: operations.map(describeSceneOperation),
  provenance,
  validation: { status: "unchecked", messages: [] },
  createdAt: new Date().toISOString(),
});
