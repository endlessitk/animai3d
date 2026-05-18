import { useEffect, useMemo, useState } from "react";
import type { Scene3D, StudioProject } from "../../scene/schema";
import { PlaybackController, type PlaybackState, type PreviewQuality } from "./PlaybackController";

/**
 * 3D viewport runtime — Sprint 1.
 *
 * Sprint 1 keeps the engine-agnostic PlaybackController for frame state +
 * transport, but skips the legacy 2D evaluateScene pipeline. The 3D scene is
 * passed straight through to <SceneRenderer3D /> and rendered by R3F; per-frame
 * animation evaluation (3D keyframes + curves) lands in Sprint 5.
 *
 * `frame` is still exposed so the renderer can drive future per-frame
 * mutations (e.g. cube spin) when wiring keyframes in Sprint 5.
 */
export type Viewport3DRuntime = {
  controller: PlaybackController;
  state: PlaybackState;
  scene: Scene3D;
  objectCount: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggle: () => void;
  seek: (frame: number) => void;
  nextFrame: () => void;
  prevFrame: () => void;
  goToStart: () => void;
  goToEnd: () => void;
  setSpeed: (speed: number) => void;
  setLoop: (loop: boolean) => void;
  setPreviewQuality: (quality: PreviewQuality) => void;
};

export const useViewport3DRuntime = (project: StudioProject, scene: Scene3D): Viewport3DRuntime => {
  const controller = useMemo(
    () =>
      new PlaybackController({
        fps: project.fps,
        durationInFrames: project.durationInFrames,
        loop: true,
        speed: 1,
        previewQuality: "high",
      }),
    // intentionally only construct once per project identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project.id],
  );

  const [state, setState] = useState<PlaybackState>(() => controller.getState());

  useEffect(() => {
    const unsubscribe = controller.subscribe(setState);
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller]);

  useEffect(() => {
    controller.getTimeController().setFps(project.fps);
    controller.getTimeController().setDuration(project.durationInFrames);
  }, [controller, project.fps, project.durationInFrames]);

  return {
    controller,
    state,
    scene,
    objectCount: scene.objects.length,
    play: () => controller.play(),
    pause: () => controller.pause(),
    stop: () => controller.stop(),
    toggle: () => controller.toggle(),
    seek: (frame: number) => controller.setFrame(frame),
    nextFrame: () => controller.nextFrame(),
    prevFrame: () => controller.prevFrame(),
    goToStart: () => controller.goToStart(),
    goToEnd: () => controller.goToEnd(),
    setSpeed: (speed: number) => controller.setSpeed(speed),
    setLoop: (loop: boolean) => controller.setLoop(loop),
    setPreviewQuality: (quality: PreviewQuality) => controller.setPreviewQuality(quality),
  };
};
