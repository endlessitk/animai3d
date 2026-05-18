import { clampFrame } from "../core/frameContext";

export type TimeControllerOptions = {
  fps: number;
  durationInFrames: number;
  loop?: boolean;
  speed?: number;
};

export class TimeController {
  private fps: number;
  private durationInFrames: number;
  private loop: boolean;
  private speed: number;

  constructor(options: TimeControllerOptions) {
    this.fps = Math.max(1, options.fps);
    this.durationInFrames = Math.max(0, options.durationInFrames);
    this.loop = options.loop ?? true;
    this.speed = Math.max(0, options.speed ?? 1);
  }

  setFps(fps: number) {
    this.fps = Math.max(1, fps);
  }

  setDuration(duration: number) {
    this.durationInFrames = Math.max(0, duration);
  }

  setLoop(loop: boolean) {
    this.loop = loop;
  }

  setSpeed(speed: number) {
    this.speed = Math.max(0, speed);
  }

  getFps(): number {
    return this.fps;
  }

  getDuration(): number {
    return this.durationInFrames;
  }

  getLoop(): boolean {
    return this.loop;
  }

  getSpeed(): number {
    return this.speed;
  }

  advance(currentFrame: number, deltaSeconds: number): { frame: number; ended: boolean } {
    if (deltaSeconds <= 0 || this.durationInFrames === 0 || this.speed === 0) {
      return { frame: clampFrame(currentFrame, this.durationInFrames), ended: false };
    }
    const next = currentFrame + deltaSeconds * this.fps * this.speed;
    if (next >= this.durationInFrames) {
      if (this.loop) {
        const span = this.durationInFrames + 1;
        const wrapped = ((next % span) + span) % span;
        return { frame: clampFrame(wrapped, this.durationInFrames), ended: false };
      }
      return { frame: this.durationInFrames, ended: true };
    }
    return { frame: clampFrame(next, this.durationInFrames), ended: false };
  }
}
