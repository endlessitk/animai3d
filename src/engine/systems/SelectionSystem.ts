import type { SceneObject } from "../../scene/schema";

export type SelectionState = {
  selectedIds: string[];
};

export const emptySelection = (): SelectionState => ({ selectedIds: [] });

export const selectOnly = (id: string): SelectionState => ({ selectedIds: id ? [id] : [] });

export const toggleSelection = (state: SelectionState, id: string): SelectionState => {
  if (!id) return state;
  if (state.selectedIds.includes(id)) {
    return { selectedIds: state.selectedIds.filter((item) => item !== id) };
  }
  return { selectedIds: [...state.selectedIds, id] };
};

export const isSelected = (state: SelectionState, id: string): boolean => state.selectedIds.includes(id);

export const getSelectedObjects = (objects: SceneObject[], state: SelectionState): SceneObject[] =>
  objects.filter((object) => state.selectedIds.includes(object.id));
