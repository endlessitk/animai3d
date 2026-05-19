import React, { useMemo } from "react";
import { useStudioState } from "../../state/studioState";
import type { Scene3D } from "../../scene/schema";
import type { Severity, ValidationIssue } from "../../scene/validation";
import { countBySeverity, validateScene } from "../../scene/validation";

// ── Props ─────────────────────────────────────────────────────────────────────

export type ValidationPanelProps = {
  scene: Scene3D;
  onSceneChange: (description: string, updater: (s: Scene3D) => Scene3D) => void;
};

// ── Severity meta ────────────────────────────────────────────────────────────

const SEVERITY_META: Record<Severity, { glyph: string; label: string; modifier: string }> = {
  error: { glyph: "■", label: "Error", modifier: "error" },
  warning: { glyph: "▲", label: "Warning", modifier: "warning" },
  info: { glyph: "●", label: "Info", modifier: "info" },
};

const ORDER: Severity[] = ["error", "warning", "info"];

// ── Component ─────────────────────────────────────────────────────────────────

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ scene, onSceneChange }) => {
  const { state, toggleValidationDrawer, setSelected } = useStudioState();
  const issues = useMemo(() => validateScene(scene), [scene]);
  const counts = countBySeverity(issues);

  if (!state.validationDrawerOpen) return null;

  const handleFix = (issue: ValidationIssue) => {
    if (!issue.fix) return;
    const apply = issue.fix;
    onSceneChange(`[validation] fix ${issue.rule}`, apply);
  };

  const handleReveal = (issue: ValidationIssue) => {
    if (issue.objectId) setSelected(issue.objectId);
  };

  return (
    <aside className="validation-panel" aria-label="Scene validation">
      <header className="validation-panel__header">
        <span className="validation-panel__title">Scene Validation</span>
        <span className="validation-panel__counts">
          {ORDER.map((sev) =>
            counts[sev] > 0 ? (
              <span key={sev} className={`validation-chip is-${SEVERITY_META[sev].modifier}`}>
                {SEVERITY_META[sev].glyph} {counts[sev]}
              </span>
            ) : null,
          )}
          {issues.length === 0 && <span className="validation-chip is-ok">✓ All clean</span>}
        </span>
        <button
          type="button"
          className="panel-header__btn"
          onClick={toggleValidationDrawer}
          title="Close"
        >×</button>
      </header>

      <div className="validation-panel__body">
        {issues.length === 0 ? (
          <p className="validation-panel__empty">No issues found. Scene passes all static rules.</p>
        ) : (
          <ul className="validation-list">
            {ORDER.flatMap((sev) =>
              issues
                .filter((i) => i.severity === sev)
                .map((issue) => (
                  <li key={issue.id} className={`validation-row is-${SEVERITY_META[sev].modifier}`}>
                    <span className="validation-row__icon" aria-hidden>
                      {SEVERITY_META[sev].glyph}
                    </span>
                    <div className="validation-row__body">
                      <div className="validation-row__rule">{issue.rule}</div>
                      <div className="validation-row__msg">{issue.message}</div>
                    </div>
                    <div className="validation-row__actions">
                      {issue.objectId && (
                        <button
                          type="button"
                          className="validation-row__btn"
                          onClick={() => handleReveal(issue)}
                          title="Select in viewport"
                        >Reveal</button>
                      )}
                      {issue.fix && (
                        <button
                          type="button"
                          className="validation-row__btn validation-row__btn--fix"
                          onClick={() => handleFix(issue)}
                          title="Apply auto-fix"
                        >Fix</button>
                      )}
                    </div>
                  </li>
                )),
            )}
          </ul>
        )}
      </div>
    </aside>
  );
};
