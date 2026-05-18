import projectJson from "../../studio-data/project.json";
import sceneJson from "../../studio-data/scene.json";
import assetsJson from "../../studio-data/assets.json";
import rigsJson from "../../studio-data/rigs.json";
import animationsJson from "../../studio-data/animations.json";
import type { AnimationClip, Asset, Rig, Scene, StudioProject } from "./schema";

export const defaultProject = projectJson as StudioProject;
export const defaultScene = sceneJson as Scene;
export const defaultAssets = assetsJson as Asset[];
export const defaultRigs = rigsJson as Rig[];
export const defaultAnimations = animationsJson as AnimationClip[];
