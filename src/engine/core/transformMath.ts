import type { Transform } from "../../scene/schema";

export const IDENTITY_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1,
};

export const composeTransformString = (transform: Transform): string =>
  `translate(${transform.x} ${transform.y}) rotate(${transform.rotation}) scale(${transform.scaleX} ${transform.scaleY})`;

export const composeCameraTransform = (camera: Transform, width: number, height: number): string => {
  const cx = width / 2;
  const cy = height / 2;
  return `translate(${cx} ${cy}) scale(${camera.scaleX} ${camera.scaleY}) rotate(${-camera.rotation}) translate(${-cx - camera.x} ${-cy - camera.y})`;
};
