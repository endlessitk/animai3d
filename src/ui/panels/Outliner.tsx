import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStudioState } from "../../state/studioState";
import type { ComponentType, GameObject, Scene3D } from "../../scene/schema";
import { findComponent } from "../../scene/schema";
import {
  deleteObject,
  duplicateObject,
  renameObject,
  reorderObjects,
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

// ── Tag system (C4D inline strip) ────────────────────────────────────────────

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

// ── Types ─────────────────────────────────────────────────────────────────────

type ContextMenuState = { objectId: string; x: number; y: number };

export type OutlinerProps = {
  scene: Scene3D;
  onSceneChange: (description: string, updater: (s: Scene3D) => Scene3D) => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export const Outliner: React.FC<OutlinerProps> = ({ scene, onSceneChange }) => {
  const { state, setSelected, toggleSelected } = useStudioState();

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const query = search.toLowerCase().trim();
  const visible = query
    ? scene.objects.filter((o) => o.name.toLowerCase().includes(query))
    : scene.objects;

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
    if (renameId) return; // let rename input handle keys
    const objs = visible;
    const curIdx = focusedIndex ?? objs.findIndex((o) => o.id === state.selectedId);

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = Math.min(curIdx + 1, objs.length - 1);
        setFocusedIndex(next);
        if (objs[next]) setSelected(objs[next].id);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const next = Math.max(curIdx - 1, 0);
        setFocusedIndex(next);
        if (objs[next]) setSelected(objs[next].id);
        break;
      }
      case " ": {
        e.preventDefault();
        const obj = objs[curIdx];
        if (obj)
          onSceneChange(`Toggle visibility: ${obj.name}`, (s) => toggleVisibility(s, obj.id));
        break;
      }
      case "Delete":
      case "Backspace": {
        e.preventDefault();
        const obj = objs[curIdx];
        if (obj) {
          onSceneChange(`Delete: ${obj.name}`, (s) => deleteObject(s, obj.id));
          setSelected(null);
          setFocusedIndex(null);
        }
        break;
      }
      case "F2":
      case "Enter": {
        const obj = objs[curIdx];
        if (obj) startRename(obj);
        break;
      }
    }
  };

  // Drag reorder
  const handleDragStart = (e: React.DragEvent, filteredIndex: number) => {
    setDragFromIndex(filteredIndex);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, filteredIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(filteredIndex);
  };

  const handleDrop = (e: React.DragEvent, filteredIndex: number) => {
    e.preventDefault();
    if (dragFromIndex === null || dragFromIndex === filteredIndex) {
      setDragFromIndex(null);
      setDragOverIndex(null);
      return;
    }
    const fromId = visible[dragFromIndex]?.id;
    const toId = visible[filteredIndex]?.id;
    if (!fromId || !toId) return;
    const fromSceneIdx = scene.objects.findIndex((o) => o.id === fromId);
    const toSceneIdx = scene.objects.findIndex((o) => o.id === toId);
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

  const ctxObj = contextMenu
    ? scene.objects.find((o) => o.id === contextMenu.objectId)
    : null;

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
          <button className="panel-header__btn" title="Add object">+</button>
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
            <button
              className="outliner__search-clear"
              onClick={() => setSearch("")}
              title="Clear"
            >×</button>
          )}
        </div>
      )}

      <div className="panel-body">
        <ul className="outliner__list">
          {visible.map((obj, filteredIdx) => {
            const icon = resolveTypeIcon(obj);
            const tags = collectTags(obj);
            const visibleTags = tags.slice(0, 4);
            const overflow = tags.length - 4;
            const hasAgent = !!findComponent(obj, "agentMetadata");
            const isSelected = state.selectedId === obj.id;
            const isMultiSelected = state.selectedIds.includes(obj.id);
            const isRenaming = renameId === obj.id;
            const isDragOver = dragOverIndex === filteredIdx;

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
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    toggleSelected(obj.id);
                  } else {
                    setSelected(obj.id);
                  }
                  setFocusedIndex(filteredIdx);
                }}
                onDoubleClick={() => startRename(obj)}
                onContextMenu={(e) => handleRightClick(e, obj)}
                draggable={!isRenaming}
                onDragStart={(e) => handleDragStart(e, filteredIdx)}
                onDragOver={(e) => handleDragOver(e, filteredIdx)}
                onDrop={(e) => handleDrop(e, filteredIdx)}
                onDragEnd={handleDragEnd}
                title={`${obj.name} · ${icon.label}`}
              >
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
                      onSceneChange(`Toggle visibility: ${obj.name}`, (s) =>
                        toggleVisibility(s, obj.id),
                      );
                    }}
                  >👁</button>
                  <button
                    type="button"
                    className={`outliner__vis-btn ${obj.locked ? "is-locked" : ""}`}
                    title="Toggle lock"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSceneChange(`Toggle lock: ${obj.name}`, (s) =>
                        toggleLock(s, obj.id),
                      );
                    }}
                  >🔒</button>
                </span>
              </li>
            );
          })}

          {visible.length === 0 && query && (
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
          <button
            className="context-menu__item"
            onClick={() => startRename(ctxObj)}
          >Rename</button>
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
              onSceneChange(`Toggle visibility: ${ctxObj.name}`, (s) =>
                toggleVisibility(s, ctxObj.id),
              );
              setContextMenu(null);
            }}
          >{ctxObj.visible ? "Hide" : "Show"}</button>
          <button
            className="context-menu__item"
            onClick={() => {
              onSceneChange(`Toggle lock: ${ctxObj.name}`, (s) =>
                toggleLock(s, ctxObj.id),
              );
              setContextMenu(null);
            }}
          >{ctxObj.locked ? "Unlock" : "Lock"}</button>
          <div className="context-menu__separator" />
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
              setSelected(null);
              setContextMenu(null);
            }}
          >Delete</button>
        </div>
      )}
    </section>
  );
};
