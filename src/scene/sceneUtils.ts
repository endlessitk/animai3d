import type {
  AnimationComponent,
  AnimationProperty,
  Component,
  ComponentType,
  EasingName3D,
  GameObject,
  Keyframe3D,
  Scene3D,
  Transform3D,
  Vec3,
} from "./schema";

// ── Object-level mutations ───────────────────────────────────────────────────

export const toggleVisibility = (scene: Scene3D, id: string): Scene3D =>
  mapObj(scene, id, (o) => ({ ...o, visible: !o.visible }));

export const toggleLock = (scene: Scene3D, id: string): Scene3D =>
  mapObj(scene, id, (o) => ({ ...o, locked: !o.locked }));

export const renameObject = (scene: Scene3D, id: string, name: string): Scene3D =>
  mapObj(scene, id, (o) => ({ ...o, name }));

export const deleteObject = (scene: Scene3D, id: string): Scene3D => ({
  ...scene,
  objects: scene.objects.filter((o) => o.id !== id),
});

export const duplicateObject = (scene: Scene3D, id: string): Scene3D => {
  const src = scene.objects.find((o) => o.id === id);
  if (!src) return scene;
  const copy: GameObject = {
    ...src,
    id: `${src.id}-${Date.now()}`,
    name: `${src.name} (Copy)`,
  };
  const idx = scene.objects.indexOf(src);
  const arr = [...scene.objects];
  arr.splice(idx + 1, 0, copy);
  return { ...scene, objects: arr };
};

export const reorderObjects = (
  scene: Scene3D,
  fromIndex: number,
  toIndex: number,
): Scene3D => {
  if (fromIndex === toIndex) return scene;
  const arr = [...scene.objects];
  const [item] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, item);
  return { ...scene, objects: arr };
};

// ── Component-level mutations ────────────────────────────────────────────────

export const updateComponent = <T extends ComponentType>(
  scene: Scene3D,
  id: string,
  type: T,
  fn: (c: Extract<Component, { type: T }>) => Extract<Component, { type: T }>,
): Scene3D =>
  mapComp(scene, id, type, fn);

export const updateComponentAtIndex = (
  scene: Scene3D,
  id: string,
  index: number,
  next: Component,
): Scene3D =>
  mapObj(scene, id, (o) => ({
    ...o,
    components: o.components.map((c, i) => (i === index ? next : c)),
  }));

export const addComponent = (
  scene: Scene3D,
  id: string,
  component: Component,
): Scene3D =>
  mapObj(scene, id, (o) => ({
    ...o,
    components: [...o.components, component],
  }));

export const removeComponent = (
  scene: Scene3D,
  id: string,
  type: ComponentType,
): Scene3D => {
  if (type === "transform") return scene;
  return mapObj(scene, id, (o) => ({
    ...o,
    components: o.components.filter((c) => c.type !== type),
  }));
};

export const removeComponentAtIndex = (
  scene: Scene3D,
  id: string,
  index: number,
): Scene3D => {
  const obj = scene.objects.find((o) => o.id === id);
  if (!obj || obj.components[index]?.type === "transform") return scene;
  return mapObj(scene, id, (o) => ({
    ...o,
    components: o.components.filter((_, i) => i !== index),
  }));
};

export const setVec3Field = (
  scene: Scene3D,
  id: string,
  field: "position" | "rotation" | "scale",
  value: Vec3,
): Scene3D =>
  mapComp(scene, id, "transform", (c) => ({
    ...c,
    transform: { ...c.transform, [field]: value },
  }));

export const setObjectTransform = (
  scene: Scene3D,
  id: string,
  transform: import("./schema").Transform3D,
): Scene3D =>
  mapComp(scene, id, "transform", (c) => ({ ...c, transform }));

// ── Hierarchy mutations ──────────────────────────────────────────────────────

export const setParent = (scene: Scene3D, childId: string, parentId: string | null): Scene3D => {
  if (parentId !== null) {
    let cur: string | undefined = parentId;
    while (cur) {
      if (cur === childId) return scene;
      const p = scene.objects.find((o) => o.id === cur);
      cur = p?.parentId;
    }
  }
  return mapObj(scene, childId, (o) => ({ ...o, parentId: parentId ?? undefined }));
};

// ── Object factory ────────────────────────────────────────────────────────────

export type AddObjectKind =
  | "box"
  | "sphere"
  | "cylinder"
  | "plane"
  | "torus"
  | "empty"
  | "point-light"
  | "directional-light"
  | "spot-light"
  | "ambient-light"
  | "camera";

let _objCounter = 0;

function makeTransform(position: Vec3): Extract<Component, { type: "transform" }> {
  return { type: "transform", transform: { position, rotation: [0, 0, 0], scale: [1, 1, 1] } };
}

