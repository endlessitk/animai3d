import projectJson from "../../studio-data/project.json";
import scene3dJson from "../../studio-data/scene3d.json";
import type { Scene3D, StudioProject } from "./schema";

export const defaultProject = projectJson as StudioProject;
export const defaultScene3D = scene3dJson as Scene3D;
