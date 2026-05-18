import React, { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, PerspectiveCamera, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import {
  findComponent,
  type CameraComponent,
  type Component,
  type GameObject,
  type LightComponent,
  type MaterialComponent,
  type MaterialDef,
  type MeshComponent,
  type MeshPrimitive,
  type Scene3D,
  type Transform3D,
  type Vec3,
  IDENTITY_TRANSFORM_3D,
} from "./schema";

// ── Gizmo mode ────────────────────────────────────────────────────────────────

export type GizmoMode = "translate" | "rotate" | "scale";

// ── Component → R3F geometry/material/light ──────────────────────────────────

const renderGeometry = (primitive: MeshPrimitive): React.ReactElement => {
  switch (primitive.kind) {
    case "box":
      return <boxGeometry args={primitive.size} />;
    case "sphere":
      return (
        <sphereGeometry
          args={[primitive.radius, primitive.widthSegments ?? 32, primitive.heightSegments ?? 16]}
        />
      );
    case "cylinder":
      return (
        <cylinderGeometry
          args={[
            primitive.radiusTop,
            primitive.radiusBottom,
            primitive.height,
            primitive.radialSegments ?? 16,
          ]}
        />
      );
    case "plane":
      return <planeGeometry args={[primitive.width, primitive.height]} />;
    case "torus":
      return (
        <torusGeometry
          args={[
            primitive.radius,
            primitive.tube,
            primitive.radialSegments ?? 12,
            primitive.tubularSegments ?? 48,
          ]}
        />
      );
  }
};

const renderMaterial = (mat: MaterialDef): React.ReactElement => {
  switch (mat.kind) {
    case "standard":
      return (
        <meshStandardMaterial
          color={mat.color}
          metalness={mat.metalness ?? 0}
          roughness={mat.roughness ?? 0.5}
          emissive={mat.emissive ?? "#000000"}
          emissiveIntensity={mat.emissiveIntensity ?? 0}
        />
      );
    case "basic":
      return <meshBasicMaterial color={mat.color} wireframe={mat.wireframe ?? false} />;
    case "physical":
      return (
        <meshPhysicalMaterial
          color={mat.color}
          metalness={mat.metalness ?? 0}
          roughness={mat.roughness ?? 0.5}
          clearcoat={mat.clearcoat ?? 0}
        />
      );
  }
};

const renderLight = (light: LightComponent): React.ReactElement | null => {
  switch (light.kind) {
    case "directional":
      return (
        <directionalLight
          color={light.color}
          intensity={light.intensity}
          castShadow={light.castShadow ?? false}
        />
      );
    case "point":
      return (
        <pointLight
          color={light.color}
          intensity={light.intensity}
          distance={light.distance ?? 0}
        />
      );
    case "spot":
      return (
        <spotLight
          color={light.color}
          intensity={light.intensity}
          distance={light.distance ?? 0}
          angle={light.angle ?? Math.PI / 6}
        />
      );
    case "ambient":
      return <ambientLight color={light.color} intensity={light.intensity} />;
    case "hemisphere":
      return (
        <hemisphereLight
          color={light.color}
          groundColor={light.groundColor ?? "#000000"}
          intensity={light.intensity}
        />
      );
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const transformOf = (components: Component[]): Transform3D => {
  const t = components.find((c) => c.type === "transform");
  return t && t.type === "transform" ? t.transform : IDENTITY_TRANSFORM_3D;
};

// ── GameObject renderer ───────────────────────────────────────────────────────

type GameObjectNodeProps = {
  object: GameObject;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onRegisterGroup: (id: string, group: THREE.Group | null) => void;
};

const GameObjectNode: React.FC<GameObjectNodeProps> = ({
  object,
  isSelected,
  isMultiSelected,
  onSelect,
  onRegisterGroup,
}) => {
  if (!object.visible) return null;

  const transform = transformOf(object.components);
  const mesh = findComponent(object, "mesh") as MeshComponent | undefined;
  const material = findComponent(object, "material") as MaterialComponent | undefined;
  const light = findComponent(object, "light") as LightComponent | undefined;

  const refCallback = useCallback(
    (group: THREE.Group | null) => {
      onRegisterGroup(object.id, group);
    },
    [object.id, onRegisterGroup],
  );

  return (
    <group
      ref={refCallback}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      name={object.name}
      userData={{ goId: object.id }}
    >
      {mesh && (
        <mesh
          castShadow={mesh.castShadow ?? false}
          receiveShadow={mesh.receiveShadow ?? false}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(object.id, e.ctrlKey || e.metaKey);
          }}
        >
          {renderGeometry(mesh.primitive)}
          {material
            ? renderMaterial(material.material)
            : <meshStandardMaterial color="#888888" />}
        </mesh>
      )}
      {light && renderLight(light)}
      {/* Selection halo — orange for primary, dim for multi */}
      {isSelected && mesh && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          {renderGeometry(mesh.primitive)}
          <meshBasicMaterial color="#ff8c3b" wireframe />
        </mesh>
      )}
      {!isSelected && isMultiSelected && mesh && (
        <mesh scale={[1.015, 1.015, 1.015]}>
          {renderGeometry(mesh.primitive)}
          <meshBasicMaterial color="#ffb84a" wireframe opacity={0.6} transparent />
        </mesh>
      )}
    </group>
  );
};

