import type { EvaluatedSceneObject } from "../core/evaluateObject";
import { getObjectBounds, type BoundingBox } from "./HitTestSystem";

export type GizmoHandleKind = "move" | "scale-nw" | "scale-ne" | "scale-sw" | "scale-se" | "rotate";

export type GizmoHandle = {
  kind: GizmoHandleKind;
  x: number;
  y: number;
};

export type Gizmo = {
  objectId: string;
  bounds: BoundingBox;
  handles: GizmoHandle[];
};

export const buildGizmo = (object: EvaluatedSceneObject): Gizmo => {
  const bounds = getObjectBounds(object);
  const handles: GizmoHandle[] = [
    { kind: "move", x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    { kind: "scale-nw", x: bounds.x, y: bounds.y },
    { kind: "scale-ne", x: bounds.x + bounds.width, y: bounds.y },
    { kind: "scale-sw", x: bounds.x, y: bounds.y + bounds.height },
    { kind: "scale-se", x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { kind: "rotate", x: bounds.x + bounds.width / 2, y: bounds.y - 40 },
  ];
  return { objectId: object.id, bounds, handles };
};

export const gizmosForSelection = (objects: EvaluatedSceneObject[], selectedIds: string[]): Gizmo[] =>
  objects.filter((object) => selectedIds.includes(object.id)).map(buildGizmo);
