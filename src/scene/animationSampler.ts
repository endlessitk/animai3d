import type {
  AnimatableValue,
  AnimationComponent,
  AnimationPath,
  EasingName3D,
  Keyframe3D,
  LegacyAnimationProperty,
  Vec3,
} from "./schema";

const LEGACY_PATHS: Record<LegacyAnimationProperty, AnimationPath> = {
  position: "transform.position",
  rotation: "transform.rotation",
  scale: "transform.scale",
};

export const normalizeAnimationPath = (
  path: AnimationPath | LegacyAnimationProperty,
): AnimationPath =>
  path in LEGACY_PATHS ? LEGACY_PATHS[path as LegacyAnimationProperty] : path as AnimationPath;

const ease = (t: number, name: EasingName3D): number => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  switch (name) {
    case "step":
      return 0;
    case "ease-in":
      return t * t;
    case "ease-out":
      return 1 - (1 - t) * (1 - t);
    case "ease-in-out":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "linear":
    default:
      return t;
  }
};

const isVec3 = (value: AnimatableValue): value is Vec3 =>
  Array.isArray(value) && value.length === 3;

const isColor = (value: AnimatableValue): value is string =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

const lerpNumber = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerpNumber(a[0], b[0], t),
  lerpNumber(a[1], b[1], t),
  lerpNumber(a[2], b[2], t),
];

const hexToRgb = (hex: string): Vec3 => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const rgbToHex = ([r, g, b]: Vec3): string => {
  const channel = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
};

const interpolateValue = (
  a: AnimatableValue,
  b: AnimatableValue,
  t: number,
): AnimatableValue => {
  if (typeof a === "number" && typeof b === "number") return lerpNumber(a, b, t);
  if (isVec3(a) && isVec3(b)) return lerpVec3(a, b, t);
  if (isColor(a) && isColor(b)) return rgbToHex(lerpVec3(hexToRgb(a), hexToRgb(b), t));
  return t < 1 ? a : b;
};

export const sampleTrack = (
  keyframes: Keyframe3D[],
  frame: number,
): AnimatableValue | null => {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  if (frame <= sorted[0].frame) return sorted[0].value;
  if (frame >= sorted[sorted.length - 1].frame) return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const span = b.frame - a.frame;
      const t = span === 0 ? 0 : (frame - a.frame) / span;
      return interpolateValue(a.value, b.value, ease(t, a.easing));
    }
  }
  return sorted[sorted.length - 1].value;
};

export type SampledAnimation = Partial<Record<AnimationPath, AnimatableValue>>;

export const sampleAnimation = (
  anim: AnimationComponent,
  frame: number,
): SampledAnimation => {
  const result: SampledAnimation = {};
  for (const track of anim.tracks) {
    const value = sampleTrack(track.keyframes, frame);
    if (value !== null) result[normalizeAnimationPath(track.path ?? track.property)] = value;
  }
  return result;
};

export const sampledVec3 = (
  sampled: SampledAnimation,
  path: AnimationPath,
): Vec3 | undefined => {
  const value = sampled[path];
  if (value === undefined) return undefined;
  return isVec3(value) ? value : undefined;
};

export const sampledNumber = (
  sampled: SampledAnimation,
  path: AnimationPath,
): number | undefined => {
  const value = sampled[path];
  if (value === undefined) return undefined;
  return typeof value === "number" ? value : undefined;
};

export const sampledColor = (
  sampled: SampledAnimation,
  path: AnimationPath,
): string | undefined => {
  const value = sampled[path];
  if (value === undefined) return undefined;
  return isColor(value) ? value : undefined;
};
