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
