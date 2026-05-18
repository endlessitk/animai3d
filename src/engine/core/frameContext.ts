import type { StudioProject } from "../../scene/schema";

export type FrameContext = {
  frame: number;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
};

export const createFrameContext = (project: StudioProject, frame: number): FrameContext => ({
  frame: clampFrame(frame, project.durationInFrames),
  fps: project.fps,
  width: project.width,
  height: project.height,
  durationInFrames: project.durationInFrames,
});

export const clampFrame = (frame: number, durationInFrames: number): number => {
  if (!Number.isFinite(frame)) return 0;
  if (frame < 0) return 0;
  if (frame > durationInFrames) return durationInFrames;
  return frame;
};
