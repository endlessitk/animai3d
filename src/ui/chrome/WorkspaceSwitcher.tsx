import React from "react";
import { useStudioState, WORKSPACES } from "../../state/studioState";

/**
 * §3.2 Workspace Switcher — 30px, sol-aligned text tabs.
 *
 * Sprint 2 renders all 8 presets + an Agent gap separator (extra 16px before
 * the Agent tab per spec). Hotkey hint shows `Ctrl+N` in the tooltip; the
 * actual key wiring lives in `useGlobalHotkeys`.
 */
export const WorkspaceSwitcher: React.FC = () => {
  const { state, setWorkspace } = useStudioState();

  return (
    <nav className="workspace-switcher">
      {WORKSPACES.map((preset, index) => {
        const isAgent = preset.id === "agent";
        const isActive = state.workspace === preset.id;
        const hotkey = index < 8 ? `Ctrl+${index + 1}` : undefined;
        return (
          <React.Fragment key={preset.id}>
            {isAgent && <span className="workspace-gap" aria-hidden />}
            <button
              type="button"
              className={`workspace-tab ${isActive ? "is-active" : ""} ${isAgent ? "is-agent" : ""}`}
              onClick={() => setWorkspace(preset.id)}
              title={hotkey ? `${preset.label} (${hotkey})` : preset.label}
            >
              {preset.label}
            </button>
          </React.Fragment>
        );
      })}
      <span className="workspace-spacer" />
      <span className="workspace-meta">+ ⋯ ⚙</span>
    </nav>
  );
};
