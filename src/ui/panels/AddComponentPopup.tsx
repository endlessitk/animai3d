import React, { useEffect, useRef, useState } from "react";
import type { Component, ComponentType } from "../../scene/schema";
import { IDENTITY_TRANSFORM_3D } from "../../scene/schema";

// ── Available components grid (§5.11) ────────────────────────────────────────

type ComponentDef = {
  type: ComponentType;
  label: string;
  icon: string;
  description: string;
  build: () => Component;
};

const COMPONENT_DEFS: ComponentDef[] = [
  {
    type: "transform",
    label: "Transform",
    icon: "⊞",
    description: "Position, rotation, scale",
    build: () => ({ type: "transform", transform: IDENTITY_TRANSFORM_3D }),
  },
  {
    type: "mesh",
    label: "Mesh",
    icon: "▣",
    description: "Renderable geometry primitive",
    build: () => ({
      type: "mesh",
      primitive: { kind: "box", size: [1, 1, 1] as [number, number, number] },
      castShadow: true,
      receiveShadow: true,
    }),
  },
  {
    type: "material",
    label: "Material",
    icon: "▦",
    description: "PBR surface material",
    build: () => ({
      type: "material",
      material: { kind: "standard", color: "#888888", metalness: 0, roughness: 0.5 },
    }),
  },
  {
    type: "camera",
    label: "Camera",
    icon: "□",
    description: "Perspective or orthographic camera",
    build: () => ({
      type: "camera",
      kind: "perspective",
      fov: 75,
      near: 0.1,
      far: 1000,
      active: false,
    }),
  },
  {
    type: "light",
    label: "Light",
    icon: "✦",
    description: "Scene light source",
    build: () => ({
      type: "light",
      kind: "point",
      color: "#ffffff",
      intensity: 1,
      distance: 10,
    }),
  },
  {
    type: "tag",
    label: "Tag",
    icon: "▤",
    description: "Label annotations",
    build: () => ({ type: "tag", labels: [] }),
  },
  {
    type: "agentMetadata",
    label: "Agent Metadata",
    icon: "◐",
    description: "AI provenance + variant tracking",
    build: () => ({
      type: "agentMetadata",
      createdBy: null,
      modifiedBy: null,
      reviewedByHuman: false,
    }),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export type AddComponentPopupProps = {
  onAdd: (component: Component) => void;
  onClose: () => void;
  existingTypes: ComponentType[];
};

export const AddComponentPopup: React.FC<AddComponentPopupProps> = ({
  onAdd,
  onClose,
  existingTypes,
}) => {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Dismiss on outside click
  useEffect(() => {
    const dismiss = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("pointerdown", dismiss, { capture: true });
    return () => window.removeEventListener("pointerdown", dismiss, { capture: true });
  }, [onClose]);

  const q = query.toLowerCase().trim();
  const filtered = COMPONENT_DEFS.filter(
    (d) =>
      (!q || d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)),
  );

  const handleSelect = (def: ComponentDef) => {
    if (existingTypes.includes(def.type) && def.type !== "tag" && def.type !== "light") return;
    onAdd(def.build());
    onClose();
  };

  return (
    <div className="add-component-popup" ref={containerRef}>
      <div className="add-component-popup__search-row">
        <input
          ref={searchRef}
          className="add-component-popup__search"
          placeholder="Search component…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            e.stopPropagation();
          }}
        />
      </div>
      <div className="add-component-popup__grid">
        {filtered.map((def) => {
          const alreadyExists =
            existingTypes.includes(def.type) && def.type !== "tag" && def.type !== "light";
          return (
            <button
              key={def.type}
              type="button"
              className={`add-component-popup__item${alreadyExists ? " is-disabled" : ""}`}
              disabled={alreadyExists}
              title={alreadyExists ? "Already on this object" : def.description}
              onClick={() => handleSelect(def)}
            >
              <span className="add-component-popup__icon">{def.icon}</span>
              <span className="add-component-popup__label">{def.label}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="add-component-popup__empty">No matches for "{query}"</div>
        )}
      </div>
    </div>
  );
};
