import { useReducer } from "react";
import type { Scene3D } from "../scene/schema";

const MAX_HISTORY = 50;

type UndoState = {
  past: Scene3D[];
  present: Scene3D;
  future: Scene3D[];
};

type UndoAction =
  | { type: "commit"; updater: (s: Scene3D) => Scene3D }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; scene: Scene3D };

const undoReducer = (state: UndoState, action: UndoAction): UndoState => {
  switch (action.type) {
    case "commit": {
      const next = action.updater(state.present);
      if (next === state.present) return state;
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: next,
        future: [],
      };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: prev,
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: next,
        future: rest,
      };
    }
    case "reset":
      return { past: [], present: action.scene, future: [] };
  }
};

export const useUndoableScene = (initial: Scene3D) => {
  const [state, dispatch] = useReducer(undoReducer, {
    past: [],
    present: initial,
    future: [],
  });

  return {
    scene: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commit: (updater: (s: Scene3D) => Scene3D) => dispatch({ type: "commit", updater }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    reset: (scene: Scene3D) => dispatch({ type: "reset", scene }),
  };
};
