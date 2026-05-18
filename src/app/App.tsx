import React, { useEffect, useMemo, useState } from "react";
import { LiveSvgRenderer } from "../engine/renderers/LiveSvgRenderer";
import { useViewportRuntime } from "../engine/runtime/ViewportRuntime";
import { upsertKeyframe } from "../engine/systems/KeyframeSystem";
import { defaultAssets, defaultProject, defaultScene } from "../scene/defaultData";
import type { Asset, Scene, SceneObject, StudioProject, Transform } from "../scene/schema";
import { downloadJson, loadJson, saveJson } from "../storage/localStore";
import { createAgentTask } from "../tasks/createAgentTask";
import { normalizeSvgForAsset } from "../assets/assetUtils";
import "./styles.css";

type Snapshot = { scene: Scene; assets: Asset[] };

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const transformFields: Array<keyof Transform> = ["x", "y", "scaleX", "scaleY", "rotation", "opacity"];

const defaultShape = (): SceneObject => ({
  id: makeId("shape"),
  type: "shape",
  name: "New Shape",
  transform: { x: 760, y: 430, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  style: { shape: "rect", width: 220, height: 140, radius: 18, fill: "#24ff9b", stroke: "#baffd8", strokeWidth: 2 },
  keyframes: [],
  visible: true,
  locked: false,
});

const defaultText = (): SceneObject => ({
  id: makeId("text"),
  type: "text",
  name: "New Text",
  transform: { x: 690, y: 540, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  style: { text: "NEW MOTION", fill: "#ffffff", fontSize: 64, letterSpacing: 2, fontFamily: "serif" },
  keyframes: [],
  visible: true,
  locked: false,
});

export const App: React.FC = () => {
  const [project] = useState<StudioProject>(() => loadJson("project", defaultProject));
  const [scene, setScene] = useState<Scene>(() => loadJson("scene", defaultScene));
  const [assets, setAssets] = useState<Asset[]>(() => loadJson("assets", defaultAssets));
  const [selectedId, setSelectedId] = useState(scene.objects.find((object) => !object.locked)?.id ?? "");
  const runtime = useViewportRuntime(project, scene);
  const frame = Math.round(runtime.state.frame);
  const setFrame = runtime.seek;
  const [taskPrompt, setTaskPrompt] = useState("Create a glowing editable SVG asset and add it to the scene.");
  const [taskPreview, setTaskPreview] = useState("");
  const [history, setHistory] = useState<Snapshot[]>([]);
  const selected = scene.objects.find((object) => object.id === selectedId);
  const library = useMemo(() => assets.map((asset) => `${asset.name} (${asset.type})`), [assets]);

  useEffect(() => saveJson("scene", scene), [scene]);
  useEffect(() => saveJson("assets", assets), [assets]);
  useEffect(() => saveJson("project", project), [project]);

  const commit = (nextScene: Scene, nextAssets = assets) => {
    setHistory((items) => [...items.slice(-24), { scene: clone(scene), assets: clone(assets) }]);
    setScene(nextScene);
    setAssets(nextAssets);
  };

  const updateSelected = (patch: Partial<SceneObject>) => {
    if (!selected || selected.locked) return;
    const next = { ...scene, objects: scene.objects.map((object) => (object.id === selected.id ? { ...object, ...patch } : object)) };
    commit(next);
  };

  const updateTransform = (key: keyof Transform, value: number) => {
    if (!selected) return;
    updateSelected({ transform: { ...selected.transform, [key]: value } });
  };

  const updateStyle = (key: string, value: string | number) => {
    if (!selected) return;
    updateSelected({ style: { ...selected.style, [key]: value } });
  };

  const addObject = (object: SceneObject) => {
    commit({ ...scene, objects: [...scene.objects, object] });
    setSelectedId(object.id);
  };

  const deleteSelected = () => {
    if (!selected || selected.locked) return;
    commit({ ...scene, objects: scene.objects.filter((object) => object.id !== selected.id) });
    setSelectedId("");
  };

  const addKeyframe = (property: keyof Transform) => {
    if (!selected) return;
    const keyframes = upsertKeyframe(selected.keyframes, property, frame, selected.transform[property], "ease-in-out");
    updateSelected({ keyframes });
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setScene(last.scene);
    setAssets(last.assets);
    setHistory((items) => items.slice(0, -1));
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const id = makeId("asset");
      const isSvg = file.type.includes("svg") || file.name.endsWith(".svg");
      const asset: Asset = isSvg
        ? { id, type: "svg", name: file.name, createdBy: "user", tags: ["upload"], svg: normalizeSvgForAsset(result), editableParams: ["transform", "opacity"] }
        : { id, type: "image", name: file.name, createdBy: "user", tags: ["upload"], source: result, editableParams: ["transform", "opacity"] };
      const object: SceneObject = {
        id: makeId(isSvg ? "svg" : "image"),
        type: isSvg ? "svg" : "image",
        name: file.name,
        assetId: id,
        transform: { x: 760, y: 360, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
        style: { width: 360, height: 260 },
        keyframes: [],
        visible: true,
        locked: false,
      };
      commit({ ...scene, objects: [...scene.objects, object] }, [...assets, asset]);
      setSelectedId(object.id);
    };
    if (file.type.includes("image") && !file.name.endsWith(".svg")) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  const createTask = () => {
    const task = createAgentTask({ prompt: taskPrompt, selectedObjectIds: selectedId ? [selectedId] : [] });
    setTaskPreview(JSON.stringify(task, null, 2));
  };

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <div className="brand-block">
          <span>AI Integrated</span>
          <strong>2D Animation Space</strong>
        </div>
        <section>
          <h2>Assets</h2>
          {library.map((item) => <button key={item} className="list-row">{item}</button>)}
          <label className="upload-button">
            Upload SVG/Image
            <input type="file" accept=".svg,image/*" onChange={(event) => event.target.files?.[0] && handleUpload(event.target.files[0])} />
          </label>
        </section>
        <section>
          <h2>Objects</h2>
          {scene.objects.map((object) => (
            <button key={object.id} className={`list-row ${selectedId === object.id ? "active" : ""}`} onClick={() => setSelectedId(object.id)}>
              <span>{object.name}</span>
              <small>{object.type}</small>
            </button>
          ))}
        </section>
      </aside>

      <section className="studio-main">
        <header className="toolbar">
          <button onClick={() => addObject(defaultShape())}>New Shape</button>
          <button onClick={() => addObject(defaultText())}>New Text</button>
          <button onClick={deleteSelected}>Delete</button>
          <button onClick={undo}>Undo</button>
          <button onClick={() => downloadJson("scene.json", scene)}>Export Scene</button>
          <button onClick={() => downloadJson("assets.json", assets)}>Export Assets</button>
        </header>
        <div className="canvas-wrap">
          <LiveSvgRenderer
            evaluated={runtime.evaluated}
            assets={assets}
            selectedId={selectedId}
            onSelect={setSelectedId}
            quality={runtime.state.previewQuality}
          />
          <div className="debug-overlay">
            <div><span>frame</span><strong>{frame} / {runtime.state.durationInFrames}</strong></div>
            <div><span>fps</span><strong>{runtime.state.fps.toFixed(0)} ({runtime.state.measuredFps.toFixed(1)})</strong></div>
            <div><span>objects</span><strong>{runtime.evaluatedObjectCount} / {runtime.objectCount}</strong></div>
            <div><span>mode</span><strong>live ({runtime.state.previewQuality})</strong></div>
            <div><span>eval</span><strong>{runtime.evaluationTimeMs.toFixed(2)} ms</strong></div>
          </div>
        </div>
        <footer className="timeline">
          <div className="transport">
            <button title="Go to start" onClick={runtime.goToStart}>{"|<"}</button>
            <button title="Previous frame" onClick={runtime.prevFrame}>{"<"}</button>
            <button className="primary" onClick={runtime.toggle}>{runtime.state.playing ? "Pause" : "Play"}</button>
            <button title="Stop" onClick={runtime.stop}>Stop</button>
            <button title="Next frame" onClick={runtime.nextFrame}>{">"}</button>
            <button title="Go to end" onClick={runtime.goToEnd}>{">|"}</button>
            <button
              title="Toggle loop"
              className={runtime.state.loop ? "active" : ""}
              onClick={() => runtime.setLoop(!runtime.state.loop)}
            >
              Loop
            </button>
            <label className="inline-field">
              speed
              <select
                value={String(runtime.state.speed)}
                onChange={(event) => runtime.setSpeed(Number(event.target.value))}
              >
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
              </select>
            </label>
            <label className="inline-field">
              quality
              <select
                value={runtime.state.previewQuality}
                onChange={(event) => runtime.setPreviewQuality(event.target.value as typeof runtime.state.previewQuality)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>
            <label className="inline-field">
              frame
              <input
                type="number"
                min={0}
                max={runtime.state.durationInFrames}
                value={frame}
                onChange={(event) => setFrame(Number(event.target.value))}
              />
            </label>
            <span className="time-display">
              {(frame / runtime.state.fps).toFixed(2)}s / {(runtime.state.durationInFrames / runtime.state.fps).toFixed(2)}s
            </span>
          </div>
          <input
            className="scrubber"
            type="range"
            min={0}
            max={runtime.state.durationInFrames}
            value={frame}
            onChange={(event) => setFrame(Number(event.target.value))}
          />
        </footer>
      </section>

      <aside className="inspector">
        <section>
          <h2>Inspector</h2>
          {selected ? (
            <>
              <label>Name<input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} /></label>
              {transformFields.map((field) => (
                <label key={field}>{field}<input type="number" step={field.includes("scale") || field === "opacity" ? 0.05 : 1} value={selected.transform[field]} onChange={(event) => updateTransform(field, Number(event.target.value))} /></label>
              ))}
              {Object.entries(selected.style).map(([key, value]) => typeof value === "string" || typeof value === "number" ? (
                <label key={key}>{key}<input value={String(value)} onChange={(event) => updateStyle(key, typeof value === "number" ? Number(event.target.value) : event.target.value)} /></label>
              ) : null)}
              <div className="keyframe-row">
                {transformFields.map((field) => <button key={field} onClick={() => addKeyframe(field)}>Key {field}</button>)}
              </div>
            </>
          ) : <p>Select an object to edit.</p>}
        </section>
        <section>
          <h2>AI Task</h2>
          <textarea value={taskPrompt} onChange={(event) => setTaskPrompt(event.target.value)} />
          <button onClick={createTask}>Create Agent Task JSON</button>
          {taskPreview ? <><pre>{taskPreview}</pre><button onClick={() => downloadJson(`${JSON.parse(taskPreview).id}.json`, JSON.parse(taskPreview))}>Download Task</button></> : null}
        </section>
      </aside>
    </main>
  );
};
