import React from "react";
import { useStudioState } from "../../state/studioState";
import type { Scene3D } from "../../scene/schema";
import { findComponent } from "../../scene/schema";
import type { Transaction } from "../../state/transactions";

export type StatusBarProps = {
  scene: Scene3D;
  fps: number;
  frame: number;
  durationInFrames: number;
  lastTransaction?: Transaction;
};

/**
 * §8 Status bar — 22px.
 *
 * Tris/verts are approximated from primitive geometry on the GameObjects in
 * the scene (Sprint 1 uses procedural <boxGeometry>/<planeGeometry> etc.;
 * Sprint 3+ when mesh assets land we'll read real triangle counts off the
 * loaded BufferGeometry). The estimate is good enough to surface a "scene
 * is getting heavy" signal in the meantime.
 */
const TRI_HINT_PER_PRIMITIVE: Record<string, number> = {
  box: 12,
  sphere: 32 * 16 * 2,
  cylinder: 16 * 2 * 3,
  plane: 2,
  torus: 12 * 48 * 2,
};

const estimateTris = (scene: Scene3D): { tris: number; verts: number; meshes: number } => {
  let tris = 0;
  let meshes = 0;
  for (const obj of scene.objects) {
    const mesh = findComponent(obj, "mesh");
    if (!mesh) continue;
    meshes += 1;
    tris += TRI_HINT_PER_PRIMITIVE[mesh.primitive.kind] ?? 0;
  }
  return { tris, verts: Math.round(tris * 0.5), meshes };
};

const fpsClass = (fps: number): string => {
  if (fps >= 50) return "fps-good";
  if (fps >= 28) return "fps-mid";
  return "fps-bad";
};

const formatNumber = (n: number): string => n.toLocaleString("en-US");

export const StatusBar: React.FC<StatusBarProps> = ({ scene, fps, frame, durationInFrames, lastTransaction }) => {
  const { state, toggleValidationDrawer, toggleAgentPanel } = useStudioState();
  const stats = estimateTris(scene);
  const selectedObject = state.selectedId
    ? scene.objects.find((o) => o.id === state.selectedId)
    : null;

  const validationCount = 0; // Sprint 5 will surface real counts.

  return (
    <footer className="status-bar">
      <span className="status-bar__item">
        <strong>{state.mode === "object" ? "Object Mode" : state.mode}</strong>
      </span>
      <span className="status-bar__sep">|</span>

      <span className="status-bar__item">
        {selectedObject ? (
          <>
            <strong>{selectedObject.name}</strong>
            <span>({1} selected)</span>
          </>
        ) : (
          <span>nothing selected</span>
        )}
      </span>
      <span className="status-bar__sep">|</span>

      <span className="status-bar__item">
        <span>tris</span>
        <strong>{formatNumber(stats.tris)}</strong>
        <span>verts</span>
        <strong>{formatNumber(stats.verts)}</strong>
      </span>
      <span className="status-bar__sep">|</span>

      <span className="status-bar__item">
        <span>frame</span>
        <strong>{frame}</strong>
        <span>/</span>
        <strong>{durationInFrames}</strong>
      </span>
      <span className="status-bar__sep">|</span>

      <span className="status-bar__item">
        <span>fps</span>
        <strong className={fpsClass(fps)}>{fps.toFixed(0)}</strong>
      </span>

      <span className="status-bar__spacer" />

      <button
        type="button"
        className={`status-bar__chip ${validationCount > 0 ? "is-warning" : ""}`}
        onClick={toggleValidationDrawer}
        title="Toggle validation drawer"
      >
        {validationCount > 0 ? `⚠ ${validationCount}` : "✓ clean"}
      </button>

      {lastTransaction && (
        <span className="status-bar__chip status-bar__chip--tx" title={lastTransaction.description}>
          {lastTransaction.id}
        </span>
      )}

      <button
        type="button"
        className={`status-bar__chip is-agent ${state.agentPanelOpen ? "is-pulse" : ""}`}
        onClick={toggleAgentPanel}
        title="Agent Workbench (F12)"
      >
        ●agent · idle
      </button>
    </footer>
  );
};
