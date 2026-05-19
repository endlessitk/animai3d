import React, { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type { Scene3D } from "../scene/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "agent" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: string;
};

export type ToolCallStatus = "queued" | "streaming" | "complete" | "errored";

export type ToolCall = {
  id: string;
  /** Tool name, e.g. "read_scene", "add_animation_component". */
  name: string;
  args: Record<string, unknown>;
  status: ToolCallStatus;
  result?: string;
  timestamp: string;
};

export type SceneDiff = {
  id: string;
  /** Human-readable summary, e.g. "+ AnimationComponent on Cube · 3 keyframes". */
  summary: string;
  /** Bullet lines for the diff card. */
  changes: string[];
  /** Pure function that produces the next scene when Apply is clicked. */
  apply: (s: Scene3D) => Scene3D;
};

// ── State ─────────────────────────────────────────────────────────────────────

export type AgentSessionState = {
  messages: ChatMessage[];
  toolCalls: ToolCall[];
  pendingDiff: SceneDiff | null;
  /** True between user submit and final agent reply. */
  busy: boolean;
};

const INITIAL_STATE: AgentSessionState = {
  messages: [],
  toolCalls: [],
  pendingDiff: null,
  busy: false,
};

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: "append-message"; message: ChatMessage }
  | { type: "append-tool-call"; call: ToolCall }
  | { type: "update-tool-call"; id: string; patch: Partial<ToolCall> }
  | { type: "set-pending-diff"; diff: SceneDiff | null }
  | { type: "set-busy"; busy: boolean }
  | { type: "reset" };

const reducer = (state: AgentSessionState, action: Action): AgentSessionState => {
  switch (action.type) {
    case "append-message":
      return { ...state, messages: [...state.messages, action.message] };
    case "append-tool-call":
      return { ...state, toolCalls: [...state.toolCalls, action.call] };
    case "update-tool-call":
      return {
        ...state,
        toolCalls: state.toolCalls.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "set-pending-diff":
      return { ...state, pendingDiff: action.diff };
    case "set-busy":
      return { ...state, busy: action.busy };
    case "reset":
      return INITIAL_STATE;
  }
};

// ── Context ───────────────────────────────────────────────────────────────────

let _idCounter = 0;
const nextId = () => `${Date.now()}-${++_idCounter}`;

type AgentSessionContextValue = {
  state: AgentSessionState;
  appendMessage: (role: ChatRole, text: string) => ChatMessage;
  appendToolCall: (name: string, args: Record<string, unknown>) => ToolCall;
  updateToolCall: (id: string, patch: Partial<ToolCall>) => void;
  setPendingDiff: (diff: SceneDiff | null) => void;
  setBusy: (busy: boolean) => void;
  reset: () => void;
};

const AgentSessionContext = createContext<AgentSessionContextValue | null>(null);

export const AgentSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const appendMessage = useCallback((role: ChatRole, text: string): ChatMessage => {
    const message: ChatMessage = {
      id: nextId(),
      role,
      text,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: "append-message", message });
    return message;
  }, []);

  const appendToolCall = useCallback(
    (name: string, args: Record<string, unknown>): ToolCall => {
      const call: ToolCall = {
        id: nextId(),
        name,
        args,
        status: "queued",
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "append-tool-call", call });
      return call;
    },
    [],
  );

  const updateToolCall = useCallback((id: string, patch: Partial<ToolCall>) => {
    dispatch({ type: "update-tool-call", id, patch });
  }, []);

  const setPendingDiff = useCallback((diff: SceneDiff | null) => {
    dispatch({ type: "set-pending-diff", diff });
  }, []);

  const setBusy = useCallback((busy: boolean) => {
    dispatch({ type: "set-busy", busy });
  }, []);

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  const value = useMemo<AgentSessionContextValue>(
    () => ({ state, appendMessage, appendToolCall, updateToolCall, setPendingDiff, setBusy, reset }),
    [state, appendMessage, appendToolCall, updateToolCall, setPendingDiff, setBusy, reset],
  );

  return <AgentSessionContext.Provider value={value}>{children}</AgentSessionContext.Provider>;
};

export const useAgentSession = (): AgentSessionContextValue => {
  const ctx = useContext(AgentSessionContext);
  if (!ctx) throw new Error("useAgentSession must be used inside <AgentSessionProvider>");
  return ctx;
};
