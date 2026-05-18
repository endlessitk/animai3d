import React from "react";

export type AppBarProps = {
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onReset: () => void;
};

/** §3.1 App Chrome / Project Bar — 28px. */
export const AppBar: React.FC<AppBarProps> = ({
  projectName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onReset,
}) => (
  <header className="appbar">
    <div className="appbar__title">
      <span className="appbar__brand-tag">AGENTIC</span>
      <strong>{projectName}</strong>
      <span className="appbar__meta">Sprint 4 · gizmos + undo</span>
    </div>
    <div className="appbar__actions">
      <button
        className="appbar__icon-btn"
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        onClick={onUndo}
      >↶</button>
      <button
        className="appbar__icon-btn"
        title="Redo (Ctrl+Shift+Z)"
        disabled={!canRedo}
        onClick={onRedo}
      >↷</button>
      <button onClick={onExport}>Export Scene</button>
      <button onClick={onReset}>Reset</button>
    </div>
  </header>
);
