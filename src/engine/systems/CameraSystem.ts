import type { EvaluatedCamera } from "../core/evaluateScene";
import { composeCameraTransform, IDENTITY_TRANSFORM } from "../core/transformMath";

export const defaultCamera = (): EvaluatedCamera => ({ transform: { ...IDENTITY_TRANSFORM } });

export const cameraToSvgTransform = (camera: EvaluatedCamera, width: number, height: number): string =>
  composeCameraTransform(camera.transform, width, height);
