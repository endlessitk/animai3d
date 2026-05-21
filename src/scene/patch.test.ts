import { describe, expect, it } from "vitest";
import {
  applySceneOperation,
  applyScenePatch,
  createScenePatch,
  describeOperationDelta,
  validateScenePatch,
} from "./patch";
import { defaultScene3D } from "./defaultData3d";
import { findComponent } from "./schema";

describe("scene patch operations", () => {
  it("applies transform and material operations without mutating the input scene", () => {
    const patch = createScenePatch("Move and recolor", [
      { type: "transform.setField", objectId: "go-cube-primary", field: "position", value: [1, 2, 3] },
      { type: "material.setColor", objectId: "go-cube-primary", color: "#e74c3c" },
    ]);

    const next = applyScenePatch(defaultScene3D, patch);
    const originalCube = defaultScene3D.objects.find((object) => object.id === "go-cube-primary");
    const nextCube = next.objects.find((object) => object.id === "go-cube-primary");

    expect(findComponent(originalCube!, "transform")?.transform.position).toEqual([0, 0.5, 0]);
    expect(findComponent(nextCube!, "transform")?.transform.position).toEqual([1, 2, 3]);
    expect(findComponent(nextCube!, "material")?.material.color).toBe("#e74c3c");
  });

  it("creates path-based animation keyframes", () => {
    const next = applySceneOperation(defaultScene3D, {
      type: "animation.setKeyframe",
      objectId: "go-cube-primary",
      path: "transform.rotation",
      frame: 12,
      value: [0, 1, 0],
      easing: "ease-in-out",
    });

    const cube = next.objects.find((object) => object.id === "go-cube-primary");
    const animation = findComponent(cube!, "animation");
    expect(animation?.tracks[0].path).toBe("transform.rotation");
    expect(animation?.tracks[0].keyframes[0].frame).toBe(12);
  });

  it("applies the Day 1 object, light, and camera operation set", () => {
    const patch = createScenePatch("Day 1 operation set", [
      {
        type: "object.add",
        object: {
          id: "go-test",
          name: "Draft Object",
          visible: true,
          locked: false,
          components: [
            {
              type: "transform",
              transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
            },
          ],
        },
      },
      { type: "object.rename", objectId: "go-test", name: "Committed Object" },
      { type: "light.set", objectId: "go-light-key", field: "intensity", value: 2.5 },
      { type: "camera.set", objectId: "go-camera-main", field: "fov", value: 60 },
    ]);

    const next = applyScenePatch(defaultScene3D, patch);
    const added = next.objects.find((object) => object.id === "go-test");
    const light = next.objects.find((object) => object.id === "go-light-key");
    const camera = next.objects.find((object) => object.id === "go-camera-main");

    expect(added?.name).toBe("Committed Object");
    expect(findComponent(light!, "light")?.intensity).toBe(2.5);
    expect(findComponent(camera!, "camera")?.fov).toBe(60);
  });

  it("blocks invalid patch previews without mutating the input scene", () => {
    const patch = createScenePatch("Disable active camera", [
      { type: "camera.set", objectId: "go-camera-main", field: "active", value: false },
    ]);

    const validation = validateScenePatch(defaultScene3D, patch);
    const originalCamera = defaultScene3D.objects.find((object) => object.id === "go-camera-main");
    const previewCamera = validation.previewScene.objects.find((object) => object.id === "go-camera-main");

    expect(validation.blocked).toBe(true);
    expect(validation.messages[0]).toContain("No camera marked active");
    expect(findComponent(originalCamera!, "camera")?.active).toBe(true);
    expect(findComponent(previewCamera!, "camera")?.active).toBe(false);
  });

  it("stamps agent metadata after applying agent patches", () => {
    const patch = createScenePatch(
      "Agent move",
      [{ type: "transform.setField", objectId: "go-cube-primary", field: "position", value: [2, 2, 2] }],
      { source: "agent", providerId: "mock", modelId: "mock-planner" },
    );

    const next = applyScenePatch(defaultScene3D, patch);
    const cube = next.objects.find((object) => object.id === "go-cube-primary");
    expect(findComponent(cube!, "agentMetadata")?.createdBy?.providerId).toBe("mock");
  });

  it("is idempotent when the same patch is applied twice in a row", () => {
    const patch = createScenePatch("Set position once", [
      { type: "transform.setField", objectId: "go-cube-primary", field: "position", value: [1, 2, 3] },
    ]);
    const once = applyScenePatch(defaultScene3D, patch);
    const twice = applyScenePatch(once, patch);
    expect(findComponent(once.objects.find((o) => o.id === "go-cube-primary")!, "transform")?.transform.position).toEqual([1, 2, 3]);
    expect(findComponent(twice.objects.find((o) => o.id === "go-cube-primary")!, "transform")?.transform.position).toEqual([1, 2, 3]);
  });

  it("validateScenePatch classifies a clean patch as not-blocked with no error messages", () => {
    const patch = createScenePatch("Move only", [
      { type: "transform.setField", objectId: "go-cube-primary", field: "position", value: [0, 1, 0] },
    ]);
    const validation = validateScenePatch(defaultScene3D, patch);
    expect(validation.blocked).toBe(false);
    expect(validation.messages).toEqual([]);
  });
});

// ── Day 2: field-level delta helper ─────────────────────────────────────────

describe("describeOperationDelta", () => {
  it("renders material.color before -> after using the live scene", () => {
    const delta = describeOperationDelta(defaultScene3D, {
      type: "material.setColor",
      objectId: "go-cube-primary",
      color: "#e74c3c",
    });
    const cube = defaultScene3D.objects.find((o) => o.id === "go-cube-primary")!;
    const currentColor = findComponent(cube, "material")?.material.color;
    expect(delta.before).toBe(currentColor);
    expect(delta.after).toBe("#e74c3c");
    expect(delta.label).toContain("material.color");
    expect(delta.kind).toBe("mod");
  });

  it("renders transform.setField with formatted Vec3 before -> after", () => {
    const delta = describeOperationDelta(defaultScene3D, {
      type: "transform.setField",
      objectId: "go-cube-primary",
      field: "position",
      value: [1, 2, 3],
    });
    // default cube position is [0, 0.5, 0]
    expect(delta.before).toBe("[0.00, 0.50, 0.00]");
    expect(delta.after).toBe("[1.00, 2.00, 3.00]");
  });

  it("marks animation.setKeyframe as add when no prior track exists", () => {
    const delta = describeOperationDelta(defaultScene3D, {
      type: "animation.setKeyframe",
      objectId: "go-cube-primary",
      path: "transform.position",
      frame: 10,
      value: [0, 3, 0],
    });
    expect(delta.kind).toBe("add");
    expect(delta.before).toBe("—");
    expect(delta.after).toBe("[0.00, 3.00, 0.00]");
  });

  it("formats light.set scalar field as before -> after", () => {
    const delta = describeOperationDelta(defaultScene3D, {
      type: "light.set",
      objectId: "go-light-key",
      field: "intensity",
      value: 2.5,
    });
    expect(delta.label).toContain("light.intensity");
    expect(delta.after).toBe("2.500");
    expect(delta.kind).toBe("mod");
  });
});
