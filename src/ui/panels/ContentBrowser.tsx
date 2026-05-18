import React, { useState } from "react";

/**
 * §7 Content Browser — alt çekmece, 240px.
 *
 * Sprint 2 ships the tab strip + util bar + empty-state grid. Real asset
 * inventory + drag-into-viewport + agent-generated folder auto-organize
 * arrive in Sprint 5 alongside the validation panel.
 */

const TABS = [
  { id: "all", label: "All" },
  { id: "meshes", label: "Meshes" },
  { id: "materials", label: "Materials" },
  { id: "textures", label: "Textures" },
  { id: "animations", label: "Animations" },
  { id: "lights", label: "Lights" },
  { id: "cameras", label: "Cameras" },
  { id: "agent", label: "Agent-Generated" },
] as const;

type TabId = typeof TABS[number]["id"];

export const ContentBrowser: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("all");

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
        <input className="content-browser__search" placeholder="search…" />
        <button className="toolbar__button toolbar__icon-only" title="Filter">▾</button>
        <button className="toolbar__button toolbar__icon-only" title="Sort">↕</button>
        <button className="toolbar__button toolbar__icon-only" title="Grid view">⬚</button>
        <span className="content-browser__spacer" />
        <button className="toolbar__button" title="Import asset"><span className="glyph">+</span><span className="label">Import</span></button>
        <button className="toolbar__button is-agent" title="Show only agent-generated">
          <span className="glyph">●</span>
          <span className="label">agent</span>
        </button>
      </div>
      <div className="content-browser__grid">
        <div className="content-browser__empty">
          {activeTab === "all" ? "No assets imported. Drag files here or click Import." : `No ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} yet.`}
        </div>
      </div>
    </section>
  );
};
