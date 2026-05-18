import React, { useEffect } from "react";
import { SceneRenderer3D } from "../scene/SceneRenderer3D";
import { useViewport3DRuntime } from "../engine/runtime/Viewport3DRuntime";
import type { Scene3D, StudioProject } from "../scene/schema";
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
import { ContentBrowser } from "./panels/ContentBrowser";
import { AgentWorkbench } from "./panels/AgentWorkbench";
import { TransportBar } from "./timeline/TransportBar";
import { CommandPalette } from "./CommandPalette";

export type AppShellProps = {
  project: StudioProject;
  scene: Scene3D;
  onResetScene: () => void;
  onExportScene: () => void;
};

/**
 * AppShell — Sprint 2 chrome layer orchestrator.
 *
 * CSS Grid:
 *   columns: 48 [tool] · 1fr [viewport] · 340 [right] · {0|360|500} [agent]
 *   rows:    28 [appbar] · 30 [workspace] · 36 [toolbar] · 30 [subtoolbar] ·
 *            1fr [viewport+transport] · {0|240} [content] · 22 [status]
 *
 * Agent column = 0 when closed, 360 when open, 500 when the Agent workspace
 * is active (matches §1.3). Content row = 0 unless toggled by the user (or
 * auto-opened when Material workspace is active).
 */
export const AppShell: React.FC<AppShellProps> = ({ project, scene, onResetScene, onExportScene }) => {
  const studio = useStudioState();
  const runtime = useViewport3DRuntime(project, scene);
  const frame = Math.round(runtime.state.frame);

  useGlobalHotkeys({ onPlayPause: runtime.toggle });

  // Push FPS hint into studio state so the status bar reads from a single
  // source instead of receiving a prop drill chain.
  useEffect(() => {
    studio.setFpsHint(runtime.state.measuredFps);
  }, [runtime.state.measuredFps, studio]);

  const shellClass = [
    "app-shell",
    studio.state.agentPanelOpen ? "app-shell--agent-open" : "",
    studio.state.contentBrowserOpen ? "app-shell--content-open" : "",
    studio.state.workspace === "agent" ? "app-shell--workspace-agent" : "",
  ].filter(Boolean).join(" ");

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
          {/* §4.1 corner overlays — Sprint 4 makes them functional */}
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
        <Outliner scene={scene} />
        <Inspector scene={scene} />
      </div>

      <AgentWorkbench />

      {studio.state.contentBrowserOpen && <ContentBrowser />}

      <StatusBar
        scene={scene}
        fps={runtime.state.measuredFps}
        frame={frame}
        durationInFrames={runtime.state.durationInFrames}
      />

      <CommandPalette />
    </div>
  );
};
