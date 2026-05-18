import type { Scene, StudioProject, Transform } from "../../scene/schema";
import { IDENTITY_TRANSFORM } from "./transformMath";
import { createFrameContext, type FrameContext } from "./frameContext";
import { evaluateObject, type EvaluatedSceneObject } from "./evaluateObject";

export type EvaluatedCamera = {
  id?: string;
  transform: Transform;
};

export type EvaluatedScene = {
  id: string;
  name: string;
  background: string;
  frame: number;
  width: number;
  height: number;
  fps: number;
  objects: EvaluatedSceneObject[];
  camera: EvaluatedCamera;
};

const pickCamera = (objects: EvaluatedSceneObject[]): EvaluatedCamera => {
  const cam = objects.find((object) => object.type === "camera" && object.visible);
  if (!cam) return { transform: { ...IDENTITY_TRANSFORM } };
  return { id: cam.id, transform: cam.evaluatedTransform };
};

export const evaluateScene = (
  scene: Scene,
  project: StudioProject,
  frame: number,
): EvaluatedScene => {
  const ctx: FrameContext = createFrameContext(project, frame);
  const evaluated = scene.objects.map((object) => evaluateObject(object, ctx));
  const visible = evaluated
    .filter((object) => object.visible && object.type !== "camera")
    .sort((a, b) => a.zIndex - b.zIndex);
  return {
    id: scene.id,
    name: scene.name,
    background: scene.background,
    frame: ctx.frame,
    width: ctx.width,
    height: ctx.height,
    fps: ctx.fps,
    objects: visible,
    camera: pickCamera(evaluated),
  };
};
