import type { EasingName } from "../../scene/schema";

export type EasingFn = (t: number) => number;

const linear: EasingFn = (t) => t;
const easeIn: EasingFn = (t) => t * t;
const easeOut: EasingFn = (t) => 1 - Math.pow(1 - t, 2);
const easeInOut: EasingFn = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const springSoft: EasingFn = (t) => {
  const c = 1.70158 + 1;
  return 1 + c * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
};

export const EASINGS: Record<EasingName, EasingFn> = {
  linear,
  "ease-in": easeIn,
  "ease-out": easeOut,
  "ease-in-out": easeInOut,
  "spring-soft": springSoft,
};

export const applyEasing = (t: number, easing: EasingName): number => {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const fn = EASINGS[easing] ?? linear;
  return fn(clamped);
};
