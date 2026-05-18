# agentic-3d-studio — Handoff

> **Status:** Sprint 0 complete (2026-05-18). Project pivoted from 2D animation studio → **AI-native 3D DCC** and extracted from the whale-spot monorepo into its own standalone repo.

## Current Goal

`agentic-3d-studio` is an **AI-native 3D DCC** (Digital Content Creation tool) inspired by Cinema 4D + Blender + Maya + Houdini + Modo + Unreal + Unity. Users orchestrate a real-time 3D scene with AI agents that propose, apply, validate, and roll back transactions through a structured Agent Workbench. The product is built on Three.js + react-three-fiber, with the previous Remotion 2D layer retained as a legacy video-export adapter only.

**Canonical design spec:** [`DESIGN_LANGUAGE.md`](./DESIGN_LANGUAGE.md) — 14 sections, ~1500 lines (visual tokens, layout, components, interaction model, AI-native cues, MVP/V2 scope, Three.js implementation mapping, migration roadmap).

**Brainstorming output / decision log:** [`docs/plans/2026-05-18-agentic-3d-studio-design.md`](./docs/plans/2026-05-18-agentic-3d-studio-design.md) — pivot decisions, alternatives considered, 7-sprint roadmap.

## Repository Context

**Standalone repo root** (no longer inside whale-spot):

```text
C:\Projects\agentic-3d-studio
```

Whale-spot monorepo (former parent) no longer references this project. The `pnpm-workspace.yaml` entry was removed and lockfile refreshed.

## Pivot Summary

| Dimension | Before (2D era) | After (Sprint 0) |
|---|---|---|
| Folder | `whale-spot/animation/ai-2d-studio` | `C:\Projects\agentic-3d-studio` (standalone) |
| Package name | `ai-2d-studio` | `agentic-3d-studio` |
| Version | 0.1.0 | 0.2.0 |
| Render engine | Remotion (SVG composition) | Three.js + react-three-fiber + drei (Sprint 1 implementation) |
| Scene model | 2D `Transform2D { x, y }` | 3D `Transform3D { position, rotation, scale }` + GameObject + Component (Unity DNA, Sprint 1) |
| Tasarım dili | Cinema 4D only | 7-tool sentez (C4D + Blender + Maya + Houdini + Modo + Unreal + Unity) |
| Workspace presets | yok | Model / Animate / Rig / Material / Simulate / Render / Script / Agent / Layout… |
| AI integration | File-based task queue | File-based + in-app Agent Workbench (Chat / Tool Call Log / Scene Diff / Transaction History / Validation / Alternatives / Action Graph) |

## Sprint 0 Completed Work

- ✅ Folder rename: `ai-2d-studio` → `agentic-3d-studio`
- ✅ Move out of monorepo to `C:\Projects\agentic-3d-studio`
- ✅ Removed from `whale-spot/pnpm-workspace.yaml`; whale-spot lockfile refreshed (`-2` packages)
- ✅ `package.json` rewritten: name + version + description; Remotion deps demoted to `optionalDependencies`; scripts renamed `studio`/`render`/`still` → `legacy:remotion:*`
- ✅ Added `pnpm.onlyBuiltDependencies: ["esbuild"]` + `.npmrc` for standalone pnpm install
- ✅ `pnpm approve-builds --all` (esbuild postinstall ran cleanly)
- ✅ `localStorage` key prefix: `ai-2d-studio:` → `agentic-3d-studio:`
- ✅ `studio-data/project.json` renamed (id + name)
- ✅ Standalone install: `pnpm typecheck` + `pnpm build` clean (54 modules transformed, 163.91 kB JS bundle)

## Current Studio Project Structure

```text
C:\Projects\agentic-3d-studio\
├── DESIGN_LANGUAGE.md                  # Canonical design spec (v2 — 2026-05-18)
├── CLAUDE_HANDOFF.md                   # this file
├── package.json                        # standalone, version 0.2.0
├── pnpm-lock.yaml                      # standalone lockfile
├── .npmrc                              # local pnpm config
├── .claude/launch.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── remotion.config.ts                  # LEGACY — kept for optional video export
├── docs/
│   └── plans/
│       └── 2026-05-18-agentic-3d-studio-design.md
├── scripts/
│   └── create-agent-task.mjs
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx                     # 2D shell — TO BE REWRITTEN in Sprint 2
│   │   └── styles.css                  # OLD tokens — TO BE REWRITTEN in Sprint 2
│   ├── assets/
│   ├── editor/                         # empty placeholder
│   ├── remotion/                       # LEGACY — Sprint 1 will move to src/exporters/remotion-adapter/
│   │   ├── index.ts
│   │   └── Root.tsx
│   ├── scene/
│   │   ├── SceneRenderer.tsx           # 2D SVG renderer — Sprint 1 replace with R3F
│   │   ├── defaultData.ts
│   │   ├── interpolate.ts              # 2D — Sprint 1 expand to 3D
│   │   └── schema.ts                   # 2D — Sprint 1 add GameObject + Component
│   ├── storage/
│   │   └── localStore.ts               # PREFIX updated to "agentic-3d-studio:"
│   └── tasks/
│       └── createAgentTask.ts
├── studio-data/
│   ├── project.json                    # id + name updated
│   ├── scene.json
│   ├── assets.json
│   ├── rigs.json
│   ├── animations.json
│   └── history.json
├── agent-tasks/
│   └── .gitkeep
└── public/uploads/
    └── .gitkeep
```

