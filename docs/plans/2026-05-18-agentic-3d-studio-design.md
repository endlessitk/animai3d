# agentic-3d-studio — Design Brainstorming Output

**Date:** 2026-05-18
**Output of:** `/brainstorming cinema4d, blender, Maya gibi flagship tüm animasyon programlarındaki tasarım dilini araştır ve var olan yeni tasarım dilimizi bunların doğrultusunda revize et geliştir.`
**Validated design spec:** [`DESIGN_LANGUAGE.md`](../../DESIGN_LANGUAGE.md) (canonical, 14 sections, ~1500 lines)

---

## Goal

Brainstorming oturumu başladığında hedef "C4D + Blender + Maya tasarım dilini araştırıp mevcut C4D-only `DESIGN_LANGUAGE.md`'yi revize etmek"ti. Oturum içinde kullanıcı **major pivot** verdi: projenin kimliğini **2D animation studio → AI-native 3D DCC** olarak değiştirdi.

Bu doküman, brainstorming yolculuğunu (kararlar, alternatifler, ertelenmiş sorular, sırada ne var) kayıt altına alır. Canonical spec ayrı dosyada (`DESIGN_LANGUAGE.md`); bu doküman onun **gerekçe geçmişi**.

---

## Key decisions

| # | Karar | Alternatifler | Neden bu seçim |
|---|---|---|---|
| 1 | **Pivot: 2D → AI-native 3D DCC** | Mevcut 2D studio'da kal | Cinema4D-like agentic viewport hedefi açıkça netleşti; 2D bağlamı projenin uzun vadeli kimliğine uygun değildi |
| 2 | **In-place rename**, eskiyi koruma | Yeni klasör + eskiyi bırak, yeni klasör + eskiyi sil, branch-paralel | Tek tarihsel çizgi, mevcut engine/runtime/AI-task kodu git'te yeniden kullanılabilir |
| 3 | **İsim: agentic-3d-studio** | ai-3d-dcc, neural-dcc | Agentic kimliği açık + studio DCC terimi tanıdık |
| 4 | **Render engine: Three.js + R3F + drei** | Babylon.js, WebGPU raw, PlayCanvas/Filament | React-first uyum, AI agent senaryosuna en uygun (declarative scene = kolay JSON mutate), en hızlı MVP, en büyük topluluk, mevcut PlaybackController pattern doğrudan kullanılır |
| 5 | **MVP scope: Full DCC Vision (12-16 hafta)** | Minimal viewport / + asset / karakter animasyon | Tasarım dili spec'i tüm component aileleri için tek seferde çıksın; implementasyon kademeli |
| 6 | **Tasarım dili: best-of-breed sentez** (kullanıcı revize: Houdini + Modo + Unreal + Unity dahil) | C4D-baseline only, Blender-first, minimum-viable | 7-tool sentez en zengin pattern havuzu + her boyutta en iyi örneği seçme esnekliği |
| 7 | **Update strategy: tek dosya rewrite** | v2 yan dosya, modular split, önce araştırma raporu | Tek source of truth, ileride okuması kolay |
| 8 | **Component model: Unity GameObject + Component** | Inheritance hierarchy, ECS pure | AI agent için JSON serialization en uygun, Inspector stack pattern hazır |
| 9 | **Hotkey baseline: Maya WERS + Blender alias** | Maya only, Blender only | Mainstream 3D artist tanıdık + Blender community alias erişimi |
| 10 | **Transform Reference × Pivot ayrı dropdowns** | Birleştir | Modo Action Center DNA — eksen/uzay ve dönüş merkezi farklı kavramlar |
| 11 | **Tag system: Outliner row inline strip** | Ayrı tag paneli | C4D DNA, daha kompakt, tek tıkla component'a scroll |
| 12 | **Inspector MVP: tek Component Stack** | Blender Properties tab kolonu MVP'de | Unity DNA daha kompakt; Properties tabs V2'de scope/filter olarak gelir |
| 13 | **AgentMetadataComponent only on agent-touched objects** | Her objede default | Human-created'da boş kart UX karmaşıklığı yaratır |
| 14 | **Time editor MVP: tek-sekme swap** | Default split | Daha basit MVP; split V2 preset olarak |
| 15 | **Validation panel default GİZLİ** | Sürekli açık-collapsed, critical auto-open | Status badge yeterli; auto-open dikkat dağıtır |
| 16 | **Repair = agent task (çoğu durumda)** | Direkt apply (her zaman) | Diff/review akışı korunur; sadece basit statics direkt |
| 17 | **Motion path basic MVP, editable + onion skin V2** | Hepsi MVP / hepsi V2 | Karakter animasyon temel görsel feedback sağlar; edit complexity V2 |
| 18 | **Provider/Model generic config-driven** | Hardcode (örn. "Sonnet 4.6") | Model versiyonu hızlı eskir; spec model-agnostic kalır |
| 19 | **Halo state önceliği: Error > Warning > Agent > User** | Agent > User | Bozuk obje + agent → kırmızı görsel sinyal daha kritik |
| 20 | **Variants UX: hover ghost + click preview mode + Apply commit + Esc revert** | Hover-direct swap | Preview mode kullanıcı kontrolü verir, kaza önler |

