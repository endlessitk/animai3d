import React from "react";
import type { Asset } from "../../scene/schema";
import type { EvaluatedScene } from "../core/evaluateScene";
import type { EvaluatedSceneObject } from "../core/evaluateObject";
import { composeTransformString } from "../core/transformMath";
import type { PreviewQuality } from "../runtime/PlaybackController";
import { cameraToSvgTransform } from "../systems/CameraSystem";
import { gizmosForSelection } from "../systems/GizmoSystem";

const num = (value: unknown, fallback: number) => (typeof value === "number" ? value : fallback);
const str = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);

const ObjectNode: React.FC<{
  object: EvaluatedSceneObject;
  assets: Asset[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  quality: PreviewQuality;
}> = ({ object, assets, selectedId, onSelect, quality }) => {
  const transform = composeTransformString(object.evaluatedTransform);
  const selected = selectedId === object.id;
  const asset = object.assetId ? assets.find((item) => item.id === object.assetId) : undefined;
  const common = {
    transform,
    opacity: object.evaluatedTransform.opacity,
    onMouseDown: (event: React.MouseEvent) => {
      event.stopPropagation();
      onSelect?.(object.id);
    },
    style: { cursor: object.locked ? "not-allowed" : "pointer" },
  };

  let node: React.ReactNode = null;
  if (object.type === "shape") {
    const shape = str(object.evaluatedStyle.shape, "rect");
    const fill = str(object.evaluatedStyle.fill, "#24ff9b");
    const stroke = str(object.evaluatedStyle.stroke, "transparent");
    const strokeWidth = num(object.evaluatedStyle.strokeWidth, 0);
    if (shape === "circle") {
      const useGlow = object.evaluatedStyle.filter === "glow" && quality !== "low";
      node = (
        <circle
          cx={0}
          cy={0}
          r={num(object.evaluatedStyle.radius, 64)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          filter={useGlow ? "url(#studioGlow)" : undefined}
        />
      );
    } else {
      node = (
        <rect
          x={0}
          y={0}
          width={num(object.evaluatedStyle.width, 200)}
          height={num(object.evaluatedStyle.height, 120)}
          rx={num(object.evaluatedStyle.radius, 0)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
  }

  if (object.type === "text") {
    node = (
      <text
        x={0}
        y={0}
        fill={str(object.evaluatedStyle.fill, "#ffffff")}
        fontSize={num(object.evaluatedStyle.fontSize, 42)}
        fontFamily={str(object.evaluatedStyle.fontFamily, "serif")}
        letterSpacing={num(object.evaluatedStyle.letterSpacing, 0)}
      >
        {str(object.evaluatedStyle.text, object.name)}
      </text>
    );
  }

  if (object.type === "svg" && asset?.svg) {
    node = <g dangerouslySetInnerHTML={{ __html: asset.svg }} />;
  }

  if (object.type === "image" && asset?.source) {
    node = (
      <image
        href={asset.source}
        x={0}
        y={0}
        width={num(object.evaluatedStyle.width, 320)}
        height={num(object.evaluatedStyle.height, 220)}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }

  return (
    <g {...common}>
      {node}
      {selected ? (
        <rect
          x={-12}
          y={-12}
          width={num(object.evaluatedStyle.width, 160) + 24}
          height={num(object.evaluatedStyle.height, 120) + 24}
          fill="none"
          stroke="#f7e27c"
          strokeDasharray="8 6"
          strokeWidth={2}
          pointerEvents="none"
        />
      ) : null}
    </g>
  );
};

export type LiveSvgRendererProps = {
  evaluated: EvaluatedScene;
  assets: Asset[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  showGrid?: boolean;
  showGizmos?: boolean;
  className?: string;
  quality?: PreviewQuality;
};

export const LiveSvgRenderer: React.FC<LiveSvgRendererProps> = ({
  evaluated,
  assets,
  selectedId,
  onSelect,
  showGrid = true,
  showGizmos = true,
  className,
  quality = "high",
}) => {
  const cameraTransform = cameraToSvgTransform(evaluated.camera, evaluated.width, evaluated.height);
  const gizmos = showGizmos && selectedId ? gizmosForSelection(evaluated.objects, [selectedId]) : [];
  const gridVisible = showGrid && quality !== "low";

  return (
    <svg
      viewBox={`0 0 ${evaluated.width} ${evaluated.height}`}
      className={className ?? "studio-canvas-svg"}
      onMouseDown={() => onSelect?.("")}
    >
      <defs>
        <filter id="studioGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="18" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="studioGrid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(136, 255, 220, 0.08)" strokeWidth="1" />
          <circle cx="40" cy="40" r="1.2" fill="rgba(136, 255, 220, 0.14)" />
        </pattern>
      </defs>
      <rect width={evaluated.width} height={evaluated.height} fill={evaluated.background} />
      {gridVisible ? <rect width={evaluated.width} height={evaluated.height} fill="url(#studioGrid)" /> : null}
      <g transform={cameraTransform}>
        {evaluated.objects.map((object) => (
          <ObjectNode
            key={object.id}
            object={object}
            assets={assets}
            selectedId={selectedId}
            onSelect={onSelect}
            quality={quality}
          />
        ))}
        {gizmos.map((gizmo) => (
          <g key={gizmo.objectId} pointerEvents="none">
            <rect
              x={gizmo.bounds.x}
              y={gizmo.bounds.y}
              width={gizmo.bounds.width}
              height={gizmo.bounds.height}
              fill="none"
              stroke="#f7e27c"
              strokeDasharray="6 6"
              strokeWidth={1.5}
            />
            {gizmo.handles.map((handle) => (
              <circle
                key={handle.kind}
                cx={handle.x}
                cy={handle.y}
                r={handle.kind === "rotate" ? 7 : 5}
                fill={handle.kind === "move" ? "#f7e27c" : "#24ff9b"}
                stroke="#0a1422"
                strokeWidth={1.5}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
};