## Standalone Commands

Run from `C:\Projects\agentic-3d-studio`:

```powershell
pnpm install                 # standalone install (no longer needs whale-spot)
pnpm dev                     # vite dev server on http://127.0.0.1:5173
pnpm build                   # production build (Sprint 0 verified clean)
pnpm typecheck               # tsc --noEmit (Sprint 0 verified clean)
pnpm task:new "prompt"       # create agent task JSON

# Legacy Remotion (video export only, optional):
pnpm legacy:remotion:studio  # remotion studio on port 3010
pnpm legacy:remotion:render  # render to mp4
pnpm legacy:remotion:still   # render single frame PNG
```

## Sprint 1 — Next Up (Engine Foundation, ~2 hafta)

Per `docs/plans/2026-05-18-agentic-3d-studio-design.md`:

1. Install Three.js + R3F + drei + postprocessing deps.
2. Refactor `src/scene/schema.ts`: `Transform2D → Transform3D`; introduce `GameObject + Component[]` model.
3. Replace `src/scene/SceneRenderer.tsx` with `src/scene/SceneRenderer3D.tsx` using R3F `<Canvas>` + Object3D traversal.
4. Move `src/remotion/` → `src/exporters/remotion-adapter/` (legacy isolation).
5. Adapt `PlaybackController` / `TimeController` / `ViewportRuntime` for 3D frame evaluation.
6. Render a single primitive cube + directional light + perspective camera; verify save/load roundtrip with `studio-data/scene.json`.
7. `pnpm typecheck` + `pnpm build` clean.

## Sprint 2-7 Roadmap

| Sprint | Scope | Estimate |
|---|---|---|
| 2 | Chrome layer rewrite (CSS Grid + tokens + Workspace/Toolbar/SubToolbar/Tool Palette/Status Bar) | 2 hafta |
| 3 | Outliner + Inspector Component Stack + Add Component flow + multi-edit + grouped transactions | 2 hafta |
| 4 | Viewport tools: gizmo (Move/Rotate/Scale/Universal) + Transform Reference × Pivot + shading modes + halo selection + snap + 3D cursor + hotkey + gesture | 2 hafta |
| 5 | Time editor (Timeline/Dopesheet/Curves tek-sekme swap) + transport + Range slider + Content Browser + Validation panel | 2 hafta |
| 6 | Agent Workbench (Chat / Tool Call Log / Scene Diff / Transaction History / Validation / Alternatives / Action Graph mini) | 2 hafta |
| 7 | Discoverability: pie menu + command palette + keymap profiles + first-run overlay + `?` cheatsheet + final polish | 1 hafta |

**Toplam Full DCC Vision MVP:** ~13-14 hafta (Sprint 0 dahil).

## Important Decisions Locked In

- **Engine:** Three.js + react-three-fiber + drei (decided after detailed comparison vs Babylon, WebGPU raw, PlayCanvas).
- **Hotkey baseline:** Maya WERS (Q/W/E/R/T/Y) + Blender alias (G/Shift+A); `K` = play/pause always; `F12` = Agent Workbench; `Space tap` = focus-aware (viewport=maximize, timeline=play); `Space hold` = Hotbox.
- **Transform Reference** ve **Pivot** ayrı dropdowns — Modo Action Center DNA.
- **Inline tag strip** Outliner row'larında — C4D pattern. Priority: Error > Warning > Agent > Animation > Constraint > Dynamics > Rig > Modifier > Material > Linked > Note.
- **Inspector MVP = tek Component Stack** (Unity DNA). Properties tabs V2.
- **TransformComponent required**; **AgentMetadataComponent only on agent-touched objects**.
- **Halo state önceliği:** Error > Warning > Agent > User.
- **Validation Repair = agent task** (çoğu durumda), basit statics direkt apply.
- **Time editor MVP = tek-sekme swap**; Sequencer V2.
- **Motion path basic** MVP'de; editable + Onion skin V2.
- **Provider/Model generic config-driven** — model isimleri hardcode YASAK.

## Skill Package (needs update)

`C:\Users\serha\.codex\skills\ai-2d-animation-studio` — **NEEDS UPDATE** post-pivot. Currently produces the OLD 2D scaffold via `scripts/create-studio-project.mjs` + `assets/template/`. Renaming + retargeting to `agentic-3d-studio` (3D, Three.js + R3F) is a separate task — not in Sprint 0 scope.

## Memory Reference

`~/.claude/projects/C--Users-serha/memory/project_ai_studio_design.md` — updated 2026-05-18 to reflect pivot + standalone path.

## Caution For Future Claude

- **Do not** revert to 2D animation studio framing. The pivot is decisive and documented.
- **Do not** add `border-radius` / `box-shadow` / gradients to studio chrome (only `--radius-2` 4px for agent pills + viewport vignette).
- **Do not** hardcode model names (e.g., "Sonnet 4.6"). Provider/Model are config-driven.
- **Do not** add color outside the §2.4 accent palette to chrome. The Whale Spot mint/gold are retired from chrome.
- **Do not** rewrite the whole project unless explicitly instructed — Sprint roadmap is incremental.
- **Refer to DESIGN_LANGUAGE.md tokens** for ANY UI work; §13 maps each spec section to R3F/drei components.
- The project is no longer part of whale-spot monorepo — treat it as its own standalone product at `C:\Projects\agentic-3d-studio`.
