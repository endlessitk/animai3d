import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { defaultAssets, defaultProject, defaultScene } from "../../scene/defaultData";
import { RemotionSceneRenderer } from "../../engine/renderers/RemotionSceneRenderer";

const AI2DStudioComposition: React.FC = () => (
  <AbsoluteFill style={{ background: defaultScene.background }}>
    <RemotionSceneRenderer scene={defaultScene} project={defaultProject} assets={defaultAssets} />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AI2DStudio"
    component={AI2DStudioComposition}
    width={defaultProject.width}
    height={defaultProject.height}
    fps={defaultProject.fps}
    durationInFrames={defaultProject.durationInFrames}
  />
);
