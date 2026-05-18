import React from "react";
import { TOOLS, useStudioState, type ToolId } from "../../state/studioState";

/**
 * §3.5 Sol tool palette — 48px. 3 grup: selection+transform / creation / agent.
 *
 * Sprint 2 ships group 1 (full WERS) + agent slot. Creation group (Pen, Text,
 * Add Primitive flyout, Camera, Light, Measure) lands in Sprint 4 alongside
 * the gizmo wiring.
 */

const GROUP_1: ToolId[] = ["select", "move", "rotate", "scale", "universal", "lastUsed"];

export const ToolPalette: React.FC = () => {
  const { state, setTool } = useStudioState();

  return (
    <aside className="tool-palette" aria-label="Tool palette">
      <div className="tool-palette__group">
        {GROUP_1.map((id) => {
          const tool = TOOLS.find((t) => t.id === id);
          if (!tool) return null;
          const isActive = state.tool === id;
          return (
            <button
              key={id}
              type="button"
              className={`tool-palette__button ${isActive ? "is-active" : ""}`}
              title={`${tool.label} (${tool.hotkey})`}
              onClick={() => setTool(id)}
            >
              <span aria-hidden>{tool.glyph}</span>
              <span className="hotkey">{tool.hotkey}</span>
            </button>
          );
        })}
      </div>

      <span className="tool-palette__divider" />

      {/* Creation group placeholder — Sprint 4 wires the flyouts */}
      <div className="tool-palette__group">
        <button className="tool-palette__button" title="Pen (V2)" disabled>✎</button>
        <button className="tool-palette__button" title="Text (V2)" disabled>T</button>
        <button className="tool-palette__button" title="Add Primitive (Sprint 4)" disabled>+</button>
      </div>

      <span className="tool-palette__divider" />

      {/* Agent group */}
      <div className="tool-palette__group">
        <button
          type="button"
          className={`tool-palette__button is-agent ${state.tool === "agent" ? "is-active" : ""}`}
          title="Agent Tool (5)"
          onClick={() => setTool("agent")}
        >
          <span aria-hidden>◐</span>
          <span className="hotkey">5</span>
        </button>
      </div>
    </aside>
  );
};
