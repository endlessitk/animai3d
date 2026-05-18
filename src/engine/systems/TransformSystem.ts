import type { SceneObject, Transform } from "../../scene/schema";
import { composeTransformString, IDENTITY_TRANSFORM } from "../core/transformMath";

export const mergeTransform = (base: Transform, patch: Partial<Transform>): Transform => ({
  ...base,
  ...patch,
});

export const resetTransform = (): Transform => ({ ...IDENTITY_TRANSFORM });

export const applyTransformPatch = (object: SceneObject, patch: Partial<Transform>): SceneObject => ({
  ...object,
  transform: mergeTransform(object.transform, patch),
});

export const transformToSvg = (transform: Transform): string => composeTransformString(transform);