---

## Pivot timeline (session önce vs sonra)

**Önce (oturum başında varsayım):**
- `animation/ai-2d-studio` 2D animation studio MVP
- Remotion-first preview motoru
- SVG scene graph
- Tasarım dili: C4D-only spec (önceki `DESIGN_LANGUAGE.md`)
- Hedef: C4D + Blender + Maya'yı sentezle + 2D-native (Toon Boom, Spine, Rive) pattern'leri ekle

**Sonra (oturum çıktısı):**
- `animation/agentic-3d-studio` (rename pending) AI-native 3D DCC
- Three.js + R3F + drei
- 3D scene graph + Component model (Unity DNA)
- Tasarım dili: 7-tool sentez (C4D + Blender + Maya + Houdini + Modo + Unreal + Unity)
- Hedef: Cinema4D-like agentic viewport MVP, sonra Full DCC Vision

---

## Open questions deferred to implementation

Bu sorular tasarım fazında **explicit olarak ertelendi** — implementasyona kadar karar veriyoruz:

1. **Pie menu MVP trigger:** Q tap + RMB hold ikisi de mi sadece Q mu? — Spec'te ikisi de; implementasyon basit (300ms RMB timer).
2. **Action Graph UI:** V2 feature flag arkasında; MVP'de minimal liste view; full Houdini-style graph UI V2.
3. **Multi-pane viewport split:** Mimari MVP'de hazır, kullanıcıya UI exposure V2.
4. **Panel detach floating windows:** drei `<Html>` veya portal-based; MVP'de toggle dock, V2'de floating.
5. **Tauri/Electron native chrome:** Web MVP, native V2.
6. **WebGPU migration:** Three.js `WebGPURenderer` deferred; mevcut kod WebGL2 üstünde kalır.

---

## Implementation roadmap

