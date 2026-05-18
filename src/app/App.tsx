import React, { useEffect, useState } from "react";
import { StudioStateProvider } from "../state/studioState";
import { AppShell } from "../ui/AppShell";
import { defaultProject, defaultScene3D } from "../scene/defaultData3d";
import type { Scene3D, StudioProject } from "../scene/schema";
import { downloadJson, loadJson, saveJson } from "../storage/localStore";
import "./styles.css";

/**
 * App entry — Sprint 2.
 *
 * Owns scene + project state (persisted to localStorage); mounts the
 * StudioStateProvider for chrome state; renders the AppShell.
 *
 * Scene mutation logic (add object, transform edits, multi-edit transactions)
 * graduates to a dedicated store in Sprint 3 when the Inspector becomes
 * editable. For now state stays here to keep the dependency graph flat.
 */
export const App: React.FC = () => {
  const [project] = useState<StudioProject>(() => loadJson("project", defaultProject));
  const [scene, setScene] = useState<Scene3D>(() => loadJson("scene3d", defaultScene3D));

  useEffect(() => saveJson("scene3d", scene), [scene]);
  useEffect(() => saveJson("project", project), [project]);

  return (
    <StudioStateProvider>
      <AppShell
        project={project}
        scene={scene}
        onResetScene={() => setScene(defaultScene3D)}
        onExportScene={() => downloadJson("scene3d.json", scene)}
      />
    </StudioStateProvider>
  );
};