function buildGameObject(kind: AddObjectKind, position: Vec3): GameObject {
  const id = `go-${Date.now()}-${++_objCounter}`;
  const t = makeTransform(position);
  switch (kind) {
    case "box":
      return { id, name: "Box", visible: true, locked: false, components: [t, { type: "mesh", primitive: { kind: "box", size: [1, 1, 1] } }, { type: "material", material: { kind: "standard", color: "#7ab841" } }] };
    case "sphere":
      return { id, name: "Sphere", visible: true, locked: false, components: [t, { type: "mesh", primitive: { kind: "sphere", radius: 0.5 } }, { type: "material", material: { kind: "standard", color: "#4a9bd4" } }] };
    case "cylinder":
      return { id, name: "Cylinder", visible: true, locked: false, components: [t, { type: "mesh", primitive: { kind: "cylinder", radiusTop: 0.5, radiusBottom: 0.5, height: 1 } }, { type: "material", material: { kind: "standard", color: "#e74c3c" } }] };
    case "plane":
      return { id, name: "Plane", visible: true, locked: false, components: [t, { type: "mesh", primitive: { kind: "plane", width: 2, height: 2 } }, { type: "material", material: { kind: "standard", color: "#888888" } }] };
    case "torus":
      return { id, name: "Torus", visible: true, locked: false, components: [t, { type: "mesh", primitive: { kind: "torus", radius: 0.5, tube: 0.2 } }, { type: "material", material: { kind: "standard", color: "#f0a500" } }] };
    case "empty":
      return { id, name: "Empty", visible: true, locked: false, components: [t] };
    case "point-light":
      return { id, name: "Point Light", visible: true, locked: false, components: [t, { type: "light", kind: "point", color: "#ffffff", intensity: 1 }] };
    case "directional-light":
      return { id, name: "Directional Light", visible: true, locked: false, components: [t, { type: "light", kind: "directional", color: "#ffffff", intensity: 1 }] };
    case "spot-light":
      return { id, name: "Spot Light", visible: true, locked: false, components: [t, { type: "light", kind: "spot", color: "#ffffff", intensity: 1, angle: Math.PI / 6 }] };
    case "ambient-light":
      return { id, name: "Ambient Light", visible: true, locked: false, components: [t, { type: "light", kind: "ambient", color: "#ffffff", intensity: 0.5 }] };
    case "camera":
      return { id, name: "Camera", visible: true, locked: false, components: [t, { type: "camera", kind: "perspective", fov: 45, near: 0.1, far: 200, active: false }] };
  }
}

export const addNewObject = (scene: Scene3D, kind: AddObjectKind, position: Vec3 = [0, 1, 0]): Scene3D => ({
  ...scene,
  objects: [...scene.objects, buildGameObject(kind, position)],
});

// ── Animation mutations ──────────────────────────────────────────────────────

const ensureAnimationComponent = (obj: GameObject): GameObject => {
  if (obj.components.some((c) => c.type === "animation")) return obj;
  const empty: AnimationComponent = { type: "animation", tracks: [] };
  return { ...obj, components: [...obj.components, empty] };
};

const upsertKeyframe = (
  track: { property: AnimationProperty; keyframes: Keyframe3D[] },
  frame: number,
  value: Vec3,
  easing: EasingName3D,
) => {
  const idx = track.keyframes.findIndex((k) => k.frame === frame);
  if (idx >= 0) {
    const next = [...track.keyframes];
    next[idx] = { frame, value, easing };
    return next;
  }
  return [...track.keyframes, { frame, value, easing }].sort((a, b) => a.frame - b.frame);
};

export const setKeyframe = (
  scene: Scene3D,
  id: string,
  property: AnimationProperty,
  frame: number,
  value: Vec3,
  easing: EasingName3D = "linear",
): Scene3D => {
  const withAnim = mapObj(scene, id, ensureAnimationComponent);
  return mapObj(withAnim, id, (o) => ({
    ...o,
    components: o.components.map((c) => {
      if (c.type !== "animation") return c;
      const existing = c.tracks.find((t) => t.property === property);
      if (existing) {
        return {
          ...c,
          tracks: c.tracks.map((t) =>
            t.property === property
              ? { ...t, keyframes: upsertKeyframe(t, frame, value, easing) }
              : t,
          ),
        };
      }
      return {
        ...c,
        tracks: [...c.tracks, { property, keyframes: [{ frame, value, easing }] }],
      };
    }),
  }));
};

export const removeKeyframe = (
  scene: Scene3D,
  id: string,
  property: AnimationProperty,
  frame: number,
): Scene3D =>
  mapObj(scene, id, (o) => ({
    ...o,
    components: o.components.map((c) => {
      if (c.type !== "animation") return c;
      return {
        ...c,
        tracks: c.tracks
          .map((t) =>
            t.property === property
              ? { ...t, keyframes: t.keyframes.filter((k) => k.frame !== frame) }
              : t,
          )
          .filter((t) => t.keyframes.length > 0),
      };
    }),
  }));

// ── Private helpers ──────────────────────────────────────────────────────────

const mapObj = (
  scene: Scene3D,
  id: string,
  fn: (o: GameObject) => GameObject,
): Scene3D => ({
  ...scene,
  objects: scene.objects.map((o) => (o.id === id ? fn(o) : o)),
});

function mapComp<T extends ComponentType>(
  scene: Scene3D,
  id: string,
  type: T,
  fn: (c: Extract<Component, { type: T }>) => Extract<Component, { type: T }>,
): Scene3D {
  return mapObj(scene, id, (o) => ({
    ...o,
    components: o.components.map((c) =>
      c.type === type ? fn(c as Extract<Component, { type: T }>) : c,
    ),
  }));
}
