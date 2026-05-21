import React, { useEffect, useRef, useState } from "react";
import { useStudioState } from "../../state/studioState";
import type {
  AgentMetadataComponent,
  AnimationComponent,
  AnimationPath,
  AnimatableValue,
  CameraComponent,
  Component,
  ComponentType,
  GameObject,
  LightComponent,
  MaterialComponent,
  MeshComponent,
  Scene3D,
  TransformComponent,
  Vec3,
} from "../../scene/schema";
import {
  removeComponentAtIndex,
  removeKeyframe,
  setKeyframe,
  updateComponentAtIndex,
} from "../../scene/sceneUtils";

// ── Field primitives ──────────────────────────────────────────────────────────

type NumericFieldProps = {
  label?: string;
  value: number;
  step?: number;
  precision?: number;
  unit?: string;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

const NumericField: React.FC<NumericFieldProps> = ({
  label,
  value,
  step = 0.1,
  precision = 3,
  unit,
  min,
  max,
  onChange,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startVal: number; moved: boolean } | null>(null);

  const clamp = (v: number) => {
    let r = v;
    if (min !== undefined) r = Math.max(min, r);
    if (max !== undefined) r = Math.min(max, r);
    return r;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startVal: value, moved: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 3) {
      dragRef.current.moved = true;
      const multiplier = e.shiftKey ? 0.1 : 1;
      const next = clamp(
        parseFloat((dragRef.current.startVal + delta * step * multiplier).toFixed(precision)),
      );
      onChange(next);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { moved } = dragRef.current;
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (!moved) {
      setDraft(String(value));
      setEditing(true);
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
    }
  };

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n)) onChange(clamp(n));
    setEditing(false);
  };

  return (
    <div
      className={`num-field${editing ? " is-editing" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {label && (
        <span className={`num-field__axis num-field__axis--${label.toLowerCase()}`}>{label}</span>
      )}
      {editing ? (
        <input
          ref={inputRef}
          className="num-field__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="num-field__value">
          {value.toFixed(precision)}
          {unit && <span className="num-field__unit">{unit}</span>}
        </span>
      )}
    </div>
  );
};

type Vec3FieldProps = {
  value: Vec3;
  step?: number;
  precision?: number;
  unit?: string;
  onChange: (v: Vec3) => void;
};

const Vec3Field: React.FC<Vec3FieldProps> = ({ value, step, precision, unit, onChange }) => (
  <div className="vec3-field">
    <NumericField
      label="X"
      value={value[0]}
      step={step}
      precision={precision}
      unit={unit}
      onChange={(v) => onChange([v, value[1], value[2]])}
    />
    <NumericField
      label="Y"
      value={value[1]}
      step={step}
      precision={precision}
      unit={unit}
      onChange={(v) => onChange([value[0], v, value[2]])}
    />
    <NumericField
      label="Z"
      value={value[2]}
      step={step}
      precision={precision}
      unit={unit}
      onChange={(v) => onChange([value[0], value[1], v])}
    />
  </div>
);

type ColorHexFieldProps = { value: string; onChange: (v: string) => void };

const ColorHexField: React.FC<ColorHexFieldProps> = ({ value, onChange }) => {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  return (
    <div className="color-field">
      <label className="color-field__swatch" style={{ background: value }}>
        <input
          type="color"
          className="color-field__native"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <input
        type="text"
        className="color-field__hex"
        value={text}
        spellCheck={false}
        maxLength={7}
        onChange={(e) => {
          setText(e.target.value);
          if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value);
        }}
        onBlur={() => setText(value)}
      />
    </div>
  );
};

// ── Field-row layout helper ───────────────────────────────────────────────────

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="field-row">
    <span className="field-label">{label}</span>
    <div className="field-value">{children}</div>
  </div>
);

// ── Per-component body renderers ─────────────────────────────────────────────

const KeyframeButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    className="field-keyframe-btn"
    title="Record keyframe at current frame"
    onClick={onClick}
  >◆</button>
);

const TransformBody: React.FC<{
  comp: TransformComponent;
  onUpdate: (next: TransformComponent) => void;
  onKeyframe?: (path: AnimationPath, value: Vec3) => void;
}> = ({ comp, onUpdate, onKeyframe }) => (
  <div className="component-body">
    <FieldRow label="Position">
      <Vec3Field
        value={comp.transform.position}
        step={0.01}
        precision={3}
        onChange={(v) => onUpdate({ ...comp, transform: { ...comp.transform, position: v } })}
      />
      {onKeyframe && <KeyframeButton onClick={() => onKeyframe("transform.position", comp.transform.position)} />}
    </FieldRow>
    <FieldRow label="Rotation">
      <Vec3Field
        value={comp.transform.rotation}
        step={0.01}
        precision={3}
        unit="rad"
        onChange={(v) => onUpdate({ ...comp, transform: { ...comp.transform, rotation: v } })}
      />
      {onKeyframe && <KeyframeButton onClick={() => onKeyframe("transform.rotation", comp.transform.rotation)} />}
    </FieldRow>
    <FieldRow label="Scale">
      <Vec3Field
        value={comp.transform.scale}
        step={0.01}
        precision={3}
        onChange={(v) => onUpdate({ ...comp, transform: { ...comp.transform, scale: v } })}
      />
      {onKeyframe && <KeyframeButton onClick={() => onKeyframe("transform.scale", comp.transform.scale)} />}
    </FieldRow>
  </div>
);

const AnimationBody: React.FC<{
  comp: AnimationComponent;
  onRemoveKey: (path: AnimationPath, frame: number) => void;
}> = ({ comp, onRemoveKey }) => {
  const formatValue = (value: AnimatableValue): string =>
    Array.isArray(value) ? value.map((v) => v.toFixed(2)).join(", ") : String(value);

  if (comp.tracks.length === 0) {
    return (
      <div className="component-body">
        <p className="field-text">No tracks yet. Use ◆ on Transform to record keyframes.</p>
      </div>
    );
  }
  return (
    <div className="component-body anim-body">
      {comp.tracks.map((track) => {
        const path = track.path ?? (`transform.${track.property}` as AnimationPath);
        return (
        <div key={path} className="anim-track">
          <div className="anim-track__header">
            <span className="anim-track__name">{path}</span>
            <span className="anim-track__count">{track.keyframes.length} keys</span>
          </div>
          <div className="anim-track__keys">
            {track.keyframes.map((k) => (
              <button
                key={k.frame}
                type="button"
                className="anim-key"
                title={`Frame ${k.frame} · ${formatValue(k.value)} · click to delete`}
                onClick={() => onRemoveKey(path, k.frame)}
              >◆ f{k.frame}</button>
            ))}
          </div>
        </div>
      );})}
    </div>
  );
};

const MeshBody: React.FC<{ comp: MeshComponent }> = ({ comp }) => (
  <div className="component-body">
    <FieldRow label="Primitive">
      <span className="field-badge">{comp.primitive.kind}</span>
    </FieldRow>
    {"size" in comp.primitive && (
      <FieldRow label="Size">
        <Vec3Field
          value={comp.primitive.size}
          step={0.01}
          precision={3}
          onChange={() => undefined}
        />
      </FieldRow>
    )}
    {"radius" in comp.primitive && (
      <FieldRow label="Radius">
        <NumericField value={comp.primitive.radius} step={0.01} onChange={() => undefined} />
      </FieldRow>
    )}
    <FieldRow label="Cast Shadow">
      <input type="checkbox" defaultChecked={comp.castShadow ?? false} readOnly />
    </FieldRow>
  </div>
);

const MaterialBody: React.FC<{
  comp: MaterialComponent;
  onUpdate: (next: MaterialComponent) => void;
}> = ({ comp, onUpdate }) => {
  const mat = comp.material;
  return (
    <div className="component-body">
      <FieldRow label="Kind">
        <span className="field-badge">{mat.kind}</span>
      </FieldRow>
      <FieldRow label="Color">
        <ColorHexField
          value={mat.color}
          onChange={(color) =>
            onUpdate({ ...comp, material: { ...mat, color } as typeof mat })
          }
        />
      </FieldRow>
      {"metalness" in mat && (
        <FieldRow label="Metalness">
          <NumericField
            value={mat.metalness ?? 0}
            step={0.01}
            precision={2}
            min={0}
            max={1}
            onChange={(v) =>
              onUpdate({ ...comp, material: { ...mat, metalness: v } as typeof mat })
            }
          />
        </FieldRow>
      )}
      {"roughness" in mat && (
        <FieldRow label="Roughness">
          <NumericField
            value={mat.roughness ?? 0.5}
            step={0.01}
            precision={2}
            min={0}
            max={1}
            onChange={(v) =>
              onUpdate({ ...comp, material: { ...mat, roughness: v } as typeof mat })
            }
          />
        </FieldRow>
      )}
    </div>
  );
};

const LightBody: React.FC<{
  comp: LightComponent;
  onUpdate: (next: LightComponent) => void;
}> = ({ comp, onUpdate }) => (
  <div className="component-body">
    <FieldRow label="Kind">
      <span className="field-badge">{comp.kind}</span>
    </FieldRow>
    <FieldRow label="Color">
      <ColorHexField
        value={comp.color}
        onChange={(color) => onUpdate({ ...comp, color })}
      />
    </FieldRow>
    <FieldRow label="Intensity">
      <NumericField
        value={comp.intensity}
        step={0.05}
        precision={2}
        min={0}
        onChange={(v) => onUpdate({ ...comp, intensity: v })}
      />
    </FieldRow>
    {(comp.kind === "point" || comp.kind === "spot") && (
      <FieldRow label="Distance">
        <NumericField
          value={comp.distance ?? 0}
          step={0.5}
          precision={2}
          min={0}
          onChange={(v) => onUpdate({ ...comp, distance: v })}
        />
      </FieldRow>
    )}
    {comp.kind === "spot" && (
      <FieldRow label="Angle">
        <NumericField
          value={comp.angle ?? Math.PI / 4}
          step={0.01}
          precision={3}
          unit="rad"
          min={0}
          max={Math.PI / 2}
          onChange={(v) => onUpdate({ ...comp, angle: v })}
        />
      </FieldRow>
    )}
  </div>
);

const CameraBody: React.FC<{
  comp: CameraComponent;
  onUpdate: (next: CameraComponent) => void;
}> = ({ comp, onUpdate }) => (
  <div className="component-body">
    <FieldRow label="Kind">
      <span className="field-badge">{comp.kind}</span>
    </FieldRow>
    {comp.kind === "perspective" && (
      <FieldRow label="FOV">
        <NumericField
          value={comp.fov ?? 75}
          step={1}
          precision={1}
          unit="°"
          min={5}
          max={170}
          onChange={(v) => onUpdate({ ...comp, fov: v })}
        />
      </FieldRow>
    )}
    <FieldRow label="Near">
      <NumericField
        value={comp.near ?? 0.1}
        step={0.01}
        precision={3}
        min={0.001}
        onChange={(v) => onUpdate({ ...comp, near: v })}
      />
    </FieldRow>
    <FieldRow label="Far">
      <NumericField
        value={comp.far ?? 1000}
        step={10}
        precision={1}
        min={1}
        onChange={(v) => onUpdate({ ...comp, far: v })}
      />
    </FieldRow>
    <FieldRow label="Active">
      <input type="checkbox" defaultChecked={comp.active ?? false} readOnly />
    </FieldRow>
  </div>
);

const AgentMetaBody: React.FC<{ comp: AgentMetadataComponent }> = ({ comp }) => (
  <div className="component-body">
    <FieldRow label="Provider">
      <span className="field-text">{comp.createdBy?.providerId ?? "—"}</span>
    </FieldRow>
    <FieldRow label="Model">
      <span className="field-text">{comp.createdBy?.modelId ?? "—"}</span>
    </FieldRow>
    <FieldRow label="Created">
      <span className="field-text">{comp.createdBy?.createdAt ?? "—"}</span>
    </FieldRow>
    <FieldRow label="Reviewed">
      <span className="field-badge">{comp.reviewedByHuman ? "Yes" : "No"}</span>
    </FieldRow>
  </div>
);

// ── Component card metadata ───────────────────────────────────────────────────

const COMPONENT_ICON: Record<ComponentType, string> = {
  transform: "⊞",
  mesh: "▣",
  material: "▦",
  camera: "□",
  light: "✦",
  agentMetadata: "◐",
  tag: "▤",
  animation: "◆",
};

const COMPONENT_LABEL: Record<ComponentType, string> = {
  transform: "Transform",
  mesh: "Mesh",
  material: "Material",
  camera: "Camera",
  light: "Light",
  agentMetadata: "Agent Metadata",
  tag: "Tag",
  animation: "Animation",
};

// ── ComponentCard ─────────────────────────────────────────────────────────────

type ComponentCardProps = {
  component: Component;
  index: number;
  objectId: string;
  onUpdate: (next: Component) => void;
  onRemove: () => void;
  onKeyframe?: (path: AnimationPath, value: Vec3) => void;
  onRemoveKey?: (path: AnimationPath, frame: number) => void;
};

const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  index,
  objectId,
  onUpdate,
  onRemove,
  onKeyframe,
  onRemoveKey,
}) => {
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const isRequired = component.type === "transform";
  const isAgent = component.type === "agentMetadata";

  const cardClass = [
    "component-card",
    isRequired ? "is-required" : "",
    isAgent ? "is-agent" : "",
  ].filter(Boolean).join(" ");

  const renderBody = () => {
    switch (component.type) {
      case "transform":
        return (
          <TransformBody
            comp={component}
            onUpdate={(next) => onUpdate(next)}
            onKeyframe={onKeyframe}
          />
        );
      case "mesh":
        return <MeshBody comp={component} />;
      case "material":
        return (
          <MaterialBody
            comp={component}
            onUpdate={(next) => onUpdate(next)}
          />
        );
      case "light":
        return (
          <LightBody
            comp={component}
            onUpdate={(next) => onUpdate(next)}
          />
        );
      case "camera":
        return (
          <CameraBody
            comp={component}
            onUpdate={(next) => onUpdate(next)}
          />
        );
      case "agentMetadata":
        return <AgentMetaBody comp={component} />;
      case "tag":
        return (
          <div className="component-body">
            <FieldRow label="Labels">
              <span className="field-text">{component.labels.join(", ") || "—"}</span>
            </FieldRow>
          </div>
        );
      case "animation":
        return (
          <AnimationBody
            comp={component}
            onRemoveKey={(property, frame) => onRemoveKey?.(property, frame)}
          />
        );
    }
  };

  return (
    <article
      className={cardClass}
      aria-labelledby={`cc-${objectId}-${index}`}
    >
      <header className="component-card__header" onClick={() => setOpen((v) => !v)}>
        <span className="component-card__chevron" aria-hidden>{open ? "▾" : "▸"}</span>
        <span className="component-card__icon" aria-hidden>{COMPONENT_ICON[component.type]}</span>
        <span className="component-card__name" id={`cc-${objectId}-${index}`}>
          {COMPONENT_LABEL[component.type]}
        </span>
        <div className="component-card__actions" onClick={(e) => e.stopPropagation()}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="component-card__menu"
              title="Options"
              onClick={() => setMenuOpen((v) => !v)}
            >⋮</button>
            {menuOpen && (
              <div className="context-menu context-menu--card">
                <button
                  className="context-menu__item"
                  onClick={() => {
                    onUpdate({ ...component });
                    setMenuOpen(false);
                  }}
                >Reset</button>
                {!isRequired && (
                  <button
                    className="context-menu__item context-menu__item--danger"
                    onClick={() => { onRemove(); setMenuOpen(false); }}
                  >Remove</button>
                )}
              </div>
            )}
          </div>
          {!isRequired && (
            <button
              type="button"
              className="component-card__power is-on"
              title="Enable / disable"
            >⏻</button>
          )}
        </div>
      </header>
      {open && renderBody()}
    </article>
  );
};

// ── Inspector ─────────────────────────────────────────────────────────────────

const findSelected = (scene: Scene3D, id: string | null): GameObject | null =>
  id ? scene.objects.find((o) => o.id === id) ?? null : null;

export type InspectorProps = {
  scene: Scene3D;
  currentFrame: number;
  onSceneChange: (description: string, updater: (s: Scene3D) => Scene3D) => void;
  onAddComponentOpen: () => void;
};

export const Inspector: React.FC<InspectorProps> = ({
  scene,
  currentFrame,
  onSceneChange,
  onAddComponentOpen,
}) => {
  const { state } = useStudioState();
  const selected = findSelected(scene, state.selectedId);

  const handleUpdate = (index: number, next: Component) => {
    if (!selected) return;
    onSceneChange(
      `Edit ${COMPONENT_LABEL[next.type] ?? next.type}`,
      (s) => updateComponentAtIndex(s, selected.id, index, next),
    );
  };

  const handleRemove = (index: number, type: ComponentType) => {
    if (!selected) return;
    onSceneChange(
      `Remove ${COMPONENT_LABEL[type] ?? type}`,
      (s) => removeComponentAtIndex(s, selected.id, index),
    );
  };

  const handleKeyframe = (path: AnimationPath, value: Vec3) => {
    if (!selected) return;
    onSceneChange(
      `Keyframe ${path} @ f${currentFrame}`,
      (s) => setKeyframe(s, selected.id, path, currentFrame, value),
    );
  };

  const handleRemoveKey = (path: AnimationPath, frame: number) => {
    if (!selected) return;
    onSceneChange(
      `Remove key ${path} @ f${frame}`,
      (s) => removeKeyframe(s, selected.id, path, frame),
    );
  };

  return (
    <section className="inspector">
      <header className="panel-header">
        <span className="panel-header__title">Inspector</span>
        <div className="panel-header__actions">
          <button className="panel-header__btn" title="Settings">⚙</button>
        </div>
      </header>
      <div className="panel-body">
        {selected ? (
          <>
            <div className="inspector__header">
              <span className="inspector__name">{selected.name}</span>
              <span className="inspector__id">{selected.id}</span>
            </div>
            <div className="component-stack">
              {selected.components.map((comp, idx) => (
                <ComponentCard
                  key={`${comp.type}-${idx}`}
                  component={comp}
                  index={idx}
                  objectId={selected.id}
                  onUpdate={(next) => handleUpdate(idx, next)}
                  onRemove={() => handleRemove(idx, comp.type)}
                  onKeyframe={handleKeyframe}
                  onRemoveKey={handleRemoveKey}
                />
              ))}
            </div>
            <button
              type="button"
              className="inspector__add"
              onClick={onAddComponentOpen}
            >+ Add Component</button>
          </>
        ) : (
          <p className="inspector__empty">Select an object in the viewport or outliner.</p>
        )}
      </div>
    </section>
  );
};
