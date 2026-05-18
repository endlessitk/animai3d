import React from "react";
import { useStudioState, type WorkspaceId } from "../../state/studioState";

/**
 * §3.3 Top toolbar — 36px. 3 segments:
 *   sol global | orta contextual | sağ utility
 *
 * Sprint 2 wires button-level state (hover/active styling, agent halo when
 * Agent Workbench is open). Actions like Undo/Save/Import live as visual
 * stubs — behavior arrives in Sprint 5 (transactions) and Sprint 6 (Agent).
 */
const CONTEXTUAL_ICONS: Record<WorkspaceId, Array<{ glyph: string; label: string }>> = {
  model: [
    { glyph: "+", label: "Add primitive" },
    { glyph: "✦", label: "Subdivide" },
  ],
  animate: [
    { glyph: "◆", label: "Set keyframe" },
    { glyph: "◇", label: "Breakdown" },
    { glyph: "●", label: "Auto-key" },
    { glyph: "↝", label: "Motion path" },
    { glyph: "▤", label: "Bake" },
  ],
  rig: [
    { glyph: "⚭", label: "Add bone" },
    { glyph: "⟷", label: "Add IK" },
    { glyph: "⚙", label: "Constraint" },
  ],
  material: [
    { glyph: "◉", label: "New material" },
    { glyph: "▣", label: "Assign" },
    { glyph: "⬚", label: "Pick" },
  ],
  simulate: [
    { glyph: "✱", label: "Add body" },
    { glyph: "▤", label: "Cache" },
    { glyph: "↻", label: "Reset" },
  ],
  render: [
    { glyph: "▥", label: "Render still" },
    { glyph: "▶", label: "Render animation" },
  ],
  script: [
    { glyph: "▶", label: "Run" },
    { glyph: "↻", label: "Reload" },
    { glyph: "{ }", label: "Format" },
  ],
  agent: [
    { glyph: "+", label: "New chat" },
    { glyph: "⊕", label: "Insert context" },
    { glyph: "◐", label: "Mode" },
  ],
};

export const Toolbar: React.FC = () => {
  const { state, toggleAgentPanel, toggleCommandPalette } = useStudioState();
  const contextual = CONTEXTUAL_ICONS[state.workspace] ?? [];

  return (
    <div className="toolbar">
      {/* sol global */}
      <div className="toolbar__segment">
        <button className="toolbar__button toolbar__icon-only" title="Undo (Ctrl+Z)">↶</button>
        <button className="toolbar__button toolbar__icon-only" title="Redo (Ctrl+Shift+Z)">↷</button>
      </div>
      <span className="toolbar__divider" />
      <div className="toolbar__segment">
        <button className="toolbar__button toolbar__icon-only" title="Open (Ctrl+O)">▤</button>
        <button className="toolbar__button toolbar__icon-only" title="Save (Ctrl+S)">▼</button>
        <button className="toolbar__button toolbar__icon-only" title="Import">⤴</button>
        <button className="toolbar__button toolbar__icon-only" title="Export">⤵</button>
      </div>
      <span className="toolbar__divider" />

      {/* orta contextual */}
      <div className="toolbar__segment">
        {contextual.map((item) => (
          <button
            key={item.label}
            className="toolbar__button"
            title={item.label}
          >
            <span className="glyph">{item.glyph}</span>
            <span className="label">{item.label}</span>
          </button>
        ))}
      </div>

      <span className="toolbar__spacer" />

      {/* sağ utility */}
      <div className="toolbar__segment">
        <button
          className="toolbar__button toolbar__icon-only"
          title="Search"
        >🔍</button>
        <button
          className="toolbar__button toolbar__icon-only"
          title="Command palette (Ctrl+P)"
          onClick={toggleCommandPalette}
        >⌘</button>
        <button
          className={`toolbar__button toolbar__icon-only toolbar__agent-toggle ${state.agentPanelOpen ? "is-active" : ""}`}
          title="Agent Workbench (F12)"
          onClick={toggleAgentPanel}
        >◐</button>
        <button className="toolbar__button toolbar__icon-only" title="Preferences">⚙</button>
      </div>
    </div>
  );
};
