import React, { useEffect, useState } from "react";
import { SceneRenderer3D } from "../scene/SceneRenderer3D";
import { useViewport3DRuntime } from "../engine/runtime/Viewport3DRuntime";
import type { Component, Scene3D, StudioProject } from "../scene/schema";
import type { Transaction } from "../state/transactions";
import { addComponent } from "../scene/sceneUtils";
import { useStudioState } from "../state/studioState";
import { useGlobalHotkeys } from "../state/useGlobalHotkeys";
import { AppBar } from "./chrome/AppBar";
import { WorkspaceSwitcher } from "./chrome/WorkspaceSwitcher";
import { Toolbar } from "./chrome/Toolbar";
import { SubToolbar } from "./chrome/SubToolbar";
import { ToolPalette } from "./chrome/ToolPalette";
import { StatusBar } from "./chrome/StatusBar";
import { Outliner } from "./panels/Outliner";
import { Inspector } from "./panels/Inspector";
import { AddComponentPopup } from "./panels/AddComponentPopup";
import { ContentBrowser } from "./panels/ContentBrowser";
import { AgentWorkbench } from "./panels/AgentWorkbench";
import { TransportBar } from "./timeline/TransportBar";
import { CommandPalette } from "./CommandPalette";

export type AppShellProps = {
  project: StudioProject;
  scene: Scene3D;
  transactions: Transaction[];
  onSceneChange: (description: string, updater: (s: Scene3D) => Scene3D) => void;
  onResetScene: () => void;
  onExportScene: () => void;
};

export const AppShell: React.FC<AppShellProps> = ({
  project,
  scene,
  transactions,
  onSceneChange,
  onResetScene,
  onExportScene,
}) => {
  const studio = useStudioState();
  const runtime = useViewport3DRuntime(project, scene);
  const frame = Math.round(runtime.state.frame);

  const [addComponentOpen, setAddComponentOpen] = useState(false);

  useGlobalHotkeys({ onPlayPause: runtime.toggle });

  useEffect(() => {
    studio.setFpsHint(runtime.state.measuredFps);
  }, [runtime.state.measuredFps, studio]);

  const shellClass = [
    "app-shell",
    studio.state.agentPanelOpen ? "app-shell--agent-open" : "",
    studio.state.contentBrowserOpen ? "app-shell--content-open" : "",
    studio.state.workspace === "agent" ? "app-shell--workspace-agent" : "",
  ].filter(Boolean).join(" ");

  // Resolve selected object for Add Component popup
  const selectedObj = studio.state.selectedId
    ? scene.objects.find((o) => o.id === studio.state.selectedId)
    : null;

  const handleAddComponent = (component: Component) => {
    if (!studio.state.selectedId) return;
    const id = studio.state.selectedId;
    onSceneChange(`Add ${component.type}`, (s) => addComponent(s, id, component));
  };

  return (
    <div className={shellClass}>
      <AppBar projectName={project.name} onExport={onExportScene} onReset={onResetScene} />
      <WorkspaceSwitcher />
      <Toolbar />
      <SubToolbar />

      <ToolPalette />

      <div className="viewport-area">
        <div className="viewport-canvas">
          <SceneRenderer3D
            scene={scene}
            selectedId={studio.state.selectedId}
            onSelect={studio.setSelected}
          />
          <div className="viewport-overlay viewport-overlay--tl">
            <span>View</span>
            <span className="dim">▾</span>
            <span>Persp</span>
          </div>
          <div className="viewport-overlay viewport-overlay--tr">
            <span className="dim">gnomon</span>
          </div>
          <div className="viewport-overlay viewport-overlay--bl">
            <span className="dim">tool:</span>
            <span>&nbsp;{studio.state.tool}</span>
          </div>
          <div className="viewport-overlay viewport-overlay--br">
            <span className="dim">grid 1.0 cm · {project.width}×{project.height}</span>
          </div>
        </div>
        <TransportBar
          playing={runtime.state.playing}
          loop={runtime.state.loop}
          frame={frame}
          durationInFrames={runtime.state.durationInFrames}
          fps={runtime.state.fps}
          onPlay={runtime.toggle}
          onStop={runtime.stop}
          onNext={runtime.nextFrame}
          onPrev={runtime.prevFrame}
          onGoToStart={runtime.goToStart}
          onGoToEnd={runtime.goToEnd}
          onToggleLoop={() => runtime.setLoop(!runtime.state.loop)}
          onSeek={runtime.seek}
        />
      </div>

      <div className="right-panel">
        <Outliner scene={scene} onSceneChange={onSceneChange} />
        <div style={{ position: "relative" }}>
          <Inspector
            scene={scene}
            onSceneChange={onSceneChange}
            onAddComponentOpen={() => setAddComponentOpen(true)}
          />
          {addComponentOpen && selectedObj && (
            <AddComponentPopup
              existingTypes={selectedObj.components.map((c) => c.type)}
              onAdd={handleAddComponent}
              onClose={() => setAddComponentOpen(false)}
            />
          )}
        </div>
      </div>

      <AgentWorkbench transactions={transactions} />

      {studio.state.contentBrowserOpen && <ContentBrowser />}

      <StatusBar
        scene={scene}
        fps={runtime.state.measuredFps}
        frame={frame}
        durationInFrames={runtime.state.durationInFrames}
        lastTransaction={transactions[0]}
      />

      <CommandPalette />
    </div>
  );
};
