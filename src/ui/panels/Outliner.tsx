import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStudioState } from "../../state/studioState";
import type { ComponentType, GameObject, Scene3D } from "../../scene/schema";
import { findComponent } from "../../scene/schema";
import {
  deleteObject,
  duplicateObject,
  renameObject,
  reorderObjects,
  setParent,
  toggleLock,
  toggleVisibility,
} from "../../scene/sceneUtils";

// ── Type icon resolution ─────────────────────────────────────────────────────

type IconHint = { glyph: string; label: string };

const TYPE_ICON: Partial<Record<ComponentType, IconHint>> = {
  camera: { glyph: "📷", label: "Camera" },
  light: { glyph: "💡", label: "Light" },
  mesh: { glyph: "▣", label: "Mesh" },
};

const resolveTypeIcon = (obj: GameObject): IconHint => {
  if (findComponent(obj, "camera")) return TYPE_ICON.camera!;
  if (findComponent(obj, "light")) return TYPE_ICON.light!;
  if (findComponent(obj, "mesh")) return TYPE_ICON.mesh!;
  return { glyph: "○", label: "Empty" };
};

// ── Tag system ────────────────────────────────────────────────────────────────

type TagSpec = { id: string; glyph: string; modifier: string; label: string };

const collectTags = (obj: GameObject): TagSpec[] => {
  const tags: TagSpec[] = [];
  if (findComponent(obj, "agentMetadata"))
    tags.push({ id: "agent", glyph: "●", modifier: "is-agent", label: "Agent-touched" });
  if (findComponent(obj, "material"))
    tags.push({ id: "material", glyph: "▦", modifier: "is-material", label: "Material" });
  if (findComponent(obj, "light"))
    tags.push({ id: "light", glyph: "✦", modifier: "is-light", label: "Light" });
  if (findComponent(obj, "camera"))
    tags.push({ id: "camera", glyph: "□", modifier: "is-camera", label: "Camera" });
  const tagComp = findComponent(obj, "tag");
  if (tagComp && tagComp.labels.length > 0)
    tags.push({ id: "note", glyph: "▤", modifier: "", label: tagComp.labels.join(", ") });
  return tags;
};

// ── Tree builder ──────────────────────────────────────────────────────────────

type FlatRow = { obj: GameObject; depth: number; hasChildren: boolean; sceneIndex: number };

