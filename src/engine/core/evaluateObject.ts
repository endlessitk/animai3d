import type { SceneObject, Transform } from "../../scene/schema";
import type { FrameContext } from "./frameContext";
import { interpolateNumber, interpolateProperty } from "./interpolate";

export type EvaluatedSceneObject = SceneObject & {
  evaluatedTransform: Transform;
  evaluatedStyle: Record<string, unknown>;
  zIndex: number;
};

const STYLE_NUMERIC_KEYS = new Set([
  "width",
  "height",
  "radius",
  "fontSize",
  "letterSpacing",
  "strokeWidth",
  "zIndex",
]);

const STYLE_STRING_KEYS = new Set([
  "fill",
  "stroke",
  "text",
  "fontFamily",
  "filter",
  "shape",
]);

const resolveTransform = (object: SceneObject, frame: number): Transform => ({
  x: interpolateNumber(object.keyframes, "x", frame, object.transform.x),
  y: interpolateNumber(object.keyframes, "y", frame, object.transform.y),
  scaleX: interpolateNumber(object.keyframes, "scaleX", frame, object.transform.scaleX),
  scaleY: interpolateNumber(object.keyframes, "scaleY", frame, object.transform.scaleY),
  rotation: interpolateNumber(object.keyframes, "rotation", frame, object.transform.rotation),
  opacity: interpolateNumber(object.keyframes, "opacity", frame, object.transform.opacity),
});

const resolveStyle = (object: SceneObject, frame: number): Record<string, unknown> => {
  const out: Record<string, unknown> = { ...object.style };
  for (const key of Object.keys(out)) {
    if (STYLE_NUMERIC_KEYS.has(key)) {
      const fallback = typeof out[key] === "number" ? (out[key] as number) : 0;
      out[key] = interpolateNumber(object.keyframes, key, frame, fallback);
    } else if (STYLE_STRING_KEYS.has(key)) {
      out[key] = interpolateProperty(object.keyframes, key, frame, out[key]);
    }
  }
  return out;
};

const readZIndex = (style: Record<string, unknown>): number => {
  const value = style.zIndex;
  return typeof value === "number" ? value : 0;
};

export const evaluateObject = (object: SceneObject, ctx: FrameContext): EvaluatedSceneObject => {
  const evaluatedTransform = resolveTransform(object, ctx.frame);
  const evaluatedStyle = resolveStyle(object, ctx.frame);
  return {
    ...object,
    transform: evaluatedTransform,
    style: evaluatedStyle,
    evaluatedTransform,
    evaluatedStyle,
    zIndex: readZIndex(evaluatedStyle),
  };
};
