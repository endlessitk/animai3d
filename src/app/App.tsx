import React, { useEffect, useState } from "react";
import { SceneRenderer3D } from "../scene/SceneRenderer3D";
import { useViewport3DRuntime } from "../engine/runtime/Viewport3DRuntime";
import { defaultProject, defaultScene3D } from "../scene/defaultData3d";
import type { Scene3D, StudioProject } from "../scene/schema";
import { findComponent, getTransform } from "../scene/schema";
import { downloadJson, loadJson, saveJson } from "../storage/localStore";
import "./styles.css";

/**
 * App shell — Sprint 1 (engine-foundation only).
 *
 * The visual chrome rewrite (CSS Grid + tokens + Workspace/Toolbar per
 * DESIGN_LANGUAGE.md §1–3) lands in Sprint 2. This shell is a placeholder
 * just rich enough to host the R3F Canvas and prove the save/load roundtrip.
 */
export const App: React.FC = () => {
  const [project] = useState<StudioProject>(() => loadJson("project", defaultProject));
  const [scene, setScene] = useState<Scene3D>(() => loadJson("scene3d", defaultScene3D));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const runtime = useViewport3DRuntime(project, scene);
  const frame = Math.round(runtime.state.frame);

  useEffect(() => saveJson("scene3d", scene), [scene]);
  useEffect(() => saveJson("project", project), [project]);

  const selected = selectedId ? scene.objects.find((o) => o.id === selectedId) ?? null : null;

  const resetScene = () => {
    setScene(defaultScene3D);
    setSelectedId(null);
  };

  return (
    <main className="studio-shell-3d">
      <header className="topbar">
        <div className="brand">
          <span className="brand-tag">AGENTIC</span>
          <strong>3D Studio</strong>
          <span className="brand-version">Sprint 1 · engine foundation</span>
        </div>
        <div className="topbar-actions">
          <button onClick={() => downloadJson("scene3d.json", scene)}>Export Scene</button>
          <button onClick={resetScene}>Reset</button>
        </div>
      </header>

      <aside className="outliner">
        <h2>Outliner</h2>
        <ul className="object-list">
          {scene.objects.map((object) => {
            const cam = findComponent(object, "camera");
            const light = findComponent(object, "light");
            const mesh = findComponent(object, "mesh");
            const badge = cam ? "CAM" : light ? "LGT" : mesh ? "MSH" : "—";
            return (
              <li
                key={object.id}
                className={`object-row ${selectedId === object.id ? "active" : ""} ${object.locked ? "locked" : ""}`}
                onClick={() => setSelectedId(object.id)}
              >
                <span className="object-badge">{badge}</span>
                <span className="object-name">{object.name}</span>
                {object.locked && <span className="object-lock">🔒</span>}
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="viewport-area">
        <div className="viewport-canvas">
          <SceneRenderer3D
            scene={scene}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="viewport-hud">
            <div><span>frame</span><strong>{frame} / {runtime.state.durationInFrames}</strong></div>
            <div><span>fps</span><strong>{runtime.state.fps.toFixed(0)} ({runtime.state.measuredFps.toFixed(1)})</strong></div>
            <div><span>objects</span><strong>{runtime.objectCount}</strong></div>
            <div><span>engine</span><strong>three + R3F</strong></div>
          </div>
        </div>
        <footer className="transport-bar">
          <button onClick={runtime.goToStart} title="Go to start">|◀</button>
          <button onClick={runtime.prevFrame} title="Previous frame">◀</button>
          <button className="primary" onClick={runtime.toggle}>
            {runtime.state.playing ? "Pause" : "Play"}
          </button>
          <button onClick={runtime.stop} title="Stop">■</button>
          <button onClick={runtime.nextFrame} title="Next frame">▶</button>
          <button onClick={runtime.goToEnd} title="Go to end">▶|</button>
          <button
            className={runtime.state.loop ? "active" : ""}
            onClick={() => runtime.setLoop(!runtime.state.loop)}
            title="Toggle loop"
          >
            Loop
          </button>
          <input
            className="scrubber"
            type="range"
            min={0}
            max={runtime.state.durationInFrames}
            value={frame}
            onChange={(event) => runtime.seek(Number(event.target.value))}
          />
          <span className="time-display">
            {(frame / runtime.state.fps).toFixed(2)}s / {(runtime.state.durationInFrames / runtime.state.fps).toFixed(2)}s
          </span>
        </footer>
      </section>

      <aside className="inspector">
        <h2>Inspector</h2>
        {selected ? (
          <>
            <div className="inspector-header">
              <div className="inspector-name">{selected.name}</div>
              <div className="inspector-id">{selected.id}</div>
            </div>
            <div className="component-stack">
              {selected.components.map((component, index) => (
                <div key={`${component.type}-${index}`} className="component-card">
                  <div className="component-card-header">{component.type}</div>
                  <pre className="component-card-body">{JSON.stringify(component, null, 2)}</pre>
                </div>
              ))}
            </div>
            <details className="inspector-debug">
              <summary>Resolved transform</summary>
              <pre>{JSON.stringify(getTransform(selected), null, 2)}</pre>
            </details>
          </>
        ) : (
          <p className="inspector-empty">Select an object in the viewport or outliner.</p>
        )}
      </aside>

      <footer className="status-bar">
        <span>scene · {scene.objects.length} objects</span>
        <span>·</span>
        <span>{project.width}×{project.height} @ {project.fps}fps</span>
        <span>·</span>
        <span>{runtime.state.playing ? "PLAY" : "IDLE"}</span>
      </footer>
    </main>
  );
};
