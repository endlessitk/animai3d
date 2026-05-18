import React, { createContext, useContext, useMemo, useReducer } from "react";

/**
 * Studio-wide UI state — Sprint 2 chrome shell.
 *
 * Stays intentionally lightweight (no external store); each Sprint 2 chrome
 * zone subscribes via `useStudioState()`. Sprint 3 will split scene state
 * (objects, selection, transactions) into its own store; for now the only
 * scene-touching field is `selectedId`, kept here to avoid prop drilling.
 */

// ── Workspace presets (DESIGN_LANGUAGE §1.3) ────────────────────────────────

export type WorkspaceId =
  | "model"
  | "animate"
  | "rig"
  | "material"
  | "simulate"
  | "render"
  | "script"
  | "agent";

export type WorkspacePreset = {
  id: WorkspaceId;
  label: string;
  /** Default tool selected when this workspace activates. */
  defaultTool: ToolId;
};

export const WORKSPACES: WorkspacePreset[] = [
  { id: "model", label: "Model", defaultTool: "select" },
  { id: "animate", label: "Animate", defaultTool: "move" },
  { id: "rig", label: "Rig", defaultTool: "select" },
  { id: "material", label: "Material", defaultTool: "select" },
  { id: "simulate", label: "Simulate", defaultTool: "select" },
  { id: "render", label: "Render", defaultTool: "select" },
  { id: "script", label: "Script", defaultTool: "select" },
  { id: "agent", label: "Agent", defaultTool: "agent" },
];

// ── Tool palette (DESIGN_LANGUAGE §3.5) ─────────────────────────────────────

export type ToolId = "select" | "move" | "rotate" | "scale" | "universal" | "lastUsed" | "agent";

export type ToolDef = {
  id: ToolId;
  label: string;
  hotkey: string;
  glyph: string; // Sprint 2 uses unicode glyphs; Sprint 7 swaps to Lucide icons.
};

export const TOOLS: ToolDef[] = [
  { id: "select", label: "Select", hotkey: "Q", glyph: "▢" },
  { id: "move", label: "Move", hotkey: "W", glyph: "↔" },
  { id: "rotate", label: "Rotate", hotkey: "E", glyph: "↻" },
  { id: "scale", label: "Scale", hotkey: "R", glyph: "⤢" },
  { id: "universal", label: "Universal", hotkey: "T", glyph: "✦" },
  { id: "lastUsed", label: "Last Used", hotkey: "Y", glyph: "⤺" },
];

// ── Sub-toolbar dropdowns (DESIGN_LANGUAGE §3.4) ────────────────────────────

export type Mode = "object" | "edit" | "sculpt" | "paint" | "pose" | "agent";
export type TransformReference =
  | "world"
  | "local"
  | "parent"
  | "object"
  | "element"
  | "selection"
  | "selectionCenter"
  | "active"
  | "camera"
  | "pivot"
  | "custom";
export type PivotMode =
  | "median"
  | "individualOrigins"
  | "cursor3d"
  | "activeElement"
  | "boundingBox"
  | "custom";
export type SnapMode = "grid" | "vertex" | "edge" | "face" | "pivot" | "worldOrigin" | "increment" | "angle";
export type ShadingMode =
  | "wireframe"
  | "solid"
  | "material"
  | "lit"
  | "unlit"
  | "normals"
  | "uv"
  | "agentHeatmap"
  | "xray";

export const MODE_OPTIONS: Array<{ id: Mode; label: string; hotkey?: string }> = [
  { id: "object", label: "Object", hotkey: "1" },
  { id: "edit", label: "Edit", hotkey: "2" },
  { id: "sculpt", label: "Sculpt", hotkey: "3" },
  { id: "paint", label: "Paint", hotkey: "4" },
  { id: "pose", label: "Pose", hotkey: "5" },
  { id: "agent", label: "Agent", hotkey: "5" },
];

export const TRANSFORM_REFERENCE_OPTIONS: Array<{ id: TransformReference; label: string }> = [
  { id: "world", label: "World" },
  { id: "local", label: "Local" },
  { id: "parent", label: "Parent" },
  { id: "object", label: "Object" },
  { id: "element", label: "Element" },
  { id: "selection", label: "Selection" },
  { id: "selectionCenter", label: "Selection Center" },
  { id: "active", label: "Active" },
  { id: "camera", label: "Camera" },
  { id: "pivot", label: "Pivot" },
  { id: "custom", label: "Custom" },
];

