import type {
  AnimationComponent,
  AnimationProperty,
  EasingName3D,
  Keyframe3D,
  Vec3,
} from "./schema";

// ── Easing ────────────────────────────────────────────────────────────────────

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

const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

// ── Track sampling ────────────────────────────────────────────────────────────

/**
 * Returns the interpolated Vec3 for `frame` against a sorted keyframe list.
 * - frame before first keyframe → first.value (clamp left)
 * - frame after last keyframe → last.value (clamp right)
 * - between two keyframes → eased lerp
 * - empty list → null (caller should fall back)
 */
export const sampleTrack = (keyframes: Keyframe3D[], frame: number): Vec3 | null => {
  if (keyframes.length === 0) return null;
  if (frame <= keyframes[0].frame) return keyframes[0].value;
  if (frame >= keyframes[keyframes.length - 1].frame) return keyframes[keyframes.length - 1].value;

  // Binary-friendly linear scan (lists are tiny in DCC contexts).
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const span = b.frame - a.frame;
      const t = span === 0 ? 0 : (frame - a.frame) / span;
      return lerpVec3(a.value, b.value, ease(t, a.easing));
    }
  }
  return keyframes[keyframes.length - 1].value;
};

// ── Component-level evaluator ────────────────────────────────────────────────

export type SampledTransform = Partial<Record<AnimationProperty, Vec3>>;

export const sampleAnimation = (
  anim: AnimationComponent,
  frame: number,
): SampledTransform => {
  const result: SampledTransform = {};
  for (const track of anim.tracks) {
    const v = sampleTrack(track.keyframes, frame);
    if (v) result[track.property] = v;
  }
  return result;
};
