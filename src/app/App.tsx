import React, { useCallback, useEffect, useState } from "react";
import { StudioStateProvider } from "../state/studioState";
import { AppShell } from "../ui/AppShell";
import { defaultProject, defaultScene3D } from "../scene/defaultData3d";
import type { Scene3D, StudioProject } from "../scene/schema";
import type { Transaction } from "../state/transactions";
import { createTransaction, resetTransactionCounter } from "../state/transactions";
import { downloadJson, loadJson, saveJson } from "../storage/localStore";
import "./styles.css";

export const App: React.FC = () => {
  const [project] = useState<StudioProject>(() => loadJson("project", defaultProject));
  const [scene, setScene] = useState<Scene3D>(() => loadJson("scene3d", defaultScene3D));
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => saveJson("scene3d", scene), [scene]);
  useEffect(() => saveJson("project", project), [project]);

  const onSceneChange = useCallback(
    (description: string, updater: (s: Scene3D) => Scene3D) => {
      setScene((prev) => updater(prev));
      setTransactions((prev) => [createTransaction(description), ...prev].slice(0, 100));
    },
    [],
  );

  return (
    <StudioStateProvider>
      <AppShell
        project={project}
        scene={scene}
        transactions={transactions}
        onSceneChange={onSceneChange}
        onResetScene={() => {
          setScene(defaultScene3D);
          setTransactions([]);
          resetTransactionCounter();
        }}
        onExportScene={() => downloadJson("scene3d.json", scene)}
      />
    </StudioStateProvider>
  );
};
