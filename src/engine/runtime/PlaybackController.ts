import { clampFrame } from "../core/frameContext";
import { TimeController, type TimeControllerOptions } from "./TimeController";

export type PreviewQuality = "low" | "medium" | "high";

export type PlaybackState = {
  frame: number;
  playing: boolean;
  speed: number;
  loop: boolean;
  fps: number;
  durationInFrames: number;
  previewQuality: PreviewQuality;
  lastTickTime: number;
  measuredFps: number;
};

export type PlaybackListener = (state: PlaybackState) => void;

const SMOOTHING = 0.15;

export class PlaybackController {
  private time: TimeController;
  private frame = 0;
  private playing = false;
  private previewQuality: PreviewQuality = "high";
  private rafHandle: number | null = null;
  private lastTimestamp = 0;
  private lastTickTime = 0;
  private measuredFps = 0;
  private listeners = new Set<PlaybackListener>();

  constructor(options: TimeControllerOptions & { previewQuality?: PreviewQuality }) {
    this.time = new TimeController(options);
    this.previewQuality = options.previewQuality ?? "high";
  }

  getState(): PlaybackState {
    return {
      frame: this.frame,
      playing: this.playing,
      speed: this.time.getSpeed(),
      loop: this.time.getLoop(),
      fps: this.time.getFps(),
      durationInFrames: this.time.getDuration(),
      previewQuality: this.previewQuality,
      lastTickTime: this.lastTickTime,
      measuredFps: this.measuredFps,
    };
  }

  getTimeController(): TimeController {
    return this.time;
  }

  subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  setFrame(frame: number) {
    this.frame = clampFrame(frame, this.time.getDuration());
    this.emit();
  }

  nextFrame() {
    this.setFrame(this.frame + 1);
  }

  prevFrame() {
    this.setFrame(this.frame - 1);
  }

  goToStart() {
    this.setFrame(0);
  }

  goToEnd() {
    this.setFrame(this.time.getDuration());
  }

  setSpeed(speed: number) {
    this.time.setSpeed(speed);
    this.emit();
  }

  setLoop(loop: boolean) {
    this.time.setLoop(loop);
    this.emit();
  }

  setPreviewQuality(quality: PreviewQuality) {
    this.previewQuality = quality;
    this.emit();
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.lastTimestamp = 0;
    this.scheduleTick();
    this.emit();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.cancelTick();
    this.emit();
  }

  stop() {
    this.playing = false;
    this.cancelTick();
    this.frame = 0;
    this.emit();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  dispose() {
    this.cancelTick();
    this.listeners.clear();
  }

  private emit() {
    const snapshot = this.getState();
    for (const listener of this.listeners) listener(snapshot);
  }

  private scheduleTick() {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return;
    this.rafHandle = window.requestAnimationFrame(this.tick);
  }

  private cancelTick() {
    if (this.rafHandle !== null && typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(this.rafHandle);
    }
    this.rafHandle = null;
  }

  private tick = (timestamp: number) => {
    if (!this.playing) return;
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      this.lastTickTime = timestamp;
      this.scheduleTick();
      return;
    }
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.lastTickTime = timestamp;

    if (delta > 0) {
      const instantFps = 1 / delta;
      this.measuredFps = this.measuredFps === 0 ? instantFps : this.measuredFps + (instantFps - this.measuredFps) * SMOOTHING;
    }

    const { frame, ended } = this.time.advance(this.frame, delta);
    this.frame = frame;
    if (ended) {
      this.playing = false;
      this.cancelTick();
      this.emit();
      return;
    }
    this.emit();
    this.scheduleTick();
  };
}
