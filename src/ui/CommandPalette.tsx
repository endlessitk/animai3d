import React from "react";
import { useStudioState } from "../state/studioState";

/**
 * Command palette — Ctrl+P toggle.
 *
 * Sprint 7 lands the 3-mode parser (§10.4):
 *   `>` cmd · `?` agent NL · `/` search
 * Sprint 2 ships the modal shell + Esc-to-close wiring (handled in
 * useGlobalHotkeys).
 */
export const CommandPalette: React.FC = () => {
  const { state, setCommandPalette } = useStudioState();
  if (!state.commandPaletteOpen) return null;

  return (
    <div
      className="command-palette-backdrop"
      onClick={() => setCommandPalette(false)}
    >
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="command-palette__input"
          placeholder="> command   ? ask agent   / search"
        />
        <div className="command-palette__hint">
          Sprint 7 wires the parser. Prefix modes:{" "}
          <code>&gt;</code> command, <code>?</code> agent NL, <code>/</code> search.
        </div>
      </div>
    </div>
  );
};
