import fs from "node:fs";
import path from "node:path";

const prompt = process.argv.slice(2).join(" ") || "Create or edit an animation asset.";
const id = `task-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
const task = {
  id,
  createdAt: new Date().toISOString(),
  status: "queued",
  prompt,
  selectedObjectIds: [],
  desiredAction: "studio-edit",
  targetFiles: ["studio-data/scene.json", "studio-data/assets.json"],
  acceptanceCriteria: [
    "Changes are represented in studio-data JSON",
    "Assets remain visible in the studio library",
    "Remotion renderer loads without errors"
  ]
};

const dir = path.resolve("agent-tasks");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${id}.json`);
fs.writeFileSync(file, JSON.stringify(task, null, 2));
console.log(file);