// ── Active camera resolver ────────────────────────────────────────────────────

type ResolvedCamera = {
  position: [number, number, number];
  fov: number;
  near: number;
  far: number;
} | null;

const resolveActiveCamera = (scene: Scene3D): ResolvedCamera => {
  const camObj = scene.objects.find((o) => {
    const c = findComponent(o, "camera");
    return c?.active === true;
  });
  if (!camObj) return null;
  const cam = findComponent(camObj, "camera") as CameraComponent | undefined;
  if (!cam || cam.kind !== "perspective") return null;
  const t = transformOf(camObj.components);
  return {
    position: t.position,
    fov: cam.fov ?? 45,
    near: cam.near ?? 0.1,
    far: cam.far ?? 200,
  };
};

// ── Inner canvas scene ────────────────────────────────────────────────────────

type SceneContentProps = {
  scene: Scene3D;
  selectedId: string | null;
  selectedIds: string[];
  gizmoMode: GizmoMode | undefined;
  onSelect: (id: string | null, addToSelection?: boolean) => void;
  onTransformCommit: (id: string, transform: Transform3D) => void;
  showHelpers: boolean;
};

const SceneContent: React.FC<SceneContentProps> = ({
  scene,
  selectedId,
  selectedIds,
  gizmoMode,
  onSelect,
  onTransformCommit,
  showHelpers,
}) => {
  const groupRegistry = useRef<Map<string, THREE.Group>>(new Map());
  const [tcTarget, setTcTarget] = useState<THREE.Group | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const registerGroup = useCallback(
    (id: string, group: THREE.Group | null) => {
      if (group) {
        groupRegistry.current.set(id, group);
        if (id === selectedId) setTcTarget(group);
      } else {
        groupRegistry.current.delete(id);
        if (id === selectedId) setTcTarget(null);
      }
    },
    [selectedId],
  );

  // When selectedId changes, look up the already-registered group
  useEffect(() => {
    setTcTarget(selectedId ? groupRegistry.current.get(selectedId) ?? null : null);
  }, [selectedId]);

  const activeCamera = resolveActiveCamera(scene);
  const renderableObjects = scene.objects.filter((o) => !findComponent(o, "camera"));

  const handleTransformMouseUp = () => {
    setIsDragging(false);
    if (!tcTarget || !selectedId) return;
    onTransformCommit(selectedId, {
      position: tcTarget.position.toArray() as Vec3,
      rotation: [tcTarget.rotation.x, tcTarget.rotation.y, tcTarget.rotation.z] as Vec3,
      scale: tcTarget.scale.toArray() as Vec3,
    });
  };

  return (
    <>
      {activeCamera ? (
        <PerspectiveCamera
          makeDefault
          position={activeCamera.position}
          fov={activeCamera.fov}
          near={activeCamera.near}
          far={activeCamera.far}
        />
      ) : (
        <PerspectiveCamera makeDefault position={[4, 3, 6]} fov={45} />
      )}

      <OrbitControls makeDefault target={[0, 0.5, 0]} enabled={!isDragging} />

      {showHelpers && (
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#383838"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#4a9bd4"
          fadeDistance={30}
          fadeStrength={1}
          infiniteGrid={false}
          position={[0, 0.001, 0]}
        />
      )}

      {renderableObjects.map((obj) => (
        <GameObjectNode
          key={obj.id}
          object={obj}
          isSelected={obj.id === selectedId}
          isMultiSelected={selectedIds.includes(obj.id)}
          onSelect={(id, add) => onSelect(id, add)}
          onRegisterGroup={registerGroup}
        />
      ))}

      {tcTarget && gizmoMode && (
        <TransformControls
          object={tcTarget}
          mode={gizmoMode}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleTransformMouseUp}
        />
      )}
    </>
  );
};

// ── Public component ──────────────────────────────────────────────────────────

export type SceneRenderer3DProps = {
  scene: Scene3D;
  selectedId: string | null;
  selectedIds: string[];
  gizmoMode: GizmoMode | undefined;
  onSelect: (id: string | null, addToSelection?: boolean) => void;
  onTransformCommit: (id: string, transform: Transform3D) => void;
  showHelpers?: boolean;
};

export const SceneRenderer3D: React.FC<SceneRenderer3DProps> = ({
  scene,
  selectedId,
  selectedIds,
  gizmoMode,
  onSelect,
  onTransformCommit,
  showHelpers = true,
}) => (
  <Canvas
    gl={{ antialias: true, preserveDrawingBuffer: false }}
    dpr={[1, 2]}
    style={{ background: scene.background, width: "100%", height: "100%" }}
    onPointerMissed={() => onSelect(null)}
  >
    <SceneContent
      scene={scene}
      selectedId={selectedId}
      selectedIds={selectedIds}
      gizmoMode={gizmoMode}
      onSelect={onSelect}
      onTransformCommit={onTransformCommit}
      showHelpers={showHelpers}
    />
  </Canvas>
);
