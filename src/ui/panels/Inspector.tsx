import React, { useState } from "react";
import { useStudioState } from "../../state/studioState";
import type { Component, ComponentType, GameObject, Scene3D } from "../../scene/schema";

/**
 * §5.6-5.11 Inspector — Component Stack (Unity DNA).
 *
 * Sprint 2 ships the visual component card layout per §5.7 (chevron / icon /
 * name / 3-dot menu / power toggle / agent stripe) with collapsible bodies
 * showing JSON-formatted component payloads. Field-level editors (numeric
 * scrub, Vector3 stacked compact, expression mode, multi-edit mixed state)
 * are Sprint 3.
 *
 * TransformComponent is rendered with the power toggle hidden per spec
 * ("Remove/disable yok; sadece Reset/Copy/Paste").
 */

const COMPONENT_ICON: Record<ComponentType, string> = {
  transform: "⊞",
  mesh: "▣",
  material: "▦",
  camera: "□",
  light: "✦",
  agentMetadata: "◐",
  tag: "▤",
};

const COMPONENT_LABEL: Record<ComponentType, string> = {
  transform: "Transform",
  mesh: "Mesh",
  material: "Material",
  camera: "Camera",
  light: "Light",
  agentMetadata: "AgentMetadata",
  tag: "Tag",
};

const isAgentComponent = (component: Component): boolean => component.type === "agentMetadata";

type ComponentCardProps = {
  component: Component;
  index: number;
  selectedId: string;
};

const ComponentCard: React.FC<ComponentCardProps> = ({ component, index, selectedId }) => {
  const [open, setOpen] = useState(true);
  const isRequired = component.type === "transform";
  const cardClass = [
    "component-card",
    isRequired ? "is-required" : "",
    isAgentComponent(component) ? "is-agent" : "",
  ].filter(Boolean).join(" ");

  return (
    <article className={cardClass} aria-labelledby={`${selectedId}-${component.type}-${index}`}>
      <header className="component-card__header" onClick={() => setOpen((v) => !v)}>
        <span className="component-card__chevron" aria-hidden>{open ? "▾" : "▸"}</span>
        <span className="component-card__icon" aria-hidden>{COMPONENT_ICON[component.type]}</span>
        <span className="component-card__name" id={`${selectedId}-${component.type}-${index}`}>
          {COMPONENT_LABEL[component.type]}
        </span>
        <button
          type="button"
          className="component-card__menu"
          title="Reset / Copy / Paste / Remove · Move up / down"
          onClick={(event) => event.stopPropagation()}
        >⋮</button>
        <button
          type="button"
          className="component-card__power is-on"
          title={isRequired ? "Required component" : "Enable / disable"}
          onClick={(event) => event.stopPropagation()}
        >⏻</button>
      </header>
      {open && (
        <pre className="component-card__body">{JSON.stringify(component, null, 2)}</pre>
      )}
    </article>
  );
};

export type InspectorProps = {
  scene: Scene3D;
};

const findSelected = (scene: Scene3D, id: string | null): GameObject | null =>
  id ? scene.objects.find((o) => o.id === id) ?? null : null;

export const Inspector: React.FC<InspectorProps> = ({ scene }) => {
  const { state } = useStudioState();
  const selected = findSelected(scene, state.selectedId);

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
              <div className="inspector__name">{selected.name}</div>
              <div className="inspector__id">{selected.id}</div>
            </div>
            <div className="component-stack">
              {selected.components.map((component, index) => (
                <ComponentCard
                  key={`${component.type}-${index}`}
                  component={component}
                  index={index}
                  selectedId={selected.id}
                />
              ))}
            </div>
            <button type="button" className="inspector__add" title="Add Component (Sprint 3)">
              + Add Component
            </button>
          </>
        ) : (
          <p className="inspector__empty">Select an object in the viewport or outliner.</p>
        )}
      </div>
    </section>
  );
};
