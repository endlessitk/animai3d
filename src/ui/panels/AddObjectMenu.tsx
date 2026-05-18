import React, { useEffect, useRef, useState } from "react";
import type { AddObjectKind } from "../../scene/sceneUtils";

// ── Menu entries ──────────────────────────────────────────────────────────────

type Entry = { kind: AddObjectKind; label: string; glyph: string; group: string };

const ENTRIES: Entry[] = [
  // Meshes
  { kind: "box",      label: "Box",       glyph: "▣", group: "Mesh" },
  { kind: "sphere",   label: "Sphere",    glyph: "●", group: "Mesh" },
  { kind: "cylinder", label: "Cylinder",  glyph: "⬭", group: "Mesh" },
  { kind: "plane",    label: "Plane",     glyph: "▬", group: "Mesh" },
  { kind: "torus",    label: "Torus",     glyph: "◎", group: "Mesh" },
  { kind: "empty",    label: "Empty",     glyph: "○", group: "Mesh" },
  // Lights
  { kind: "point-light",       label: "Point",       glyph: "✦", group: "Light" },
  { kind: "directional-light", label: "Directional", glyph: "→", group: "Light" },
  { kind: "spot-light",        label: "Spot",        glyph: "◉", group: "Light" },
  { kind: "ambient-light",     label: "Ambient",     glyph: "☀", group: "Light" },
  // Camera
  { kind: "camera", label: "Camera", glyph: "📷", group: "Camera" },
];

const GROUPS = ["Mesh", "Light", "Camera"];

// ── Props ─────────────────────────────────────────────────────────────────────

export type AddObjectMenuProps = {
  onAdd: (kind: AddObjectKind) => void;
  onClose: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const AddObjectMenu: React.FC<AddObjectMenuProps> = ({ onAdd, onClose }) => {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 20);
  }, []);

  // Close on outside click
  useEffect(() => {
    const dismiss = (e: PointerEvent) => {
      const el = document.querySelector(".add-object-menu");
      if (el && !el.contains(e.target as Node)) onClose();
    };
    window.addEventListener("pointerdown", dismiss, { capture: true });
    return () => window.removeEventListener("pointerdown", dismiss, { capture: true });
  }, [onClose]);

  const q = search.toLowerCase().trim();
  const filtered = q ? ENTRIES.filter((e) => e.label.toLowerCase().includes(q)) : null;

  const handleAdd = (kind: AddObjectKind) => {
    onAdd(kind);
    onClose();
  };

  return (
    <div className="add-object-menu" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="add-object-menu__search-wrap">
        <input
          ref={searchRef}
          className="add-object-menu__search"
          placeholder="Search objects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="add-object-menu__body">
        {filtered ? (
          <div className="add-object-menu__group">
            <div className="add-object-menu__grid">
              {filtered.map((entry) => (
                <button
                  key={entry.kind}
                  className="add-object-menu__item"
                  onClick={() => handleAdd(entry.kind)}
                  title={entry.label}
                >
                  <span className="add-object-menu__glyph">{entry.glyph}</span>
                  <span className="add-object-menu__label">{entry.label}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="add-object-menu__empty">No match for "{search}"</p>
              )}
            </div>
          </div>
        ) : (
          GROUPS.map((group) => {
            const entries = ENTRIES.filter((e) => e.group === group);
            return (
              <div key={group} className="add-object-menu__group">
                <div className="add-object-menu__group-label">{group}</div>
                <div className="add-object-menu__grid">
                  {entries.map((entry) => (
                    <button
                      key={entry.kind}
                      className="add-object-menu__item"
                      onClick={() => handleAdd(entry.kind)}
                      title={entry.label}
                    >
                      <span className="add-object-menu__glyph">{entry.glyph}</span>
                      <span className="add-object-menu__label">{entry.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
