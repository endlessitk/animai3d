import { describe, expect, it } from "vitest";
import { sampleAnimation, sampleTrack } from "./animationSampler";
import type { AnimationComponent } from "./schema";

describe("animationSampler", () => {
  it("interpolates Vec3 tracks", () => {
    expect(sampleTrack([
      { frame: 0, value: [0, 0, 0], easing: "linear" },
      { frame: 10, value: [10, 20, 30], easing: "linear" },
    ], 5)).toEqual([5, 10, 15]);
  });

  it("interpolates number tracks", () => {
    expect(sampleTrack([
      { frame: 0, value: 1, easing: "linear" },
      { frame: 10, value: 3, easing: "linear" },
    ], 5)).toBe(2);
  });

  it("interpolates color tracks", () => {
    expect(sampleTrack([
      { frame: 0, value: "#000000", easing: "linear" },
      { frame: 10, value: "#ffffff", easing: "linear" },
    ], 5)).toBe("#808080");
  });

  it("normalizes legacy transform track names", () => {
    const animation = {
      type: "animation",
      tracks: [
        {
          property: "position",
          keyframes: [
            { frame: 0, value: [0, 0, 0], easing: "linear" },
            { frame: 10, value: [10, 0, 0], easing: "linear" },
          ],
        },
      ],
    } as AnimationComponent;

    expect(sampleAnimation(animation, 5)["transform.position"]).toEqual([5, 0, 0]);
  });
});
