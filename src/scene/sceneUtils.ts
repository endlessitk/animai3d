import type { Component, ComponentType, GameObject, Scene3D, Vec3 } from "./schema";

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
