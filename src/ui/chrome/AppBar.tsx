import React from "react";

export type AppBarProps = {
  projectName: string;
  onExport: () => void;
  onReset: () => void;
};

/** §3.1 App Chrome / Project Bar — 28px. */
export const AppBar: React.FC<AppBarProps> = ({ projectName, onExport, onReset }) => (
  <header className="appbar">
    <div className="appbar__title">
      <span className="appbar__brand-tag">AGENTIC</span>
      <strong>{projectName}</strong>
      <span className="appbar__meta">Sprint 2 · chrome layer</span>
    </div>
    <div className="appbar__actions">
      <button onClick={onExport}>Export Scene</button>
      <button onClick={onReset}>Reset</button>
    </div>
  </header>
);
