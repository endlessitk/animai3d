import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei";
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
  IDENTITY_TRANSFORM_3D,
} from "./schema";

// ── Component → R3F element renderers ───────────────────────────────────────

const renderGeometry = (primitive: MeshPrimitive): React.ReactElement => {
  switch (primitive.kind) {
    case "box":
      return <boxGeometry args={primitive.size} />;
    case "sphere":
      return (
        <sphereGeometry
          args={[
            primitive.radius,
            primitive.widthSegments ?? 32,
            primitive.heightSegments ?? 16,
          ]}
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

// ── GameObject renderer ─────────────────────────────────────────────────────

const transformOf = (components: Component[]): Transform3D => {
  const t = components.find((c) => c.type === "transform");
  return t && t.type === "transform" ? t.transform : IDENTITY_TRANSFORM_3D;
};

type GameObjectNodeProps = {
  object: GameObject;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const GameObjectNode: React.FC<GameObjectNodeProps> = ({ object, selectedId, onSelect }) => {
  if (!object.visible) return null;

  const transform = transformOf(object.components);
  const mesh = findComponent(object, "mesh") as MeshComponent | undefined;
  const material = findComponent(object, "material") as MaterialComponent | undefined;
  const light = findComponent(object, "light") as LightComponent | undefined;
  const isSelected = selectedId === object.id;

  return (
    <group
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
          onClick={(event) => {
            event.stopPropagation();
            onSelect(object.id);
          }}
        >
          {renderGeometry(mesh.primitive)}
          {material
            ? renderMaterial(material.material)
            : <meshStandardMaterial color="#888888" />}
        </mesh>
      )}
      {light && renderLight(light)}
      {isSelected && mesh && <SelectionHalo primitive={mesh.primitive} />}
    </group>
  );
};

// ── Selection halo (Sprint 1 minimal: bbox wireframe in selection orange) ──

const SelectionHalo: React.FC<{ primitive: MeshPrimitive }> = ({ primitive }) => (
  <mesh scale={[1.02, 1.02, 1.02]}>
    {renderGeometry(primitive)}
    <meshBasicMaterial color="#ff8c3b" wireframe />
  </mesh>
);

// ── Active camera resolver ──────────────────────────────────────────────────

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

// ── Public component ────────────────────────────────────────────────────────

export type SceneRenderer3DProps = {
  scene: Scene3D;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Show editor helpers (grid, axes). Hidden in render mode. */
  showHelpers?: boolean;
};

export const SceneRenderer3D: React.FC<SceneRenderer3DProps> = ({
  scene,
  selectedId,
  onSelect,
  showHelpers = true,
}) => {
  const activeCamera = useMemo(() => resolveActiveCamera(scene), [scene]);

  // GameObjects to render in the scene (cameras handled separately).
  const renderableObjects = useMemo(
    () => scene.objects.filter((o) => !findComponent(o, "camera")),
    [scene.objects],
  );

  return (
    <Canvas
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      dpr={[1, 2]}
      style={{ background: scene.background, width: "100%", height: "100%" }}
      onPointerMissed={() => onSelect(null)}
    >
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

      <OrbitControls makeDefault target={[0, 0.5, 0]} />

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

      {renderableObjects.map((object) => (
        <GameObjectNode
          key={object.id}
          object={object}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </Canvas>
  );
};
