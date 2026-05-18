import React from "react";
import { useCurrentFrame } from "remotion";
import type { Asset, Scene, StudioProject } from "../../scene/schema";
import { evaluateScene } from "../core/evaluateScene";
import { LiveSvgRenderer } from "./LiveSvgRenderer";

export type RemotionSceneRendererProps = {
  scene: Scene;
  project: StudioProject;
  assets: Asset[];
};

export const RemotionSceneRenderer: React.FC<RemotionSceneRendererProps> = ({ scene, project, assets }) => {
  const frame = useCurrentFrame();
  const evaluated = evaluateScene(scene, project, frame);
  return <LiveSvgRenderer evaluated={evaluated} assets={assets} showGrid={false} showGizmos={false} />;
};
