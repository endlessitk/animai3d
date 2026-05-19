import React, { useEffect } from "react";

// ── Hotkey catalog ────────────────────────────────────────────────────────────

type HotkeyRow = { keys: string; label: string };
type Category = { title: string; rows: HotkeyRow[] };

const CATALOG: Category[] = [
  {
    title: "Workspaces",
    rows: [
      { keys: "Ctrl+1…7", label: "Model / Animate / Rig / Material / Simulate / Render / Script" },
      { keys: "Ctrl+8", label: "Agent workspace (auto-opens panel)" },
    ],
  },
  {
    title: "Tools",
    rows: [
      { keys: "Q", label: "Select" },
      { keys: "W", label: "Move (translate gizmo)" },
      { keys: "E", label: "Rotate gizmo" },
      { keys: "R", label: "Scale gizmo" },
      { keys: "T", label: "Universal gizmo" },
      { keys: "Y", label: "Last used tool" },
    ],
  },
  {
    title: "Viewport",
    rows: [
      { keys: "Z", label: "Cycle shading mode" },
      { keys: "X", label: "Toggle snap magnet" },
      { keys: ", / .", label: "Cycle Transform Reference (world/local/…)" },
      { keys: "Shift+A", label: "Add Object menu" },
    ],
  },
  {
    title: "Time",
    rows: [
      { keys: "K", label: "Play / Pause" },
      { keys: "drag ruler", label: "Scrub playhead" },
      { keys: "Inspector ◆", label: "Record keyframe at current frame" },
    ],
  },
  {
    title: "Selection / Outliner",
    rows: [
      { keys: "Click", label: "Select object (viewport or outliner)" },
      { keys: "Ctrl+Click", label: "Add / remove from multi-select" },
      { keys: "↑ / ↓", label: "Walk Outliner (also selects)" },
      { keys: "→ / ←", label: "Expand / collapse tree node" },
      { keys: "F2 or Enter", label: "Rename selected object" },
      { keys: "Del / Backspace", label: "Delete (preserves remaining multi-select)" },
      { keys: "P / Alt+P", label: "Parent to active / Unparent" },
      { keys: "Space", label: "Toggle visibility" },
    ],
  },
  {
    title: "Edit / Undo",
    rows: [
      { keys: "Ctrl+Z", label: "Undo" },
      { keys: "Ctrl+Shift+Z", label: "Redo" },
    ],
  },
  {
    title: "Agent + Panels",
    rows: [
      { keys: "F12", label: "Toggle Agent Workbench" },
      { keys: "Ctrl+P", label: "Open Command Palette" },
      { keys: "? (Shift+/)", label: "This help overlay" },
      { keys: "Esc", label: "Close palette / clear selection" },
    ],
  },
  {
    title: "Command Palette modes",
    rows: [
      { keys: "> …", label: "Command mode (Add Box, Reset Scene, …)" },
      { keys: "? …", label: "Ask the agent in NL" },
      { keys: "/ …  or plain", label: "Fuzzy search scene objects" },
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export type HelpOverlayProps = {
  open: boolean;
  onClose: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="help-overlay" role="dialog" aria-label="Keyboard shortcuts" onClick={onClose}>
      <div className="help-overlay__card" onClick={(e) => e.stopPropagation()}>
        <header className="help-overlay__header">
          <span className="help-overlay__title">Keyboard shortcuts</span>
          <button type="button" className="panel-header__btn" onClick={onClose} title="Close (Esc)">×</button>
        </header>
        <div className="help-overlay__grid">
          {CATALOG.map((cat) => (
            <section key={cat.title} className="help-overlay__cat">
              <h3 className="help-overlay__cat-title">{cat.title}</h3>
              <dl className="help-overlay__rows">
                {cat.rows.map((row, i) => (
                  <React.Fragment key={i}>
                    <dt><kbd>{row.keys}</kbd></dt>
                    <dd>{row.label}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
