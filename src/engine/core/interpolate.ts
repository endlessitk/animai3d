import type { Keyframe } from "../../scene/schema";
import { applyEasing } from "./easing";

const sortedFor = (keyframes: Keyframe[], property: string): Keyframe[] =>
  keyframes.filter((item) => item.property === property).sort((a, b) => a.frame - b.frame);

export const interpolateProperty = (
  keyframes: Keyframe[],
  property: string,
  frame: number,
  fallback: unknown,
): string | number | boolean | unknown => {
  const frames = sortedFor(keyframes, property);
  if (frames.length === 0) return fallback;
  if (frame <= frames[0].frame) return frames[0].value;
  if (frame >= frames[frames.length - 1].frame) return frames[frames.length - 1].value;

  let prev = frames[0];
  let next = frames[frames.length - 1];
  for (let i = 0; i < frames.length - 1; i += 1) {
    if (frames[i].frame <= frame && frames[i + 1].frame >= frame) {
      prev = frames[i];
      next = frames[i + 1];
      break;
    }
  }

  if (typeof prev.value !== "number" || typeof next.value !== "number") return prev.value;

  const span = Math.max(1, next.frame - prev.frame);
  const local = (frame - prev.frame) / span;
  const eased = applyEasing(local, next.easing);
  return prev.value + (next.value - prev.value) * eased;
};

export const interpolateNumber = (
  keyframes: Keyframe[],
  property: string,
  frame: number,
  fallback: number,
): number => {
  const value = interpolateProperty(keyframes, property, frame, fallback);
  return typeof value === "number" ? value : fallback;
};
