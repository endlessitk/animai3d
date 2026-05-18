import React from "react";
import {
  MODE_OPTIONS,
  PIVOT_OPTIONS,
  SHADING_OPTIONS,
  SNAP_OPTIONS,
  TRANSFORM_REFERENCE_OPTIONS,
  useStudioState,
  type Mode,
  type PivotMode,
  type ShadingMode,
  type SnapMode,
  type TransformReference,
} from "../../state/studioState";

/**
 * §3.4 Sub-toolbar — 30px Mode + Transform Reference + Pivot + Snap + Shading.
 *
 * Spec requirement: **TR and Pivot are ALWAYS separate dropdowns** (Modo
 * Action Center DNA). Never merge them.
 *
 * Sprint 2 uses native <select> as a placeholder for the dropdowns; Sprint 7
 * swaps in a custom popover that supports keyboard nav, fuzzy filter, and
 * `,` / `.` / `Shift+,` cycling per §3.4.
 */

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  onChange: (id: T) => void;
  title?: string;
};

const SelectField = <T extends string>({ label, value, options, onChange, title }: SelectFieldProps<T>) => {
  const current = options.find((o) => o.id === value);
  return (
    <label className="subtoolbar__dropdown" title={title}>
      <span className="label">{label}:</span>
      <span className="value">{current?.label ?? value}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          cursor: "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
};

export const SubToolbar: React.FC = () => {
  const {
    state,
    setMode,
    setTransformReference,
    setPivot,
    setSnap,
    toggleSnapMagnet,
    setShading,
  } = useStudioState();

  const isAgentMode = state.mode === "agent";

  return (
    <div className={`subtoolbar ${isAgentMode ? "is-agent-mode" : ""}`}>
      <SelectField<Mode>
        label="Mode"
        value={state.mode}
        options={MODE_OPTIONS}
        onChange={setMode}
        title="Tab Object↔Edit · 1..5 direct"
      />
      <span className="subtoolbar__divider" />

      <SelectField<TransformReference>
        label="Transform"
        value={state.transformReference}
        options={TRANSFORM_REFERENCE_OPTIONS}
        onChange={setTransformReference}
        title="Gizmo orientation · , / . to cycle"
      />
      <SelectField<PivotMode>
        label="Pivot"
        value={state.pivot}
        options={PIVOT_OPTIONS}
        onChange={setPivot}
        title="Gizmo position · Shift+, to cycle"
      />
      <span className="subtoolbar__divider" />

      <SelectField<SnapMode>
        label="Snap"
        value={state.snap}
        options={SNAP_OPTIONS}
        onChange={setSnap}
        title="Shift+S to cycle"
      />
      <button
        type="button"
        className={`subtoolbar__magnet ${state.snapMagnet ? "is-active" : ""}`}
        title="Magnet on/off (X)"
        onClick={toggleSnapMagnet}
      >⚡</button>

      <span className="subtoolbar__divider" />

      <SelectField<ShadingMode>
        label="Shade"
        value={state.shading}
        options={SHADING_OPTIONS}
        onChange={setShading}
        title="Z to cycle · Alt+Z X-ray"
      />
    </div>
  );
};
