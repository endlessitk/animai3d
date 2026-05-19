import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStudioState } from "../state/studioState";
import { useAgentSession } from "../agent/agentSession";
import { runMockAgent } from "../agent/mockAgent";
import { addNewObject } from "../scene/sceneUtils";
import type { AddObjectKind } from "../scene/sceneUtils";
import type { Scene3D } from "../scene/schema";
import { SHADING_OPTIONS } from "../state/studioState";

// ── Modes & item shape ───────────────────────────────────────────────────────

type Mode = "command" | "agent" | "search";

type PaletteItem = {
  id: string;
  label: string;
  hint?: string;
  kind: Mode;
  run: () => void;
};

// ── Props ─────────────────────────────────────────────────────────────────────

export type CommandPaletteProps = {
  scene: Scene3D;
  onSceneChange: (description: string, updater: (s: Scene3D) => Scene3D) => void;
  onUndo: () => void;
  onRedo: () => void;
  onPlayPause: () => void;
  onResetScene: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  scene,
  onSceneChange,
  onUndo,
  onRedo,
  onPlayPause,
  onResetScene,
}) => {
  const studio = useStudioState();
  const session = useAgentSession();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state every time palette opens
  useEffect(() => {
    if (studio.state.commandPaletteOpen) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [studio.state.commandPaletteOpen]);

  // Mode detection from query prefix
  const { mode, search } = useMemo(() => {
    if (query.startsWith(">")) return { mode: "command" as Mode, search: query.slice(1).trim() };
    if (query.startsWith("?")) return { mode: "agent" as Mode, search: query.slice(1).trim() };
    if (query.startsWith("/")) return { mode: "search" as Mode, search: query.slice(1).trim() };
    return { mode: "search" as Mode, search: query.trim() };
  }, [query]);

  const close = () => studio.setCommandPalette(false);

  // ── Item builders ──────────────────────────────────────────────────────────

  const commandItems: PaletteItem[] = useMemo(() => {
    const kinds: Array<{ kind: AddObjectKind; label: string }> = [
      { kind: "box", label: "Add Box" },
      { kind: "sphere", label: "Add Sphere" },
      { kind: "cylinder", label: "Add Cylinder" },
      { kind: "plane", label: "Add Plane" },
      { kind: "torus", label: "Add Torus" },
      { kind: "empty", label: "Add Empty" },
      { kind: "point-light", label: "Add Point Light" },
      { kind: "directional-light", label: "Add Directional Light" },
      { kind: "spot-light", label: "Add Spot Light" },
      { kind: "ambient-light", label: "Add Ambient Light" },
      { kind: "camera", label: "Add Camera" },
    ];

    const addItems: PaletteItem[] = kinds.map((k) => ({
      id: `add:${k.kind}`,
      label: k.label,
      hint: "Add",
      kind: "command",
      run: () => onSceneChange(`Add ${k.kind}`, (s) => addNewObject(s, k.kind)),
    }));

    const shadingItems: PaletteItem[] = SHADING_OPTIONS.map((opt) => ({
      id: `shade:${opt.id}`,
      label: `Shading: ${opt.label}`,
      hint: "View",
      kind: "command",
      run: () => studio.setShading(opt.id),
    }));

    return [
      ...addItems,
      ...shadingItems,
      { id: "cmd:play", label: "Play / Pause", hint: "Time", kind: "command", run: onPlayPause },
      { id: "cmd:undo", label: "Undo", hint: "Edit", kind: "command", run: onUndo },
      { id: "cmd:redo", label: "Redo", hint: "Edit", kind: "command", run: onRedo },
      { id: "cmd:reset-scene", label: "Reset Scene", hint: "Danger", kind: "command", run: onResetScene },
      { id: "cmd:agent-toggle", label: "Toggle Agent Workbench", hint: "Panel", kind: "command", run: studio.toggleAgentPanel },
      { id: "cmd:validation-toggle", label: "Toggle Validation Drawer", hint: "Panel", kind: "command", run: studio.toggleValidationDrawer },
      { id: "cmd:content-toggle", label: "Toggle Content Browser", hint: "Panel", kind: "command", run: studio.toggleContentBrowser },
      { id: "cmd:snap-magnet", label: "Toggle Snap Magnet", hint: "Viewport", kind: "command", run: studio.toggleSnapMagnet },
    ];
  }, [onPlayPause, onUndo, onRedo, onResetScene, onSceneChange, studio]);

  const searchItems: PaletteItem[] = useMemo(
    () =>
      scene.objects.map((obj) => ({
        id: `obj:${obj.id}`,
        label: obj.name,
        hint: obj.id,
        kind: "search",
        run: () => studio.setSelected(obj.id),
      })),
    [scene.objects, studio],
  );

  const fuzzy = (label: string, q: string): boolean => {
    if (!q) return true;
    const a = label.toLowerCase();
    const b = q.toLowerCase();
    let i = 0;
    for (const ch of b) {
      const idx = a.indexOf(ch, i);
      if (idx < 0) return false;
      i = idx + 1;
    }
    return true;
  };

  const items: PaletteItem[] = useMemo(() => {
    if (mode === "agent") {
      return search
        ? [{
            id: "agent:send",
            label: `Ask agent: "${search}"`,
            hint: "Press Enter to send",
            kind: "agent",
            run: () => {
              session.appendMessage("user", search);
              session.setBusy(true);
              studio.setAgentPanel(true);
              runMockAgent({
                prompt: search,
                scene,
                selectedId: studio.state.selectedId,
                appendToolCall: session.appendToolCall,
                updateToolCall: session.updateToolCall,
                appendAgentMessage: (text) => session.appendMessage("agent", text),
              })
                .then((diff) => diff && session.setPendingDiff(diff))
                .finally(() => session.setBusy(false));
            },
          }]
        : [];
    }
    const pool = mode === "command" ? commandItems : searchItems;
    return pool.filter((it) => fuzzy(it.label, search)).slice(0, 50);
  }, [mode, search, commandItems, searchItems, scene, session, studio]);

  // Clamp cursor when items change
  useEffect(() => {
    setCursor((c) => Math.max(0, Math.min(c, items.length - 1)));
  }, [items.length]);

  if (!studio.state.commandPaletteOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[cursor];
      if (item) {
        item.run();
        close();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    e.stopPropagation();
  };

  return (
    <div className="command-palette-backdrop" onClick={close}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette__mode-row">
          <span className={`command-palette__mode is-${mode}`}>{mode}</span>
          <input
            ref={inputRef}
            className="command-palette__input"
            placeholder="> command   ? ask agent   / search   (or type any name)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <ul className="command-palette__list">
          {items.length === 0 && (
            <li className="command-palette__empty">
              {mode === "agent" ? "Type a prompt then Enter." : `No matches for "${search}".`}
            </li>
          )}
          {items.map((it, i) => (
            <li
              key={it.id}
              className={`command-palette__item${i === cursor ? " is-cursor" : ""}`}
              onMouseEnter={() => setCursor(i)}
              onClick={() => { it.run(); close(); }}
            >
              <span className="command-palette__label">{it.label}</span>
              {it.hint && <span className="command-palette__hint">{it.hint}</span>}
            </li>
          ))}
        </ul>
        <div className="command-palette__footer">
          <span><kbd>↑↓</kbd> nav</span>
          <span><kbd>↵</kbd> run</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};
