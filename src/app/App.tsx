import React, { useCallback, useEffect, useState } from "react";
import { StudioStateProvider } from "../state/studioState";
import { AppShell } from "../ui/AppShell";
import { defaultProject, defaultScene3D } from "../scene/defaultData3d";
import type { Scene3D, StudioProject } from "../scene/schema";
import type { Transaction } from "../state/transactions";
import { createTransaction, resetTransactionCounter } from "../state/transactions";
import { useUndoableScene } from "../state/useUndoable";
import { downloadJson, loadJson, saveJson } from "../storage/localStore";
import "./styles.css";

export const App: React.FC = () => {
  const [project] = useState<StudioProject>(() => loadJson("project", defaultProject));
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [initialScene] = useState<Scene3D>(() => loadJson("scene3d", defaultScene3D));
  const { scene, commit, undo, redo, canUndo, canRedo, reset } = useUndoableScene(initialScene);

  useEffect(() => saveJson("scene3d", scene), [scene]);
  useEffect(() => saveJson("project", project), [project]);

  const onSceneChange = useCallback(
    (description: string, updater: (s: Scene3D) => Scene3D) => {
      commit(updater);
      setTransactions((prev) => [createTransaction(description), ...prev].slice(0, 100));
    },
    [commit],
  );

  const handleUndo = useCallback(() => {
    undo();
    setTransactions((prev) => [createTransaction("Undo"), ...prev].slice(0, 100));
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
    setTransactions((prev) => [createTransaction("Redo"), ...prev].slice(0, 100));
  }, [redo]);

  return (
    <StudioStateProvider>
      <AppShell
        project={project}
        scene={scene}
        transactions={transactions}
        canUndo={canUndo}
        canRedo={canRedo}
        onSceneChange={onSceneChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetScene={() => {
          reset(defaultScene3D);
          setTransactions([]);
          resetTransactionCounter();
        }}
        onExportScene={() => downloadJson("scene3d.json", scene)}
      />
    </StudioStateProvider>
  );
};
