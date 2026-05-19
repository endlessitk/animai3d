import type { Scene3D } from "./schema";
import { findComponent } from "./schema";
import { updateComponentAtIndex } from "./sceneUtils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Severity = "error" | "warning" | "info";

export type ValidationIssue = {
  id: string;
  rule: string;
  severity: Severity;
  message: string;
  /** GameObject the issue is anchored to (if any). */
  objectId?: string;
  /** Optional pure-function auto-fix. */
  fix?: (s: Scene3D) => Scene3D;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const isFinite3 = (v: [number, number, number]): boolean =>
  Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2]);

// ── Rules ─────────────────────────────────────────────────────────────────────

/**
 * Static rule engine — DESIGN_LANGUAGE §9.
 *
 * Each rule is implemented as a side-effect-free scan that emits zero or more
 * issues. Order does not matter; consumers sort by severity downstream. Rules
 * MUST NOT mutate scene; auto-fixes return a new scene.
 */
export const validateScene = (scene: Scene3D): ValidationIssue[] => {
  const out: ValidationIssue[] = [];

  // R1 — exactly one active camera (warn if zero, info if multiple)
  const cameras = scene.objects.filter((o) => findComponent(o, "camera"));
  const activeCameras = cameras.filter((o) => findComponent(o, "camera")?.active);
  if (cameras.length > 0 && activeCameras.length === 0) {
    const first = cameras[0];
    out.push({
      id: "no-active-camera",
      rule: "no-active-camera",
      severity: "error",
      message: `No camera marked active. Falling back to default perspective.`,
      objectId: first.id,
      fix: (s) => {
        const obj = s.objects.find((o) => o.id === first.id);
        if (!obj) return s;
        const camIdx = obj.components.findIndex((c) => c.type === "camera");
        if (camIdx < 0) return s;
        const cam = obj.components[camIdx];
        if (cam.type !== "camera") return s;
        return updateComponentAtIndex(s, first.id, camIdx, { ...cam, active: true });
      },
    });
  } else if (activeCameras.length > 1) {
    out.push({
      id: "multiple-active-cameras",
      rule: "multiple-active-cameras",
      severity: "info",
      message: `${activeCameras.length} cameras marked active — only the first will render.`,
    });
  }

  // R2 — material without mesh (orphan material)
  for (const obj of scene.objects) {
    const hasMaterial = !!findComponent(obj, "material");
    const hasMesh = !!findComponent(obj, "mesh");
    if (hasMaterial && !hasMesh) {
      out.push({
        id: `orphan-material:${obj.id}`,
        rule: "material-without-mesh",
        severity: "warning",
        message: `"${obj.name}" has a Material but no Mesh — it will not render.`,
        objectId: obj.id,
      });
    }
  }

  // R3 — NaN / Infinity in transform
  for (const obj of scene.objects) {
    const t = findComponent(obj, "transform");
    if (!t) continue;
    if (!isFinite3(t.transform.position) || !isFinite3(t.transform.rotation) || !isFinite3(t.transform.scale)) {
      out.push({
        id: `nan-transform:${obj.id}`,
        rule: "nan-transform",
        severity: "error",
        message: `"${obj.name}" transform contains NaN or Infinity.`,
        objectId: obj.id,
      });
    }
  }

  // R4 — zero scale (collapses geometry)
  for (const obj of scene.objects) {
    const t = findComponent(obj, "transform");
    if (!t) continue;
    const [sx, sy, sz] = t.transform.scale;
    if (sx === 0 || sy === 0 || sz === 0) {
      out.push({
        id: `zero-scale:${obj.id}`,
        rule: "zero-scale",
        severity: "warning",
        message: `"${obj.name}" has a zero-scale axis (${sx}, ${sy}, ${sz}).`,
        objectId: obj.id,
        fix: (s) => {
          const objCur = s.objects.find((o) => o.id === obj.id);
          if (!objCur) return s;
          const tIdx = objCur.components.findIndex((c) => c.type === "transform");
          if (tIdx < 0) return s;
          const cur = objCur.components[tIdx];
          if (cur.type !== "transform") return s;
          const fixed: [number, number, number] = [
            cur.transform.scale[0] || 1,
            cur.transform.scale[1] || 1,
            cur.transform.scale[2] || 1,
          ];
          return updateComponentAtIndex(s, obj.id, tIdx, {
            ...cur,
            transform: { ...cur.transform, scale: fixed },
          });
        },
      });
    }
  }

  // R5 — empty animation tracks (defensive — sceneUtils should already prune)
  for (const obj of scene.objects) {
    const anim = findComponent(obj, "animation");
    if (!anim) continue;
    const empties = anim.tracks.filter((t) => t.keyframes.length === 0);
    if (empties.length > 0) {
      out.push({
        id: `empty-anim-track:${obj.id}`,
        rule: "empty-animation-track",
        severity: "warning",
        message: `"${obj.name}" has ${empties.length} empty animation track(s).`,
        objectId: obj.id,
        fix: (s) => {
          const objCur = s.objects.find((o) => o.id === obj.id);
          if (!objCur) return s;
          const aIdx = objCur.components.findIndex((c) => c.type === "animation");
          if (aIdx < 0) return s;
          const cur = objCur.components[aIdx];
          if (cur.type !== "animation") return s;
          return updateComponentAtIndex(s, obj.id, aIdx, {
            ...cur,
            tracks: cur.tracks.filter((t) => t.keyframes.length > 0),
          });
        },
      });
    }
  }

  // R6 — extreme light intensity (positive runaway from agent drafts)
  for (const obj of scene.objects) {
    const light = findComponent(obj, "light");
    if (!light) continue;
    if (light.intensity < 0 || light.intensity > 100) {
      out.push({
        id: `extreme-light:${obj.id}`,
        rule: "extreme-light-intensity",
        severity: "warning",
        message: `"${obj.name}" light intensity is ${light.intensity} (expected 0–100).`,
        objectId: obj.id,
      });
    }
  }

  // R7 — duplicate names (information; rename is human-only)
  const seen = new Map<string, number>();
  for (const obj of scene.objects) {
    seen.set(obj.name, (seen.get(obj.name) ?? 0) + 1);
  }
  for (const [name, n] of seen) {
    if (n > 1) {
      out.push({
        id: `duplicate-name:${name}`,
        rule: "duplicate-name",
        severity: "info",
        message: `${n} objects share the name "${name}". Consider renaming for clarity.`,
      });
    }
  }

  return out;
};

// ── Summary helpers ──────────────────────────────────────────────────────────

export const countBySeverity = (issues: ValidationIssue[]): Record<Severity, number> => {
  const out: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const i of issues) out[i.severity] += 1;
  return out;
};

export const hasErrors = (issues: ValidationIssue[]): boolean =>
  issues.some((i) => i.severity === "error");
