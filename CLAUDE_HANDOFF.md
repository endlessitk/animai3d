# agentic-3d-studio — Handoff

> **Status:** Sprint 1 complete (2026-05-18). Three.js + R3F + drei wired; GameObject + Component schema live; primitive 3D scene renders with save/load roundtrip. Remotion isolated under `src/exporters/remotion-adapter/`.

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
├── pnpm-lock.yaml
├── .npmrc
├── .claude/launch.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── remotion.config.ts                  # LEGACY (optional video export)
├── docs/plans/2026-05-18-agentic-3d-studio-design.md
├── scripts/create-agent-task.mjs
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx                     # Sprint 1: minimal 3D shell (R3F Canvas + transport)
│   │   └── styles.css                  # Sprint 1: §2 token subset
│   ├── scene/
│   │   ├── schema.ts                   # 2D types (legacy) + 3D GameObject + Component (Sprint 1)
│   │   ├── defaultData.ts              # LEGACY 2D defaults (consumed by remotion-adapter)
│   │   ├── defaultData3d.ts            # 3D defaults — main path
│   │   ├── SceneRenderer.tsx           # LEGACY 2D SVG renderer (unused by main path)
│   │   └── SceneRenderer3D.tsx         # R3F Canvas + GameObject traversal
│   ├── engine/
│   │   ├── core/                       # 2D evaluation (LEGACY — used by remotion-adapter)
│   │   ├── renderers/                  # LiveSvgRenderer + RemotionSceneRenderer (LEGACY)
│   │   ├── runtime/
│   │   │   ├── TimeController.ts       # engine-agnostic frame math
│   │   │   ├── PlaybackController.ts   # engine-agnostic playback + rAF loop
│   │   │   ├── ViewportRuntime.ts      # LEGACY 2D evaluator wrapper
│   │   │   └── Viewport3DRuntime.ts    # 3D: PlaybackController + Scene3D passthrough
│   │   └── systems/                    # 2D selection/transform/keyframe (LEGACY)
│   ├── exporters/
│   │   └── remotion-adapter/           # LEGACY video export entry
│   │       ├── index.ts
│   │       └── Root.tsx
│   ├── assets/
│   ├── storage/localStore.ts
│   └── tasks/createAgentTask.ts
├── studio-data/
│   ├── project.json
│   ├── scene.json                      # 2D scene (LEGACY — remotion-adapter)
│   ├── scene3d.json                    # 3D scene (main path)
│   ├── assets.json / rigs.json / animations.json / history.json
├── agent-tasks/.gitkeep
└── public/uploads/.gitkeep
```

## Standalone Commands

Run from `C:\Projects\agentic-3d-studio`:

```powershell
pnpm install                 # standalone install (no longer needs whale-spot)
pnpm dev                     # vite dev server on http://127.0.0.1:5190 (strictPort)
pnpm build                   # production build (Sprint 0 verified clean)
pnpm typecheck               # tsc --noEmit (Sprint 0 verified clean)
pnpm task:new "prompt"       # create agent task JSON

# Legacy Remotion (video export only, optional):
pnpm legacy:remotion:studio  # remotion studio on port 3010
pnpm legacy:remotion:render  # render to mp4
pnpm legacy:remotion:still   # render single frame PNG
```

## Sprint 1 Completed Work

- ✅ Installed `three@0.184`, `@react-three/fiber@9`, `@react-three/drei@10`, `@types/three`
- ✅ Schema extended with 3D types: `Vec3`, `Transform3D`, `Component` union (transform / mesh / material / camera / light / agentMetadata / tag), `GameObject`, `Scene3D` + helpers (`getTransform`, `findComponent`, `findActiveCamera`)
- ✅ `studio-data/scene3d.json` — primitive scene: perspective camera + directional + ambient light + box mesh + ground plane
- ✅ `src/scene/defaultData3d.ts` — typed loader for 3D project + scene
- ✅ `src/scene/SceneRenderer3D.tsx` — R3F `<Canvas>` with `<PerspectiveCamera>` + `<OrbitControls>` + `<Grid>`; per-GameObject `<group>` traversal mapping components → R3F primitives (mesh/light/material); active camera resolver; selection halo (wireframe orange `#ff8c3b`); `onPointerMissed` deselect
- ✅ `src/engine/runtime/Viewport3DRuntime.ts` — wraps `PlaybackController` for frame transport; skips legacy 2D `evaluateScene` (3D keyframe eval lands in Sprint 5)
- ✅ `src/exporters/remotion-adapter/{index.ts,Root.tsx}` — Remotion moved out of main path; `package.json` `legacy:remotion:*` scripts repointed
- ✅ `src/app/App.tsx` rewritten — minimal 3D shell (CSS Grid topbar / outliner / viewport+transport / inspector / status bar) using DESIGN_LANGUAGE.md tokens (dark grays, no radius, no shadows, Inter); placeholder for Sprint 2 chrome rewrite
- ✅ `src/app/styles.css` rewritten — §2 token subset (`--c-window` `#1f1f1f`, `--c-panel` `#2b2b2b`, accents only on selection orange + agent purple + axis blue scrubber)
- ✅ `pnpm typecheck` clean
- ✅ `pnpm build` clean (606 modules, 1.07 MB JS — code-splitting deferred to Sprint 7)
- ✅ `pnpm dev` boots in ~220ms

**Save/load roundtrip:** App seeds from `defaultScene3D`, mutates persist to `localStorage["agentic-3d-studio:scene3d"]`, "Reset" button restores the seed. Verified manually via `loadJson` / `saveJson` wiring in `App.tsx:21,23-24`.

## Sprint 2 — Next Up (Chrome Layer Rewrite, ~2 hafta)

Per `DESIGN_LANGUAGE.md` §1 (layout grid) + §3 (top chrome) + §9 (status bar):

1. Full CSS Grid shell with zone heights: 28 chrome / 30 workspace / 36 toolbar / 30 sub-toolbar / 1fr viewport+timeline / 240 content browser (collapsible) / 22 status. Sağ panel adaptive 300-520px.
2. Workspace switcher tabs (sol-aligned text): Model / Animate / Rig / Material / Simulate / Render / Script / Agent / Layout… with `Ctrl+1..7` hotkeys.
3. Main toolbar (Q/W/E/R/T/Y tool palette + Transform Reference dropdown + Pivot dropdown — separated per Modo Action Center DNA).
4. Sub-toolbar (workspace-contextual; per-workspace tool params).
5. Status bar (left: scene stats + selection · center: validation badge · right: agent state + provider config).
6. `F12` Agent Workbench toggle stub (panel mount point, content lands Sprint 6).
7. Outliner with C4D-style inline tag strip (Sprint 3 full Inspector; Sprint 2 just the row layout + tag chip primitives).

## Sprint 3-7 Roadmap

| Sprint | Scope | Estimate |
|---|---|---|
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