export const PIVOT_OPTIONS: Array<{ id: PivotMode; label: string }> = [
  { id: "median", label: "Median Point" },
  { id: "individualOrigins", label: "Individual Origins" },
  { id: "cursor3d", label: "3D Cursor" },
  { id: "activeElement", label: "Active Element" },
  { id: "boundingBox", label: "Bounding Box Center" },
  { id: "custom", label: "Custom" },
];

export const SNAP_OPTIONS: Array<{ id: SnapMode; label: string }> = [
  { id: "grid", label: "Grid" },
  { id: "vertex", label: "Vertex" },
  { id: "edge", label: "Edge" },
  { id: "face", label: "Face" },
  { id: "pivot", label: "Pivot" },
  { id: "worldOrigin", label: "World Origin" },
  { id: "increment", label: "Increment" },
  { id: "angle", label: "Angle" },
];

export const SHADING_OPTIONS: Array<{ id: ShadingMode; label: string }> = [
  { id: "wireframe", label: "Wireframe" },
  { id: "solid", label: "Solid" },
  { id: "material", label: "Material" },
  { id: "lit", label: "Lit" },
  { id: "unlit", label: "Unlit" },
  { id: "normals", label: "Normals" },
  { id: "uv", label: "UV" },
  { id: "agentHeatmap", label: "Agent Heatmap" },
  { id: "xray", label: "X-ray" },
];

// ── Reducer state ───────────────────────────────────────────────────────────

export type StudioState = {
  workspace: WorkspaceId;
  tool: ToolId;
  lastTool: ToolId;
  mode: Mode;
  transformReference: TransformReference;
  pivot: PivotMode;
  snap: SnapMode;
  snapMagnet: boolean;
  shading: ShadingMode;
  agentPanelOpen: boolean;
  contentBrowserOpen: boolean;
  validationDrawerOpen: boolean;
  commandPaletteOpen: boolean;
  /** Primary selected GameObject id, or null. */
  selectedId: string | null;
  /** All selected ids (multi-select). Always includes selectedId when non-null. */
  selectedIds: string[];
  /** Measured FPS pushed by viewport hooks. */
  fpsHint: number;
};

const INITIAL_STATE: StudioState = {
  workspace: "model",
  tool: "select",
  lastTool: "select",
  mode: "object",
  transformReference: "world",
  pivot: "median",
  snap: "grid",
  snapMagnet: false,
  shading: "solid",
  agentPanelOpen: false,
  contentBrowserOpen: false,
  validationDrawerOpen: false,
  commandPaletteOpen: false,
  selectedId: null,
  selectedIds: [],
  fpsHint: 0,
};

// ── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "set-workspace"; workspace: WorkspaceId }
  | { type: "set-tool"; tool: ToolId }
  | { type: "set-mode"; mode: Mode }
  | { type: "set-transform-reference"; transformReference: TransformReference }
  | { type: "set-pivot"; pivot: PivotMode }
  | { type: "set-snap"; snap: SnapMode }
  | { type: "toggle-snap-magnet" }
  | { type: "set-shading"; shading: ShadingMode }
  | { type: "toggle-agent-panel" }
  | { type: "set-agent-panel"; open: boolean }
  | { type: "toggle-content-browser" }
  | { type: "set-content-browser"; open: boolean }
  | { type: "toggle-validation-drawer" }
  | { type: "toggle-command-palette" }
  | { type: "set-command-palette"; open: boolean }
  | { type: "set-selected"; id: string | null }
  | { type: "toggle-selected"; id: string }
  | { type: "remove-from-selection"; id: string }
  | { type: "set-fps-hint"; fps: number };