**Sprint 0 — Migration (1 hafta):**
- `animation/ai-2d-studio` → `animation/agentic-3d-studio` rename (workspace + package + tüm import path'leri).
- Remotion bağımlılığını ana motor olmaktan çıkar; opsiyonel `src/exporters/remotion-adapter.ts` olarak yan dosyada bırak.
- `pnpm install` clean; `tsc --noEmit` clean.

**Sprint 1 — Engine foundation (2 hafta):**
- 3D schema: `Transform2D → Transform3D`, GameObject + Component refactor.
- R3F `<Canvas>` wrapper, default `<OrbitControls>` + custom Alt-modifier layer.
- Mevcut `PlaybackController` + `TimeController` 3D'ye adapt.
- Single cube + directional light + camera, save/load `studio-data/scene.json`.

**Sprint 2 — Chrome layer (2 hafta):**
- `styles.css` full rewrite using DESIGN_LANGUAGE §2 tokens.
- CSS Grid layout per §1.1.
- App chrome / Workspace switcher / Top toolbar / Sub-toolbar / Sol tool palette / Status bar (per §3, §8).
- Workspace presets (Model / Animate / Rig / Material / Simulate / Render / Script / Agent / Layout…).

**Sprint 3 — Outliner + Inspector (2 hafta):**
- Outliner tree + tag strip + visibility/lock + drag-reorder + search (§5.1-5.5).
- Inspector Component Stack + Add Component flow + 10 field type renderer (§5.6-5.8, §5.11).
- Multi-edit + mixed values + grouped transactions (§5.9).

**Sprint 4 — Viewport tools (2 hafta):**
- Gizmo (drei `<TransformControls>` + custom multi-handle) + 4 mod (Move/Rotate/Scale/Universal) (§4.5).
- Transform Reference × Pivot dropdowns (§4.6).
- Shading modes (§4.4) + Selection halo states (`OutlinePass`) (§4.7).
- Snap + 3D cursor + grid (§4.8-4.9).
- Hotkey + gesture sistemi (§10.1-10.2).

**Sprint 5 — Time editor + Content Browser + Validation (2 hafta):**
- Time editor tek-sekme swap (Timeline/Dopesheet/Curves) + Range slider + transport (§6).
- Outliner ↔ Dopesheet ↔ Inspector sync.
- Motion path basic display.
- Content Browser alt çekmece (§7).
- Validation panel + status badge (§8, §9).

**Sprint 6 — Agent Workbench (2 hafta):**
- 360px sağ dock + 7 accordion (Chat / Tool Call / Scene Diff / Transaction History / Validation / Alternatives / Action Graph mini) (§10.5).
- AI task protocol entegrasyonu (mevcut `agent-tasks/*.json` extend).
- Streaming tool call display.
- Scene diff apply/reject/rollback flow.
- Variants preview mode.

**Sprint 7 — Discoverability + polish (1 hafta):**
- Pie menu + Command palette + Keymap profiles (§10.3-10.6).
- First-run overlay + `?` cheatsheet + tooltip system (§10.7).
- Final lint / build / smoke test.

**Toplam:** 14 hafta — Full DCC Vision MVP.

---

## Files to create / modify

**Yeni:**
- `animation/agentic-3d-studio/` (rename target)
- `src/engine/three/Canvas.tsx` — R3F Canvas wrapper
- `src/engine/three/SceneRenderer3D.tsx` — Object3D traversal
- `src/scene/component/{Transform,Mesh,Material,Camera,Light,Animation,Constraint,Modifier,Tag,AgentMetadata}Component.ts`
- `src/ui/chrome/{AppChrome,WorkspaceSwitcher,TopToolbar,SubToolbar,ToolPalette,StatusBar}.tsx`
- `src/ui/right/{Outliner,OutlinerRow,TagStrip,Inspector,ComponentCard,AddComponentMenu}.tsx`
- `src/ui/time/{TimeEditor,Timeline,Dopesheet,CurveEditor,RangeSlider,Transport}.tsx`
- `src/ui/content/{ContentBrowser,AssetCard,FolderTree}.tsx`
- `src/ui/validation/{ValidationPanel,ValidationRow}.tsx`
- `src/ui/agent/{AgentWorkbench,ChatPanel,ToolCallLog,SceneDiff,TransactionHistory,AlternativesPanel,ActionGraph}.tsx`
- `src/ui/overlay/{PieMenu,CommandPalette,HelpOverlay,FirstRunTour}.tsx`
- `src/state/{useSelection,useTransform,useTime,useAgent}.ts` (Zustand stores)
- `src/styles/{tokens.css,layout.css,components.css}` — DESIGN_LANGUAGE token uygulaması
- `docs/plans/2026-05-18-agentic-3d-studio-design.md` (bu dosya)

**Modifiye:**
- `package.json` name + deps (add: `three`, `@react-three/fiber`, `@react-three/drei`, `postprocessing`, `zustand`, `fuse.js`, `react-dnd`; remove: `remotion` from primary)
- `pnpm-workspace.yaml` (ai-2d-studio → agentic-3d-studio)
- `src/scene/schema.ts` — Transform2D → Transform3D, GameObject + Component
- `src/scene/SceneRenderer.tsx` — SVG → R3F
- `src/engine/runtime/PlaybackController.ts` — 3D adapt
- `src/app/App.tsx` — full layout rewrite per §1.1
- `DESIGN_LANGUAGE.md` (already rewritten 2026-05-18)
- `CLAUDE_HANDOFF.md` — update to reflect pivot

**Silinen (Sprint 0):**
- `src/scene/interpolate.ts` (2D) → replaced by 3D version
- Direct Remotion render path in main → moved to optional adapter

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| R3F + custom hotkey layer çakışması (drei OrbitControls Alt-modifier'ı yiyebilir) | Custom keybind layer dom-level event capture phase'de; OrbitControls'a Alt yakalama opsiyonu disable et |
| Postprocessing OutlinePass çoklu renk performans | Per-state OutlinePass instance, layer-based selective render; FPS düşerse fallback: stencil-based outline |
| Component card stack drag-reorder + Inspector scroll çakışması | `react-dnd` HTML5Backend + scroll lock when dragging |
| Agent task JSON büyük schema değişikliği eski task'ları bozar | Schema versioning (`task.schemaVersion`); migration script eski → yeni |
| Tasarım dili spec MVP'ye sığmaz | §12 MVP scope summary catalog'unu sıkı uygula; V2 özelliklerini feature flag arkasında veya UI'dan gizli tut |
| Maya hotkey learning curve (Blender alışkın kullanıcı) | Settings > Keymap > Blender profile preset; per-action override |

---

## Pointers

- **Canonical spec:** [DESIGN_LANGUAGE.md](../../DESIGN_LANGUAGE.md)
- **Previous handoff (2D era):** [CLAUDE_HANDOFF.md](../../CLAUDE_HANDOFF.md) — needs update post-pivot
- **Memory entry:** `~/.claude/projects/C--Users-serha/memory/project_ai_studio_design.md` (updated 2026-05-18)
- **Brainstorming skill:** `~/.claude/skills/brainstorming/`

---

## Validation

- ☑ 8 spec sections approved by user via incremental review
- ☑ Pivot decisions captured explicitly (this doc + memory)
- ☑ MVP vs V2 scope split documented (DESIGN_LANGUAGE §12)
- ☑ Implementation mapping to Three.js + R3F + drei (DESIGN_LANGUAGE §13)
- ☑ Migration roadmap defined (DESIGN_LANGUAGE §14 + this doc Sprint 0-7)
- ☐ Implementation not yet started — awaiting user "ready to set up for implementation" go-ahead
