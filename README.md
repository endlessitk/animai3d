# AnimAI3D

AnimAI3D is an AI-native 3D studio for building and iterating on scene-driven motion work in a DCC-style interface. The current app combines a Three.js viewport, a structured scene graph, timeline controls, and an agent workbench that can propose scene edits before you apply them.

This repository is powered by Vite, React, TypeScript, Three.js, `@react-three/fiber`, and `@react-three/drei`. It is evolving toward a full agentic 3D DCC inspired by tools like Cinema 4D, Blender, Maya, Houdini, Modo, Unreal, and Unity.

## What is in the app today

- Real-time 3D viewport with orbit controls, selectable objects, transform gizmos, grid, and shading modes
- DCC-style chrome with workspace presets for `Model`, `Animate`, `Rig`, `Material`, `Simulate`, `Render`, `Script`, and `Agent`
- Outliner and inspector panels backed by a component-based `Scene3D` schema
- Timeline and transport controls for frame-based playback and seeking
- Agent Workbench with chat, tool-call log, pending scene diff review, and transaction history
- Provider-agnostic agent contracts with serializable scene patches and operation replay
- Path-based animation tracks for transform, material color, light intensity, and camera fields
- Local persistence for project and scene data through browser storage
- JSON export for the active 3D scene
- Legacy Remotion adapter kept in the repo for optional render experiments

## Stack

- React 18
- TypeScript
- Vite 5
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- Optional Remotion tooling for legacy export flows

## Project structure

```text
src/
  agent/                    agent session state + mock agent execution
  app/                      app entry and studio styling
  engine/                   runtime, playback, renderer helpers
  exporters/remotion-adapter/
                            legacy Remotion bridge
  scene/                    schema, default scene data, 3D renderer, sampling
  state/                    studio UI state, undo/redo, transactions, hotkeys
  storage/                  browser persistence helpers
  tasks/                    file-based task helpers
  ui/                       app shell, chrome, panels, overlays, timeline
studio-data/                default project, scene, assets, animation metadata
scripts/                    repo utilities
docs/                       planning and design docs
```

## Data model

The main runtime centers on a structured `Scene3D` document:

- `Scene3D` contains `GameObject[]`
- each `GameObject` owns a list of typed components
- important components include `transform`, `mesh`, `material`, `light`, `camera`, `animation`, and agent metadata

That model makes it straightforward to:

- persist scene state
- diff and review agent-generated edits
- map scene objects into React Three Fiber primitives
- extend the editor without coupling everything to a single monolithic object shape

## Getting started

### Requirements

- Node.js 18+
- pnpm

### Install

```bash
pnpm install
```

### Run the dev server

```bash
pnpm dev
```

The app runs on [http://127.0.0.1:5190](http://127.0.0.1:5190).

### Build

```bash
pnpm build
```

### Type-check

```bash
pnpm typecheck
```

## Useful commands

```bash
pnpm task:new "make the camera orbit the hero object"
pnpm agent:bridge
pnpm legacy:remotion:studio
pnpm legacy:remotion:render
pnpm legacy:remotion:still
```

`pnpm agent:bridge` starts the local bridge stub on `http://127.0.0.1:8787`. The bridge reads `.env.local` using the shape shown in `.env.example`; the app currently uses the in-app mock provider while the OpenAI-compatible adapter is being wired.

## Interaction model

The studio is designed around familiar DCC conventions:

- `Q / W / E / R / T / Y` for core tool switching
- `K` for play and pause
- `F12` for the Agent Workbench
- scene edits flow through transactions so they can be reviewed and undone
- agent changes are intended to be inspectable instead of silently mutating the scene
- pending agent patches are previewed in the viewport before Apply or Reject

## Current status

This repo is beyond the initial viewport foundation and already includes:

- the main chrome shell
- viewport interaction
- outliner and inspector surfaces
- content browser and validation panel scaffolding
- command palette, help overlay, and first-run tour
- a mock agent loop that demonstrates proposed scene edits

Some panels are intentionally partial and a few advanced workflows are still scaffolded rather than fully implemented.

## Roadmap direction

Near-term work is focused on:

- deeper inspector and component authoring workflows
- richer viewport tooling and transform behavior
- stronger animation editing surfaces
- more capable agent planning and execution
- production-grade validation, alternatives, and action graph flows

## Documentation

- [DESIGN_LANGUAGE.md](./DESIGN_LANGUAGE.md) - canonical product and UI direction
- [CLAUDE_HANDOFF.md](./CLAUDE_HANDOFF.md) - implementation handoff and sprint context
- [docs/plans/2026-05-18-agentic-3d-studio-design.md](./docs/plans/2026-05-18-agentic-3d-studio-design.md) - design decisions and roadmap history

## License

No license file is currently included in the repository.
