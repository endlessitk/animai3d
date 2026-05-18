import type { EvaluatedSceneObject } from "../core/evaluateObject";

export type Point = { x: number; y: number };

export type BoundingBox = { x: number; y: number; width: number; height: number };

const num = (value: unknown, fallback: number): number => (typeof value === "number" ? value : fallback);

export const getObjectBounds = (object: EvaluatedSceneObject): BoundingBox => {
  const { x, y, scaleX, scaleY } = object.evaluatedTransform;
  if (object.type === "shape" && object.evaluatedStyle.shape === "circle") {
    const r = num(object.evaluatedStyle.radius, 64) * Math.max(scaleX, scaleY);
    return { x: x - r, y: y - r, width: r * 2, height: r * 2 };
  }
  if (object.type === "text") {
    const w = num(object.evaluatedStyle.fontSize, 42) * String(object.evaluatedStyle.text ?? object.name).length * 0.55;
    const h = num(object.evaluatedStyle.fontSize, 42) * 1.2;
    return { x, y: y - h * 0.8, width: w * scaleX, height: h * scaleY };
  }
  const w = num(object.evaluatedStyle.width, 200) * scaleX;
  const h = num(object.evaluatedStyle.height, 120) * scaleY;
  return { x, y, width: w, height: h };
};

export const pointInBox = (point: Point, box: BoundingBox): boolean =>
  point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;

export const hitTest = (objects: EvaluatedSceneObject[], point: Point): EvaluatedSceneObject | null => {
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    const object = objects[i];
    if (object.locked || !object.visible) continue;
    if (pointInBox(point, getObjectBounds(object))) return object;
  }
  return null;
};
