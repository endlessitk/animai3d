import { useEffect, useMemo, useRef, useState } from "react";
import type { Scene, StudioProject } from "../../scene/schema";
import { evaluateScene, type EvaluatedScene } from "../core/evaluateScene";
import { PlaybackController, type PlaybackState, type PreviewQuality } from "./PlaybackController";

export type ViewportRuntime = {
  controller: PlaybackController;
  state: PlaybackState;
  evaluated: EvaluatedScene;
  evaluationTimeMs: number;
  objectCount: number;
  evaluatedObjectCount: number;
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

const now = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

export const useViewportRuntime = (project: StudioProject, scene: Scene): ViewportRuntime => {
  const controller = useMemo(
    () => new PlaybackController({
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

  const evalTimeRef = useRef(0);
  const evaluated = useMemo(() => {
    const start = now();
    const result = evaluateScene(scene, project, state.frame);
    evalTimeRef.current = now() - start;
    return result;
  }, [scene, project, state.frame]);

  return {
    controller,
    state,
    evaluated,
    evaluationTimeMs: evalTimeRef.current,
    objectCount: scene.objects.length,
    evaluatedObjectCount: evaluated.objects.length,
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
