import React from "react";
import { useStudioState } from "../../state/studioState";
import type { ComponentType, GameObject, Scene3D } from "../../scene/schema";
import { findComponent } from "../../scene/schema";

/**
 * §5.1-5.5 Outliner.
 *
 * Sprint 2 ships the row layout + inline tag strip (C4D pattern) + visibility
 * /lock toggle slots + agent metadata cue. Full keyboard nav (↑↓ ←→ Enter F2
 * Delete Space), drag-reorder, parenting, fuzzy search, and context menu
 * arrive in Sprint 3.
 */

type IconHint = { glyph: string; label: string };

const TYPE_ICON_HINT: Partial<Record<ComponentType, IconHint>> = {
  camera: { glyph: "📷", label: "Camera" },
  light: { glyph: "💡", label: "Light" },
  mesh: { glyph: "▣", label: "Mesh" },
};

const resolveTypeIcon = (obj: GameObject): IconHint => {
  if (findComponent(obj, "camera")) return TYPE_ICON_HINT.camera!;
  if (findComponent(obj, "light")) return TYPE_ICON_HINT.light!;
  if (findComponent(obj, "mesh")) return TYPE_ICON_HINT.mesh!;
  return { glyph: "○", label: "Empty" };
};

type TagSpec = { id: string; glyph: string; modifier: string; label: string };

const collectTags = (obj: GameObject): TagSpec[] => {
  const tags: TagSpec[] = [];
  const agent = findComponent(obj, "agentMetadata");
  if (agent) tags.push({ id: "agent", glyph: "●", modifier: "is-agent", label: "Agent-touched" });
  if (findComponent(obj, "material")) tags.push({ id: "material", glyph: "▦", modifier: "is-material", label: "Material" });
  if (findComponent(obj, "light")) tags.push({ id: "light", glyph: "✦", modifier: "is-light", label: "Light" });
  if (findComponent(obj, "camera")) tags.push({ id: "camera", glyph: "□", modifier: "is-camera", label: "Camera" });
  const tagComp = findComponent(obj, "tag");
  if (tagComp && tagComp.labels.length > 0) {
    tags.push({ id: "note", glyph: "▤", modifier: "", label: tagComp.labels.join(", ") });
  }
  return tags;
};

export type OutlinerProps = {
  scene: Scene3D;
};

export const Outliner: React.FC<OutlinerProps> = ({ scene }) => {
  const { state, setSelected } = useStudioState();

  return (
    <section className="outliner">
      <header className="panel-header">
        <span className="panel-header__title">Outliner</span>
        <div className="panel-header__actions">
          <button className="panel-header__btn" title="Search">🔍</button>
          <button className="panel-header__btn" title="Filter">▾</button>
          <button className="panel-header__btn" title="Add object">+</button>
        </div>
      </header>
      <div className="panel-body">
        <ul className="outliner__list">
          {scene.objects.map((object) => {
            const icon = resolveTypeIcon(object);
            const tags = collectTags(object);
            const visibleTags = tags.slice(0, 4);
            const hasAgent = !!findComponent(object, "agentMetadata");
            return (
              <li
                key={object.id}
                className={`outliner__row ${state.selectedId === object.id ? "is-selected" : ""} ${hasAgent ? "is-agent" : ""}`}
                onClick={() => setSelected(object.id)}
                title={`${object.name} · ${icon.label}`}
              >
                <span className="outliner__icon" aria-hidden>{icon.glyph}</span>
                <span className="outliner__name">{object.name}</span>
                <span className="outliner__tags">
                  {visibleTags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`outliner__tag ${tag.modifier}`}
                      title={tag.label}
                    >{tag.glyph}</span>
                  ))}
                </span>
                <span className="outliner__visibility">
                  <button
                    type="button"
                    className={`outliner__vis-btn ${object.visible ? "is-on" : ""}`}
                    title="Toggle visibility (Space)"
                    onClick={(event) => event.stopPropagation()}
                  >👁</button>
                  <button
                    type="button"
                    className={`outliner__vis-btn ${object.locked ? "is-locked" : ""}`}
                    title="Toggle lock (Ctrl+L)"
                    onClick={(event) => event.stopPropagation()}
                  >🔒</button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