const reducer = (state: StudioState, action: Action): StudioState => {
  switch (action.type) {
    case "set-workspace": {
      const preset = WORKSPACES.find((w) => w.id === action.workspace);
      const nextTool = preset?.defaultTool ?? state.tool;
      return {
        ...state,
        workspace: action.workspace,
        tool: nextTool,
        lastTool: state.tool,
        agentPanelOpen: action.workspace === "agent" ? true : state.agentPanelOpen,
        contentBrowserOpen: action.workspace === "material" ? true : state.contentBrowserOpen,
      };
    }
    case "set-tool":
      if (action.tool === state.tool) return state;
      return { ...state, tool: action.tool, lastTool: state.tool };
    case "set-mode":
      return { ...state, mode: action.mode };
    case "set-transform-reference":
      return { ...state, transformReference: action.transformReference };
    case "set-pivot":
      return { ...state, pivot: action.pivot };
    case "set-snap":
      return { ...state, snap: action.snap };
    case "toggle-snap-magnet":
      return { ...state, snapMagnet: !state.snapMagnet };
    case "set-shading":
      return { ...state, shading: action.shading };
    case "toggle-agent-panel":
      return { ...state, agentPanelOpen: !state.agentPanelOpen };
    case "set-agent-panel":
      return { ...state, agentPanelOpen: action.open };
    case "toggle-content-browser":
      return { ...state, contentBrowserOpen: !state.contentBrowserOpen };
    case "set-content-browser":
      return { ...state, contentBrowserOpen: action.open };
    case "toggle-validation-drawer":
      return { ...state, validationDrawerOpen: !state.validationDrawerOpen };
    case "toggle-command-palette":
      return { ...state, commandPaletteOpen: !state.commandPaletteOpen };
    case "set-command-palette":
      return { ...state, commandPaletteOpen: action.open };
    case "set-selected":
      return {
        ...state,
        selectedId: action.id,
        selectedIds: action.id ? [action.id] : [],
      };
    case "toggle-selected": {
      const already = state.selectedIds.includes(action.id);
      const next = already
        ? state.selectedIds.filter((i) => i !== action.id)
        : [...state.selectedIds, action.id];
      return {
        ...state,
        selectedId: next.length > 0 ? next[next.length - 1] : null,
        selectedIds: next,
      };
    }
    case "remove-from-selection": {
      if (!state.selectedIds.includes(action.id)) return state;
      const next = state.selectedIds.filter((i) => i !== action.id);
      return {
        ...state,
        selectedId:
          state.selectedId === action.id
            ? (next[next.length - 1] ?? null)
            : state.selectedId,
        selectedIds: next,
      };
    }
    case "set-fps-hint":
      return state.fpsHint === action.fps ? state : { ...state, fpsHint: action.fps };
  }
};

// ── Context ─────────────────────────────────────────────────────────────────

type StudioContextValue = {
  state: StudioState;
  setWorkspace: (id: WorkspaceId) => void;
  setTool: (id: ToolId) => void;
  setMode: (m: Mode) => void;
  setTransformReference: (tr: TransformReference) => void;
  setPivot: (p: PivotMode) => void;
  setSnap: (s: SnapMode) => void;
  toggleSnapMagnet: () => void;
  setShading: (s: ShadingMode) => void;
  toggleAgentPanel: () => void;
  setAgentPanel: (open: boolean) => void;
  toggleContentBrowser: () => void;
  setContentBrowser: (open: boolean) => void;
  toggleValidationDrawer: () => void;
  toggleCommandPalette: () => void;
  setCommandPalette: (open: boolean) => void;
  setSelected: (id: string | null) => void;
  toggleSelected: (id: string) => void;
  removeFromSelection: (id: string) => void;
  setFpsHint: (fps: number) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export const StudioStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const value = useMemo<StudioContextValue>(
    () => ({
      state,
      setWorkspace: (id) => dispatch({ type: "set-workspace", workspace: id }),
      setTool: (id) => dispatch({ type: "set-tool", tool: id }),
      setMode: (m) => dispatch({ type: "set-mode", mode: m }),
      setTransformReference: (tr) => dispatch({ type: "set-transform-reference", transformReference: tr }),
      setPivot: (p) => dispatch({ type: "set-pivot", pivot: p }),
      setSnap: (s) => dispatch({ type: "set-snap", snap: s }),
      toggleSnapMagnet: () => dispatch({ type: "toggle-snap-magnet" }),
      setShading: (s) => dispatch({ type: "set-shading", shading: s }),
      toggleAgentPanel: () => dispatch({ type: "toggle-agent-panel" }),
      setAgentPanel: (open) => dispatch({ type: "set-agent-panel", open }),
      toggleContentBrowser: () => dispatch({ type: "toggle-content-browser" }),
      setContentBrowser: (open) => dispatch({ type: "set-content-browser", open }),
      toggleValidationDrawer: () => dispatch({ type: "toggle-validation-drawer" }),
      toggleCommandPalette: () => dispatch({ type: "toggle-command-palette" }),
      setCommandPalette: (open) => dispatch({ type: "set-command-palette", open }),
      setSelected: (id) => dispatch({ type: "set-selected", id }),
      toggleSelected: (id) => dispatch({ type: "toggle-selected", id }),
      removeFromSelection: (id) => dispatch({ type: "remove-from-selection", id }),
      setFpsHint: (fps) => dispatch({ type: "set-fps-hint", fps }),
    }),
    [state],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
};

export const useStudioState = (): StudioContextValue => {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudioState must be used inside <StudioStateProvider>");
  return ctx;
};
