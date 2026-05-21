export type CreatedBy = "system" | "user" | "agent";
export type SceneObjectType = "svg" | "shape" | "text" | "image" | "rig" | "camera" | "effect";
export type EasingName = "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring-soft";

export type Transform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
};

export type Keyframe = {
  frame: number;
  property: string;
  value: string | number | boolean;
  easing: EasingName;
};

export type SceneObject = {
  id: string;
  type: SceneObjectType;
  name: string;
  assetId?: string;
  transform: Transform;
  style: Record<string, unknown>;
  keyframes: Keyframe[];
  visible: boolean;
  locked: boolean;
};

export type Scene = {
  id: string;
  name: string;
  background: string;
  objects: SceneObject[];
};

export type Asset = {
  id: string;
  type: "svg" | "image" | "vector-group" | "character" | "rig" | "background" | "effect" | "animation-preset" | "audio-marker";
  name: string;
  createdBy: CreatedBy;
  tags: string[];
  preview?: string;
  source?: string;
  svg?: string;
  editableParams?: string[];
};

export type Rig = {
  id: string;
  name: string;
  assetId?: string;
  bones: Array<{ id: string; name: string; parentId?: string; x: number; y: number; length: number; rotation: number }>;
  handles: Array<{ id: string; boneId: string; x: number; y: number }>;
  constraints: Array<Record<string, unknown>>;
};

export type AnimationClip = {
  id: string;
  name: string;
  targetType?: SceneObjectType;
  keyframes: Keyframe[];
};

export type StudioProject = {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  activeSceneId: string;
};

export type AgentTask = {
  id: string;
  createdAt: string;
  status: "queued" | "in-progress" | "completed" | "blocked" | "failed";
  prompt: string;
  selectedObjectIds: string[];
  desiredAction: string;
  targetFiles: string[];
  acceptanceCriteria: string[];
};

// ────────────────────────────────────────────────────────────────────────────
// 3D Schema (Sprint 1 — Unity DNA: GameObject + Component)
// ────────────────────────────────────────────────────────────────────────────

export type Vec3 = [number, number, number];
export type ColorHex = string;

export type Transform3D = {
  position: Vec3;
  /** Euler rotation in radians (XYZ order). */
  rotation: Vec3;
  scale: Vec3;
};

export const IDENTITY_TRANSFORM_3D: Transform3D = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

// ── Components ──────────────────────────────────────────────────────────────

export type TransformComponent = {
  type: "transform";
  transform: Transform3D;
};

export type MeshPrimitive =
  | { kind: "box"; size: Vec3 }
  | { kind: "sphere"; radius: number; widthSegments?: number; heightSegments?: number }
  | { kind: "cylinder"; radiusTop: number; radiusBottom: number; height: number; radialSegments?: number }
  | { kind: "plane"; width: number; height: number }
  | { kind: "torus"; radius: number; tube: number; radialSegments?: number; tubularSegments?: number };

export type MeshComponent = {
  type: "mesh";
  primitive: MeshPrimitive;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

export type MaterialDef =
  | { kind: "standard"; color: ColorHex; metalness?: number; roughness?: number; emissive?: ColorHex; emissiveIntensity?: number }
  | { kind: "basic"; color: ColorHex; wireframe?: boolean }
  | { kind: "physical"; color: ColorHex; metalness?: number; roughness?: number; clearcoat?: number };

export type MaterialComponent = {
  type: "material";
  material: MaterialDef;
};

export type CameraComponent = {
  type: "camera";
  kind: "perspective" | "orthographic";
  /** Field of view in degrees (perspective). */
  fov?: number;
  near?: number;
  far?: number;
  /** Orthographic zoom (orthographic only). */
  zoom?: number;
  /** Mark as the active camera. Only one camera should set this true. */
  active?: boolean;
};

export type LightComponent = {
  type: "light";
  kind: "directional" | "point" | "spot" | "ambient" | "hemisphere";
  color: ColorHex;
  intensity: number;
  /** Distance attenuation (point/spot). 0 = infinite. */
  distance?: number;
  /** Spot cone angle in radians. */
  angle?: number;
  /** Hemisphere ground color. */
  groundColor?: ColorHex;
  castShadow?: boolean;
};

export type AgentProvenance = {
  /** Generic config-driven — DO NOT hardcode model names here. */
  providerId?: string;
  modelId?: string;
  modelVersion?: string;
  /** ISO 8601 timestamps. */
  createdAt?: string;
  modifiedAt?: string;
  reviewedAt?: string;
  /** Lock authorship: prevents human edits unless explicitly unlocked. */
  locked?: boolean;
};

export type AgentMetadataComponent = {
  type: "agentMetadata";
  createdBy: AgentProvenance | null;
  modifiedBy: AgentProvenance | null;
  reviewedByHuman: boolean;
};

export type TagComponent = {
  type: "tag";
  /** Free-form labels surfaced in the Outliner inline tag strip. */
  labels: string[];
};

// ── Animation ───────────────────────────────────────────────────────────────

export type EasingName3D = "linear" | "step" | "ease-in" | "ease-out" | "ease-in-out";

export type LegacyAnimationProperty = "position" | "rotation" | "scale";

export type AnimationPath =
  | "transform.position"
  | "transform.rotation"
  | "transform.scale"
  | "material.color"
  | "light.intensity"
  | "camera.fov";

export type AnimatableValue = number | boolean | ColorHex | Vec3;

export type AnimationProperty = AnimationPath;

export type Keyframe3D = {
  frame: number;
  value: AnimatableValue;
  easing: EasingName3D;
};

export type AnimationTrack = {
  path: AnimationPath;
  /** Legacy compatibility for locally persisted pre-roadmap scenes. */
  property?: LegacyAnimationProperty;
  keyframes: Keyframe3D[];
};

export type AnimationComponent = {
  type: "animation";
  tracks: AnimationTrack[];
};

export type Component =
  | TransformComponent
  | MeshComponent
  | MaterialComponent
  | CameraComponent
  | LightComponent
  | AgentMetadataComponent
  | TagComponent
  | AnimationComponent;

export type ComponentType = Component["type"];

export type GameObject = {
  id: string;
  name: string;
  parentId?: string;
  visible: boolean;
  locked: boolean;
  /** Component stack — TransformComponent is required and must be at index 0. */
  components: Component[];
};

export type Scene3D = {
  id: string;
  name: string;
  /** Hex background color used as clear color for the WebGL canvas. */
  background: ColorHex;
  /** Optional environment preset name (drei <Environment>) — null for none. */
  environment: string | null;
  objects: GameObject[];
};

// Helpers ───────────────────────────────────────────────────────────────────

export const getTransform = (obj: GameObject): Transform3D => {
  const t = obj.components.find((c): c is TransformComponent => c.type === "transform");
  return t ? t.transform : IDENTITY_TRANSFORM_3D;
};

export const findComponent = <T extends Component["type"]>(
  obj: GameObject,
  type: T,
): Extract<Component, { type: T }> | undefined =>
  obj.components.find((c): c is Extract<Component, { type: T }> => c.type === type);

export const findActiveCamera = (scene: Scene3D): GameObject | undefined =>
  scene.objects.find((o) => {
    const cam = findComponent(o, "camera");
    return cam !== undefined && cam.active === true;
  });
