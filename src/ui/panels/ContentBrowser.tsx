import React, { useMemo, useState } from "react";
import { useStudioState } from "../../state/studioState";
import type { GameObject, MaterialDef, Scene3D } from "../../scene/schema";
import { findComponent } from "../../scene/schema";

/**
 * §7 Content Browser — alt çekmece, 240px.
 *
 * MVP populates from live scene introspection (no asset library yet).
 * Each card maps back to its source GameObject so clicking selects it.
 * Sprint 11+ adds: external imports (GLTF/HDRI), drag-into-viewport,
 * thumbnail offscreen-renders, persisted asset folders.
 */

const TABS = [
  { id: "all", label: "All" },
  { id: "meshes", label: "Meshes" },
  { id: "materials", label: "Materials" },
  { id: "lights", label: "Lights" },
  { id: "cameras", label: "Cameras" },
  { id: "animations", label: "Animations" },
  { id: "agent", label: "Agent-Generated" },
] as const;

type TabId = typeof TABS[number]["id"];

type Card = {
  id: string;
  kind: "mesh" | "material" | "light" | "camera" | "animation";
  label: string;
  detail: string;
  objectId: string;
  swatch?: string;
  isAgent: boolean;
};

const matLabel = (mat: MaterialDef): string =>
  mat.kind === "standard"
    ? `Standard · ${mat.color}`
    : mat.kind === "basic"
      ? `Basic · ${mat.color}`
      : `Physical · ${mat.color}`;

const extractCards = (scene: Scene3D): Card[] => {
  const cards: Card[] = [];
  for (const obj of scene.objects) {
    const isAgent = !!findComponent(obj, "agentMetadata");
    const mesh = findComponent(obj, "mesh");
    const mat = findComponent(obj, "material");
    const light = findComponent(obj, "light");
    const cam = findComponent(obj, "camera");
    const anim = findComponent(obj, "animation");

    if (mesh) {
      cards.push({
        id: `mesh:${obj.id}`,
        kind: "mesh",
        label: obj.name,
        detail: mesh.primitive.kind,
        objectId: obj.id,
        isAgent,
      });
    }
    if (mat) {
      cards.push({
        id: `material:${obj.id}`,
        kind: "material",
        label: `${obj.name} mat`,
        detail: matLabel(mat.material),
        objectId: obj.id,
        swatch: mat.material.color,
        isAgent,
      });
    }
    if (light) {
      cards.push({
        id: `light:${obj.id}`,
        kind: "light",
        label: obj.name,
        detail: `${light.kind} · ${light.intensity.toFixed(2)}`,
        objectId: obj.id,
        swatch: light.color,
        isAgent,
      });
    }
    if (cam) {
      cards.push({
        id: `camera:${obj.id}`,
        kind: "camera",
        label: obj.name,
        detail: `${cam.kind}${cam.active ? " · active" : ""}`,
        objectId: obj.id,
        isAgent,
      });
    }
    if (anim && anim.tracks.length > 0) {
      const totalKeys = anim.tracks.reduce((sum, t) => sum + t.keyframes.length, 0);
      cards.push({
        id: `animation:${obj.id}`,
        kind: "animation",
        label: `${obj.name} clip`,
        detail: `${anim.tracks.length} track(s) · ${totalKeys} keys`,
        objectId: obj.id,
        isAgent,
      });
    }
  }
  return cards;
};

const tabFilter = (tab: TabId, agentOnly: boolean) => (c: Card): boolean => {
  if (agentOnly && !c.isAgent) return false;
  if (tab === "all") return true;
  if (tab === "agent") return c.isAgent;
  if (tab === "meshes") return c.kind === "mesh";
  if (tab === "materials") return c.kind === "material";
  if (tab === "lights") return c.kind === "light";
  if (tab === "cameras") return c.kind === "camera";
  if (tab === "animations") return c.kind === "animation";
  return true;
};

export type ContentBrowserProps = {
  scene: Scene3D;
};

export const ContentBrowser: React.FC<ContentBrowserProps> = ({ scene }) => {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");
  const [agentOnly, setAgentOnly] = useState(false);
  const { setSelected } = useStudioState();

  const cards = useMemo(() => extractCards(scene), [scene]);
  const q = query.toLowerCase().trim();
  const visible = cards
    .filter(tabFilter(activeTab, agentOnly))
    .filter((c) => !q || c.label.toLowerCase().includes(q) || c.detail.toLowerCase().includes(q));

  return (
    <section className="content-browser" aria-label="Content browser">
      <div className="content-browser__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`content-browser__tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >{tab.label}</button>
        ))}
      </div>
      <div className="content-browser__util">
        <input
          className="content-browser__search"
          placeholder="search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="content-browser__spacer" />
        <button
          className={`toolbar__button is-agent ${agentOnly ? "is-active" : ""}`}
          title="Show only agent-generated"
          onClick={() => setAgentOnly((v) => !v)}
        >
          <span className="glyph">●</span>
          <span className="label">agent</span>
        </button>
      </div>
      <div className="content-browser__grid">
        {visible.length === 0 ? (
          <div className="content-browser__empty">
            {q ? `No assets match "${query}".` : `No ${activeTab === "all" ? "assets" : activeTab} in scene yet.`}
          </div>
        ) : (
          visible.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`asset-card asset-card--${card.kind}${card.isAgent ? " is-agent" : ""}`}
              onClick={() => setSelected(card.objectId)}
              title={`${card.label} · ${card.detail}`}
            >
              <div className="asset-card__thumb" style={card.swatch ? { background: card.swatch } : undefined}>
                {!card.swatch && <span>{ICON[card.kind]}</span>}
              </div>
              <div className="asset-card__label">{card.label}</div>
              <div className="asset-card__detail">{card.detail}</div>
            </button>
          ))
        )}
      </div>
    </section>
  );
};

const ICON: Record<Card["kind"], string> = {
  mesh: "▣",
  material: "▦",
  light: "✦",
  camera: "📷",
  animation: "◆",
};
