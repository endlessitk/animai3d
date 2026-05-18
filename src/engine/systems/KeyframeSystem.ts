import type { EasingName, Keyframe, SceneObject } from "../../scene/schema";

export const upsertKeyframe = (
  keyframes: Keyframe[],
  property: string,
  frame: number,
  value: string | number | boolean,
  easing: EasingName = "ease-in-out",
): Keyframe[] => {
  const filtered = keyframes.filter((item) => !(item.frame === frame && item.property === property));
  return [...filtered, { frame, property, value, easing }].sort((a, b) => a.frame - b.frame);
};

export const removeKeyframe = (keyframes: Keyframe[], property: string, frame: number): Keyframe[] =>
  keyframes.filter((item) => !(item.frame === frame && item.property === property));

export const keyframesForProperty = (keyframes: Keyframe[], property: string): Keyframe[] =>
  keyframes.filter((item) => item.property === property).sort((a, b) => a.frame - b.frame);

export const applyKeyframesPatch = (object: SceneObject, keyframes: Keyframe[]): SceneObject => ({
  ...object,
  keyframes,
});
