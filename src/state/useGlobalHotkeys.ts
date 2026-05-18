import { useEffect } from "react";
import type { ToolId, WorkspaceId } from "./studioState";
import { TOOLS, useStudioState } from "./studioState";

/**
 * Global hotkey listener — DESIGN_LANGUAGE §10.1.
 *
 * Sprint 2 scope:
 *   Ctrl+1..7         → workspace direct (Model/Animate/Rig/Material/Simulate/Render/Script)
 *   Ctrl+8            → Agent workspace (also triggers F12 panel via setWorkspace side-effect)
 *   F12               → toggle Agent Workbench panel
 *   Ctrl+P            → toggle command palette
 *   Q W E R T Y       → tool palette (viewport-focused; suppressed inside inputs)
 *   K                 → play/pause (forwarded via `onPlayPause`)
 *   Esc               → close palette / clear selection
 *
 * Sprint 4 will layer in viewport modal hotkeys (axis lock X/Y/Z, frame F, etc.)
 * and Sprint 5 will add timeline-focused keys (I/L/M/[/]).
 */

const WORKSPACE_HOTKEY: Record<string, WorkspaceId> = {
  "1": "model",
  "2": "animate",
  "3": "rig",
  "4": "material",
  "5": "simulate",
  "6": "render",
  "7": "script",
  "8": "agent",
};

const TOOL_HOTKEY: Record<string, ToolId> = TOOLS.reduce(
  (acc, t) => {
    acc[t.hotkey.toLowerCase()] = t.id;
    return acc;
  },
  {} as Record<string, ToolId>,
);

const isTextInput = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
};

export type GlobalHotkeyHandlers = {
  onPlayPause?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
};

export const useGlobalHotkeys = (handlers: GlobalHotkeyHandlers = {}) => {
  const studio = useStudioState();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd combos
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase();

        // Ctrl+Z → undo / Ctrl+Shift+Z → redo
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          handlers.onUndo?.();
          return;
        }
        if (key === "z" && event.shiftKey) {
          event.preventDefault();
          handlers.onRedo?.();
          return;
        }

        if (!event.shiftKey) {
          const ws = WORKSPACE_HOTKEY[event.key];
          if (ws) {
            event.preventDefault();
            studio.setWorkspace(ws);
            return;
          }
          if (key === "p") {
            event.preventDefault();
            studio.toggleCommandPalette();
            return;
          }
        }
      }

      // F12 → Agent Workbench
      if (event.key === "F12" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        studio.toggleAgentPanel();
        return;
      }

      // Esc → close transient overlays / clear selection
      if (event.key === "Escape") {
        if (studio.state.commandPaletteOpen) {
          studio.setCommandPalette(false);
          return;
        }
        if (studio.state.selectedId !== null) {
          studio.setSelected(null);
          return;
        }
      }

      // K → play/pause always (DESIGN_LANGUAGE §10.1 — focus-independent)
      if (event.key.toLowerCase() === "k" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (handlers.onPlayPause) {
          event.preventDefault();
          handlers.onPlayPause();
          return;
        }
      }

      // Tool palette — suppress inside inputs and modifier combos
      if (isTextInput(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const tool = TOOL_HOTKEY[event.key.toLowerCase()];
      if (tool) {
        event.preventDefault();
        studio.setTool(tool);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [studio, handlers]);
};