function buildFlatTree(objects: GameObject[], collapsed: Set<string>): FlatRow[] {
  const objMap = new Map(objects.map((o, i) => [o.id, { obj: o, idx: i }]));
  const childMap = new Map<string, string[]>();
  const roots: string[] = [];

  for (const obj of objects) {
    const pid = obj.parentId;
    if (pid && objMap.has(pid)) {
      if (!childMap.has(pid)) childMap.set(pid, []);
      childMap.get(pid)!.push(obj.id);
    } else {
      roots.push(obj.id);
    }
  }

  const result: FlatRow[] = [];

  function visit(id: string, depth: number) {
    const entry = objMap.get(id);
    if (!entry) return;
    const children = childMap.get(id) ?? [];
    result.push({ obj: entry.obj, depth, hasChildren: children.length > 0, sceneIndex: entry.idx });
    if (!collapsed.has(id)) {
      for (const childId of children) visit(childId, depth + 1);
    }
  }

  for (const rootId of roots) visit(rootId, 0);
  return result;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ContextMenuState = { objectId: string; x: number; y: number };

export type OutlinerProps = {
  scene: Scene3D;
  onSceneChange: (description: string, updater: (s: Scene3D) => Scene3D) => void;
  onAddObjectOpen?: () => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export const Outliner: React.FC<OutlinerProps> = ({ scene, onSceneChange, onAddObjectOpen }) => {
  const { state, setSelected, toggleSelected, removeFromSelection } = useStudioState();

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const searchRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const query = search.toLowerCase().trim();

  // When searching: flat filtered list; otherwise: tree
  const rows: FlatRow[] = query
    ? scene.objects
        .filter((o) => o.name.toLowerCase().includes(query))
        .map((o, i) => ({ obj: o, depth: 0, hasChildren: false, sceneIndex: scene.objects.indexOf(o) }))
    : buildFlatTree(scene.objects, collapsed);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Dismiss context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    window.addEventListener("pointerdown", dismiss, { capture: true });
    return () => window.removeEventListener("pointerdown", dismiss, { capture: true });
  }, [contextMenu]);

  // Auto-focus rename input
  useEffect(() => {
    if (renameId) renameRef.current?.select();
  }, [renameId]);

  const startRename = useCallback((obj: GameObject) => {
    setRenameId(obj.id);
    setRenameValue(obj.name);
    setContextMenu(null);
  }, []);

  const commitRename = useCallback(() => {
    if (renameId && renameValue.trim()) {
      onSceneChange(`Rename → "${renameValue.trim()}"`, (s) =>
        renameObject(s, renameId, renameValue.trim()),
      );
    }
    setRenameId(null);
  }, [renameId, renameValue, onSceneChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (renameId) return;
    const curIdx = focusedIndex ?? rows.findIndex((r) => r.obj.id === state.selectedId);
    const curRow = rows[curIdx];

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = Math.min(curIdx + 1, rows.length - 1);
        setFocusedIndex(next);
        if (rows[next]) setSelected(rows[next].obj.id);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const next = Math.max(curIdx - 1, 0);
        setFocusedIndex(next);
        if (rows[next]) setSelected(rows[next].obj.id);
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        if (curRow?.hasChildren && collapsed.has(curRow.obj.id)) toggleCollapse(curRow.obj.id);
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        if (curRow?.hasChildren && !collapsed.has(curRow.obj.id)) toggleCollapse(curRow.obj.id);
        break;
      }
      case " ": {
        e.preventDefault();
        if (curRow) onSceneChange(`Toggle visibility: ${curRow.obj.name}`, (s) => toggleVisibility(s, curRow.obj.id));
        break;
      }
      case "Delete":
      case "Backspace": {
        e.preventDefault();
        if (curRow) {
          onSceneChange(`Delete: ${curRow.obj.name}`, (s) => deleteObject(s, curRow.obj.id));
          removeFromSelection(curRow.obj.id);
          setFocusedIndex(null);
        }
        break;
      }
      case "F2":
      case "Enter": {
        if (curRow) startRename(curRow.obj);
        break;
      }
      // P → parent selected to active
      case "p":
      case "P": {
        if (e.altKey) {
          // Alt+P → clear parent
          e.preventDefault();
          if (curRow) onSceneChange(`Unparent: ${curRow.obj.name}`, (s) => setParent(s, curRow.obj.id, null));
        } else if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const activeId = state.selectedId;
          if (curRow && activeId && activeId !== curRow.obj.id) {
            onSceneChange(`Parent to active`, (s) => setParent(s, curRow.obj.id, activeId));
          }
        }
        break;
      }
    }
  };

  // Drag reorder (operates on scene indices)
  const handleDragStart = (e: React.DragEvent, rowIdx: number) => {
    setDragFromIndex(rowIdx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, rowIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(rowIdx);
  };

  const handleDrop = (e: React.DragEvent, rowIdx: number) => {
    e.preventDefault();
    if (dragFromIndex === null || dragFromIndex === rowIdx) {
      setDragFromIndex(null);
      setDragOverIndex(null);
      return;
    }
    const fromSceneIdx = rows[dragFromIndex]?.sceneIndex;
    const toSceneIdx = rows[rowIdx]?.sceneIndex;
    if (fromSceneIdx == null || toSceneIdx == null) return;
    onSceneChange("Reorder objects", (s) => reorderObjects(s, fromSceneIdx, toSceneIdx));
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  const handleRightClick = (e: React.MouseEvent, obj: GameObject) => {
    e.preventDefault();
    setContextMenu({ objectId: obj.id, x: e.clientX, y: e.clientY });
  };

  const ctxObj = contextMenu ? scene.objects.find((o) => o.id === contextMenu.objectId) : null;

  return (
    <section className="outliner" tabIndex={0} onKeyDown={handleKeyDown}>
      <header className="panel-header">
        <span className="panel-header__title">Outliner</span>
        <div className="panel-header__actions">
          <button
            className={`panel-header__btn ${searchOpen ? "is-active" : ""}`}
            title="Search (Ctrl+F)"
            onClick={() => {
              const next = !searchOpen;
              setSearchOpen(next);
              if (next) setTimeout(() => searchRef.current?.focus(), 30);
              else setSearch("");
            }}
          >🔍</button>
          <button
            className="panel-header__btn"
            title="Add object (Shift+A)"
            onClick={() => onAddObjectOpen?.()}
          >+</button>
        </div>
      </header>

      {searchOpen && (
        <div className="outliner__search-bar">
          <input
            ref={searchRef}
            className="outliner__search-input"
            placeholder="Filter objects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setSearch(""); setSearchOpen(false); }
            }}
          />
          {search && (
            <button className="outliner__search-clear" onClick={() => setSearch("")} title="Clear">×</button>
          )}
        </div>
      )}

      <div className="panel-body">
        <ul className="outliner__list">
          {rows.map((row, rowIdx) => {
            const { obj, depth, hasChildren } = row;
            const icon = resolveTypeIcon(obj);
            const tags = collectTags(obj);
            const visibleTags = tags.slice(0, 4);
            const overflow = tags.length - 4;
            const hasAgent = !!findComponent(obj, "agentMetadata");
            const isSelected = state.selectedId === obj.id;
            const isMultiSelected = state.selectedIds.includes(obj.id);
            const isRenaming = renameId === obj.id;
            const isDragOver = dragOverIndex === rowIdx;
            const isCollapsed = collapsed.has(obj.id);

            return (
              <li
                key={obj.id}
                className={[
                  "outliner__row",
                  isSelected ? "is-selected" : "",
                  !isSelected && isMultiSelected ? "is-multi-selected" : "",
                  hasAgent ? "is-agent" : "",
                  isDragOver ? "is-drag-over" : "",
                  !obj.visible ? "is-hidden" : "",
                  obj.locked ? "is-locked-row" : "",
                ].filter(Boolean).join(" ")}
                style={{ paddingLeft: depth * 12 + 4 }}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) toggleSelected(obj.id);
                  else setSelected(obj.id);
                  setFocusedIndex(rowIdx);
                }}
                onDoubleClick={() => startRename(obj)}
                onContextMenu={(e) => handleRightClick(e, obj)}
                draggable={!isRenaming}
                onDragStart={(e) => handleDragStart(e, rowIdx)}
                onDragOver={(e) => handleDragOver(e, rowIdx)}
                onDrop={(e) => handleDrop(e, rowIdx)}
                onDragEnd={handleDragEnd}
                title={`${obj.name} · ${icon.label}`}
              >
                {/* Chevron — only shown when has children */}
                <span
                  className={`outliner__chevron ${hasChildren ? "is-visible" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleCollapse(obj.id); }}
                  aria-hidden
                >
                  {hasChildren ? (isCollapsed ? "▸" : "▾") : ""}
                </span>

                <span className="outliner__icon" aria-hidden>{icon.glyph}</span>

                {isRenaming ? (
                  <input
                    ref={renameRef}
                    className="outliner__rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenameId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="outliner__name">{obj.name}</span>
                )}

                <span className="outliner__tags">
                  {visibleTags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`outliner__tag ${tag.modifier}`}
                      title={tag.label}
                    >{tag.glyph}</span>
                  ))}
                  {overflow > 0 && (
                    <span
                      className="outliner__tag"
                      title={tags.slice(4).map((t) => t.label).join(", ")}
                    >+{overflow}</span>
                  )}
                </span>

                <span className="outliner__visibility">
                  <button
                    type="button"
                    className={`outliner__vis-btn ${obj.visible ? "is-on" : ""}`}
                    title="Toggle visibility (Space)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSceneChange(`Toggle visibility: ${obj.name}`, (s) => toggleVisibility(s, obj.id));
                    }}
                  >👁</button>
                  <button
                    type="button"
                    className={`outliner__vis-btn ${obj.locked ? "is-locked" : ""}`}
                    title="Toggle lock"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSceneChange(`Toggle lock: ${obj.name}`, (s) => toggleLock(s, obj.id));
                    }}
                  >🔒</button>
                </span>
              </li>
            );
          })}

          {rows.length === 0 && query && (
            <li className="outliner__empty">No objects match "{search}"</li>
          )}
        </ul>
      </div>

      {/* Context menu */}
      {contextMenu && ctxObj && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button className="context-menu__item" onClick={() => startRename(ctxObj)}>Rename</button>
          <button
            className="context-menu__item"
            onClick={() => {
              onSceneChange(`Duplicate: ${ctxObj.name}`, (s) => duplicateObject(s, ctxObj.id));
              setContextMenu(null);
            }}
          >Duplicate</button>
          <div className="context-menu__separator" />
          <button
            className="context-menu__item"
            onClick={() => {
              onSceneChange(`Toggle visibility: ${ctxObj.name}`, (s) => toggleVisibility(s, ctxObj.id));
              setContextMenu(null);
            }}
          >{ctxObj.visible ? "Hide" : "Show"}</button>
          <button
            className="context-menu__item"
            onClick={() => {
              onSceneChange(`Toggle lock: ${ctxObj.name}`, (s) => toggleLock(s, ctxObj.id));
              setContextMenu(null);
            }}
          >{ctxObj.locked ? "Unlock" : "Lock"}</button>
          <div className="context-menu__separator" />
          {/* Parenting */}
          {state.selectedId && state.selectedId !== ctxObj.id && (
            <button
              className="context-menu__item"
              onClick={() => {
                onSceneChange(`Parent to active`, (s) => setParent(s, ctxObj.id, state.selectedId!));
                setContextMenu(null);
              }}
            >Set Parent to Active</button>
          )}
          {ctxObj.parentId && (
            <button
              className="context-menu__item"
              onClick={() => {
                onSceneChange(`Unparent: ${ctxObj.name}`, (s) => setParent(s, ctxObj.id, null));
                setContextMenu(null);
              }}
            >Clear Parent</button>
          )}
          {(state.selectedId && state.selectedId !== ctxObj.id) || ctxObj.parentId
            ? <div className="context-menu__separator" />
            : null}
          <button
            className="context-menu__item"
            onClick={() => {
              navigator.clipboard?.writeText(ctxObj.id).catch(() => undefined);
              setContextMenu(null);
            }}
          >Copy ID</button>
          <div className="context-menu__separator" />
          <button
            className="context-menu__item context-menu__item--danger"
            onClick={() => {
              onSceneChange(`Delete: ${ctxObj.name}`, (s) => deleteObject(s, ctxObj.id));
              removeFromSelection(ctxObj.id);
              setContextMenu(null);
            }}
          >Delete</button>
        </div>
      )}
    </section>
  );
};
