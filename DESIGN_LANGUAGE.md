# agentic-3d-studio — Design Language

> **Status:** v2 — 2026-05-18 rewrite. Pivot: 2D animation studio → AI-native 3D DCC.
> **References synthesized from:** Cinema 4D (density baseline), Blender (workspace switcher + pie menu + area splitting), Maya (marking menu + Time/Range slider + WERS hotkeys), Houdini (procedural graph + parameter editor), Modo (Action Center / Transform Reference), Unreal Editor (World Outliner + Sequencer + Play/Simulate/Editor modes + viewport shading), Unity (GameObject + Component data model).
> **Engine:** Three.js + react-three-fiber + drei. WebGL2 baseline; WebGPU migration path via `WebGPURenderer` deferred.
> **Identity:** Professional tool, not consumer app. Density over breathing room. Icons over text. Flat. Sharp. Silent.

---

## 0. Project identity

- **Folder name (after migration):** `animation/agentic-3d-studio`
- **pnpm workspace name:** `agentic-3d-studio`
- **Renderer:** Three.js (`three` ≥ r150) + `@react-three/fiber` + `@react-three/drei`
- **UI shell:** React + TypeScript + Vite
- **Scene data model:** GameObject + Component (Unity DNA) — see §5.6
- **AI agent integration:** File-based task queue (`agent-tasks/*.json`) + in-app Agent Workbench (§10.5)
- **What this REPLACES:** The Whale Spot mint/gold/serif theme is RETIRED from studio chrome. Mint (`#24ff9b`) and gold (`#f7e27c`) remain valid as **scene content colors only** (a user can paint a scene element mint). The previous Remotion-first 2D layer is REPLACED — Remotion is no longer the primary preview engine; an optional export adapter may revive it for frame-perfect video render.

---

## 1. Layout & zone grid

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ⬤⬤⬤  agentic-3d-studio                                                            │  28px App Chrome / Project Bar
├────────────────────────────────────────────────────────────────────────────────────┤
│ Model | Animate | Rig | Material | Simulate | Render | Script | Agent | Layout… + │  30px Workspace switcher
├────────────────────────────────────────────────────────────────────────────────────┤
│ [↶][↷] | [📁][💾] | …workspace contextual icons…    | [🔍][⌘P][🤖][⚙]             │  36px Top toolbar
├────────────────────────────────────────────────────────────────────────────────────┤
│ Mode:Object▾ | Transform:World▾ | Pivot:Median▾ | Snap:Grid▾ ⚡ | Shade:Solid▾ … │  30px Sub-toolbar
├──┬───────────────────────────────────────────────────────┬───────────────┬─────────┤
│  │                                                       │  Outliner     │         │
│ T│  Viewport (1-pane MVP / 2-V / 2-H / 4-pane V2)        │  ▸ Cube       │  Agent  │
│ o│                                                       │  ▸ KeyLight   │  Work-  │
│ o│  Corner overlays:                                     ├───────────────┤  bench  │
│ l│   tl: view▾   tc: camera▾   tr: gnomon                │  Inspector    │  (toggle│
│  │   bl: tool    br: grid+units                          │  ▾ Transform  │  F12)   │
│ P│                                                       │  ▾ Mesh       │         │
│ a│                                                       │  ▾ Material   │         │
│ l│                                                       │  [+ Component]│ 360px   │
│ 48├─────────────────────────────────────────────────────┤  340px        │  (def   │
│  │ Timeline | Dopesheet | Curves   ⏮◀⏵▶⏭ loop key auto │  adaptive:    │  closed)│
│  │ ├──[ruler]──[playhead]─────────┤                    │  min 300      │         │
│  │ range:[ 0 ─────────── 240 ]                          │  pref 360     │         │
│  │                                                      │  max 520      │         │
├──┴──────────────────────────────────────────────────────┴───────────────┴─────────┤
│ ▾Content Browser (alt çekmece, MVP fixed position)                          240px │  collapsible
├────────────────────────────────────────────────────────────────────────────────────┤
│ Object | Hero(1, +3) | tris 24,180  verts 12,090 | 24 MB | 60 FPS | T-042 ●agent │  22px Status bar
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 CSS Grid

```css
grid-template-columns: 48px [tool] 1fr [viewport] minmax(300px, 360px) [right] 0/360px [agent];
grid-template-rows:    28px [chrome] 30px [workspace] 36px [toolbar] 30px [sub-toolbar]
                       1fr  [viewport-and-timeline-split]
                       0/240px [content-browser, collapsible]
                       22px [status];
```

### 1.2 Zone behaviors

| Zone | Px | Resize | Collapse | Float | Notes |
|---|---|---|---|---|---|
| App chrome / project bar | 28 | – | – | – | macOS chrome MVP; native window chrome reserved for future Tauri/Electron |
| Workspace switcher | 30 | – | – | – | Tek tıkla preset swap; çift tıkla rename; `+` ile custom workspace |
| Top toolbar | 36 | – | – | – | Context-sensitive: workspace değişince contextual icon set swap |
| Sub-toolbar / mode bar | 30 | – | – | – | Global (workspace değil mode'a göre değişir). **Compact mode** flag'i ile küçük ekranda overlay/collapsible |
| Tool palette | 48 | – | toggle | yes | Sol kenar; long-press → flyout; çift tıkla detach as floating tool window (V2) |
| Viewport area | 1fr | her yönde | – | – | MVP **1-pane**; 2/4-pane mimari hazır V2; her pane bağımsız camera + view + shading |
| Right panel | 300-520 | yatay | toggle | yes | Outliner (üst, %35) + Inspector (alt, %65); dikey splitter; **adaptive width**: dar genişlikte Vector3 stacked compact |
| Agent Workbench | 360 | yatay | toggle | yes (V2 native window) | Default kapalı; F12 toggle; Agent workspace seçilince auto-open + 500px wide; sağ kenarda dock (MVP'de OS pencere değil) |
| Time editor (timeline çekmecesi) | viewport içinde, 180-300 | dikey | toggle | – | Sekmeli (Timeline/Dopesheet/Curves) + Range slider; MVP tek-sekme swap; Sequencer V2 |
| Content Browser | 240 | dikey | toggle | yes | Alt çekmece (MVP fixed); Material workspace'inde auto-open + Materials tab aktif; sağ/sol dock V2 |
| Status bar | 22 | – | – | – | Sabit alt; mode + active + stats + transaction badge |
| Validation panel | 200 | dikey | toggle | yes | Default tamamen gizli; status badge tıklayınca slide-up; critical error bile auto-open YAPMAZ — badge pulse |

### 1.3 Workspace presets

Her workspace layout state + panel görünürlüğü + top toolbar contextual icon set + default viewport shading swap'ler. **Layout switch instant** (motion-instant) — animasyon yok, sebep: DCC kullanıcısı sık geçer.

| Workspace | Vurgu | Açık paneller | Default shading |
|---|---|---|---|
| **Model** | Geometri | Tool palette, Outliner, Inspector (Mesh component vurgulu) | Solid + Wireframe |
| **Animate** | Hareket | Time editor full-height, Inspector (Animation component vurgulu); Agent Workbench mini | Material |
| **Rig** | Constraint / bone | Outliner (genişletilmiş), Inspector (Constraint stack), bone overlay | X-ray + Solid |
| **Material** | PBR | Inspector (Material vurgulu), Content Browser auto-open (Materials tab aktif, grid view) | Material / Lit |
| **Simulate** | Physics / cloth / particle | Inspector (Physics), Timeline (sim cache controls), validation panel pre-open | Lit |
| **Render** | Output | Render queue panel, Inspector (RenderSettings), preview viewport 1-pane | Lit + Postprocess |
| **Script** | Kod | Code editor (sağda), Console (alt), viewport mini | Solid |
| **Agent** | AI-native | Agent Workbench wide (500px), Inspector mini, Scene diff overlay viewport'a | Agent Heatmap |
| **Layout…** | Custom | Kullanıcı tanımlı: "Save current as workspace" |  |

### 1.4 Multi-viewport split (V2)

- **1-pane** (MVP default): tek perspective camera.
- **2-pane V/H**: dikey/yatay split, her pane bağımsız.
- **4-pane** (Maya QWERTY tarzı): Persp / Front / Side / Top, her pane'in sağ-üst köşesinde mini-toolbar (view dropdown + shading + maximize).
- **Maximize:** `Space tap` pane fullscreen; tekrar `Space tap` restore. **`Space hold` = Hotbox** (radial menü).
- Split bar 4px draggable, hover `--accent-select`.

### 1.5 Panel dock / float / split mekaniği

- Her panelin sağ-üst köşesinde 16×16 menü ikonu: **Expand / Collapse / Float / Close / Split here ▸ (Right/Left/Top/Bottom)**.
- Float'a alınan panel → draggable borderless dark pencere, başlıktan tut.
- Float pencere panelin üstüne sürüklenirse **tab grup** olarak attach (VS Code / Blender style).
- Splitter bar: 4px, hover'da `--accent-select` highlight, cursor `col-resize`/`row-resize`.

---

## 2. Visual tokens

### 2.1 Background palette

```css
--bg-window:        #1f1f1f;  /* OS chrome — C4D'den 2 ton koyu, Unreal'a yakın */
--bg-panel:         #2b2b2b;  /* Sol/sağ paneller, Outliner, Inspector */
--bg-panel-2:       #353535;  /* İç gruplar, Component card header, accordion */
--bg-viewport-top:  #2a2a2a;
--bg-viewport-bot:  #1a1a1a;
--bg-timeline:      #252525;
--bg-status:        #1f1f1f;
--bg-input:         #1a1a1a;
--bg-hover:         #383838;
--bg-active:        #4a4a4a;
--bg-row-alt:       #2e2e2e;  /* Outliner/Content Browser zebra striping */
--bg-overlay:       rgba(0,0,0,0.55);  /* Viewport corner overlays */
--bg-modal:         rgba(15,15,15,0.85);  /* Pie menu, command palette backdrop */
--bg-agent-tint:    #1f1c2c;  /* Agent-generated row subtle tint (mor 5%) */
```

### 2.2 Border / divider

```css
--border-subtle:        #3a3a3a;  /* 1px panel ayırıcıları */
--border-strong:        #4a4a4a;  /* Group header divider */
--border-focus:         #5a78a8;  /* Input focus 1px ring */
--border-splitter:      #1a1a1a;  /* 4px draggable splitter base */
--border-splitter-hover:#ff8c3b;  /* Splitter hover = selection orange */
--border-agent:         #6d4ed8;  /* Agent panel sol kenar 2px accent strip */
```

### 2.3 Text palette

```css
--text-primary:    #d4d4d4;
--text-secondary:  #888888;
--text-active:     #ffffff;
--text-disabled:   #555555;
--text-warning:    #f4c842;
--text-error:      #e74c3c;
--text-success:    #7ab841;
--text-info:       #4a9bd4;
--text-agent:      #a78bfa;
--text-link:       #6db8ff;
```

### 2.4 Accent palette (functional only)

```css
/* 3D axis */
--axis-x:               #e74c3c;
--axis-y:               #7ab841;
--axis-z:               #4a9bd4;

/* Selection & gizmo */
--accent-select:        #ff8c3b;  /* Object outline (orange) */
--accent-active:        #ffb84a;  /* Active object in multi-selection */
--accent-pivot:         #ffd84a;  /* Transform pivot indicator */

/* Tools / state */
--accent-play:          #2ecc71;
--accent-record:        #e74c3c;
--accent-autokey:       #f4c842;
--accent-snap:          #4a9bd4;

/* AI-native */
--accent-agent:         #a78bfa;
--accent-agent-strong:  #8b5cf6;
--accent-pending:       #f4c842;
--accent-applied:       #7ab841;
--accent-rejected:      #e74c3c;
--accent-rollback:      #888888;

/* Timeline & curves */
--accent-playhead:      #4a9bd4;
--accent-keyframe:               #f4c842;  /* standard ◆ */
--accent-keyframe-breakdown:     #4a9bd4;  /* ◇ */
--accent-keyframe-extreme:       #e74c3c;  /* ▲ */
--accent-keyframe-jitter:        #7ab841;  /* ⬢ */
--accent-curve-x:       #e74c3c;
--accent-curve-y:       #7ab841;
--accent-curve-z:       #4a9bd4;

/* Grid & guides */
--grid-floor:           #3a4550;
--grid-major:           #4a5560;
--grid-axis-x:          #c0392b;
--grid-axis-z:          #2980b9;
```

**Yasaklar (studio chrome'da):** Saturasyon > 70% renkler (axis/select/play hariç), neon yeşil/cyan/pink, mint `#24ff9b`, gold `#f7e27c`. Sahne içeriği renklendirmesinde serbest.

### 2.5 Typography

```css
--font-sans: -apple-system, "SF Pro Text", "Inter", "Segoe UI Variable", "Helvetica Neue", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", "Cascadia Code", Consolas, monospace;

--font-xs:  9px;
--font-sm:  10px;
--font-md:  11px;
--font-lg:  12px;
--font-xl:  13px;

font-weight: 400;
line-height: 1.15;
font-variant-numeric: tabular-nums;
```

- Bold YOK, italic YOK, uppercase YOK.
- **JetBrains Mono** önceliği (Bölüm 3 onayı): Inspector expression field, Script workspace, Console, Tool Call Log, Action Graph node label, transaction ID (`T-042`).

### 2.6 Icon system

- **Source:** Lucide icons base set (MIT, ~1400 ikon, 1.25px stroke). Custom 3D-DCC ikonları (gizmo gimbal, IK chain, marking menu, agent badge) elle çizilir aynı standartla.
- **Size scale:** 14×14 (outliner tag, inspector card header), 18×18 (top toolbar), 20×20 (tool palette), 24×24 (workspace tab opsiyonel ikon).
- **Stroke:** 1.25px, monochrome `--text-primary`. Hover → `--text-active`. Aktif/seçili: `--text-active` + `--bg-active` bg.
- **Category dot:** alt-sağ köşede 6×6 dolu daire (Generator → `--accent-applied` yeşil, Light → `--accent-autokey` sarı, Camera → `--accent-playhead` mavi, Audio → `--accent-rejected` kırmızı, Agent → `--accent-agent` mor).
- **Tooltip:** 500ms hover delay.
- **No emoji** in production UI — spec'teki emoji'ler sadece placeholder.

### 2.7 Spacing scale

```css
--space-0: 0;
--space-1: 2px;
--space-2: 4px;
--space-3: 6px;
--space-4: 8px;
--space-5: 12px;
--space-6: 16px;
--space-7: 24px;
```

- Row heights: 20px / **22px (default)** / 26px — Outliner density preference (Compact / Default / Comfortable).
- Toolbar button 28×28, workspace tab 30px, component card header 32px.

### 2.8 Border radius

```css
--radius-0:    0;       /* DEFAULT — her şey köşeli */
--radius-1:    2px;     /* Input focus ring köşesi */
--radius-2:    4px;     /* Agent badge pill, transaction chip, command palette item */
--radius-full: 9999px;  /* Sadece: 6×6 category dot, keyframe diamond rotated */
```

Agent pill ve dot **istisna** — kullanıcının "bu standart UI değil, AI-üretimi" sinyalini almasını sağlar.

### 2.9 Motion / transition

```css
--motion-instant:  0ms;
--motion-fast:     60ms;     /* hover bg */
--motion-medium:   120ms;    /* accordion, dropdown */
--motion-slow:     180ms;    /* agent workbench slide-in/out, panel float */
--motion-easing:   cubic-bezier(0.4, 0.0, 0.2, 1);
```

- Hiçbir scale/rotate/blur chrome'da.
- Spring YOK.
- Pulse/glow YOK. **Agent thinking indicator** tek istisna: chat'te task queued iken 3-dot wave (`opacity 0.3→1`, 800ms loop, 100ms stagger).

---

## 3. Top chrome

### 3.1 App Chrome / Project Bar (28px)

- MVP: web tarayıcı içinde macOS chrome (Tauri/Electron future native).
- Sol: window controls (browser-handled). Orta: project title (`Untitled.scene · agentic-3d-studio`).
- Sağ-üst köşede ileride: sync status, collaborator avatarları (V2).

### 3.2 Workspace switcher (30px, **sol-aligned**)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Model | Animate | Rig | Material | Simulate | Render | Script | Agent | + ⋯ ⚙
└──────────────────────────────────────────────────────────────────────────┘
```

- Tab text-only, `--font-lg`, pasif `--text-secondary`, aktif `--text-active` + 2px alt bordür.
- **Agent workspace aktif:** alt çizgi `--accent-agent` (mor) — environmental cue.
- Padding 8px, 1px `--border-subtle` ayraçlar, agent öncesi ekstra 16px gap.
- **Hotkey:** `Ctrl+1..7` direct switch, `Ctrl+Tab` cycle.
- `+` butonu: custom workspace ekle. `⋯`: workspace menü (rename / duplicate / delete / reset / export JSON). `⚙`: global preferences.
- Drag-reorder destekli; right-click context: pin / hide / duplicate / reset layout.
- **Layout swap instant.**

### 3.3 Top toolbar (36px)

3 segment: **Sol global** | **Orta contextual** | **Sağ utility**.

**Sol global (her workspace):**
- `↶ Undo` / `↷ Redo` (`Ctrl+Z` / `Ctrl+Shift+Z`); long-press → history dropdown (insan gri, agent mor).
- `📁 Open` / `💾 Save` / `🔼 Import` / `🔽 Export`.

**Orta contextual:**

| Workspace | İçerik |
|---|---|
| Model | Add primitive dropdown (cube/sphere/cylinder/plane/torus) · Subdivide (V2: Boolean / Mirror / Array / Loop cut / Bevel) |
| Animate | Set keyframe · Insert breakdown · Auto-key toggle · Motion path toggle · Bake animation · Loop region (V2: Onion skin) |
| Rig | Add bone · Add IK · Constraint dropdown · Bind skin (V2: Paint weights / Mirror rig) |
| Material | New material · Assign · Pick (eyedropper) · Open shader editor |
| Simulate | Add physics body · Cache · Bake · Reset |
| Render | Render still · Render animation · Open render settings · Output path |
| Script | Run · Reload · Open in external · Format · Lint |
| Agent | New conversation · Insert context · Mode (Edit/Plan/Review/Dry-run) · Provider · Model · Token budget · Save transcript |

**Sağ utility:**
- `🔍 Search` (scope: scene + library), `⌘P Command palette`, `🤖 Agent toggle` (aktifken `--accent-agent` halo, pending task sayı rozeti), `⚙ Preferences`.

Segment ayraçları: 12px gap + 1px `--border-subtle` dikey çizgi.

**MVP toolbar sadeleştirilmiş:** Boolean / Loop cut / Paint weights gibi ileri araçlar spec'te ama MVP'ye girmiyor.

### 3.4 Sub-toolbar / Mode bar (30px)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Mode:Object▾ | Transform:World▾ | Pivot:Median▾ | Snap:Grid▾ ⚡ | Shade:Solid▾ | … │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

| Dropdown | Seçenekler | Hotkey |
|---|---|---|
| **Mode** | Object / Edit / Sculpt / Paint / Pose / Agent | `Tab` Object↔Edit; `1..5` direct; `5` = Agent |
| **Transform Reference** (eksen/uzay) | World / Local / Parent / Object / Element / Selection / Selection Center / Active / Camera / Pivot / Custom | `,` cycle next / `.` cycle prev |
| **Pivot** (dönüş merkezi — TR'den ayrı) | Median Point / Individual Origins / 3D Cursor / Active Element / Bounding Box Center / Custom | `Shift+,` cycle |
| **Snap** | Grid / Vertex / Edge / Face / Pivot / World Origin / Increment / Angle (multi). Sağda ⚡ magnet toggle. | `Shift+S` cycle; `X` magnet on/off |
| **Shading** | Wireframe / Solid / Material / Lit / Unlit / Normals / UV / Agent Heatmap / X-ray | `Z` cycle; `Alt+Z` X-ray |
| **View** (pane başına, multi-viewport'ta) | Perspective / Front / Side / Top / Camera / Light POV | Numpad `0/1/3/7` |

- **Compact mode** flag (küçük ekran): bar overlay/collapsible olur.
- **Agent mode aktif:** bar üst kenarda 1px `--accent-agent` strip; dropdown'lar "agent-controlled" rozeti gösterir.

### 3.5 Sol tool palette (48px)

3 grup, 1px ayraç + 4px boşluk:

1. **Selection + Transform:** Select (Q) · Move (W / G) · Rotate (E) · Scale (R) · Universal (T)
2. **Creation:** Pen · Text · Add Primitive ▸ · Camera · Light · Measure
3. **Agent tools:** Agent Tool (5) · (V2: Agent Generate / Agent Validate / Agent Repair)

- Tool button: 32×32 hot zone, 20×20 ikon.
- Aktif tool: `--bg-active` + sol kenar 2px `--accent-select` strip + ikon `--text-active`.
- Long-press (300ms) → flyout sağa açılır (sub-tool list).
- Hover 500ms → tooltip + hotkey pill (`G`, `R`, vb.).
- Mode-dependent enable; ilgisiz tool `--text-disabled`.
- Çift tıkla → detach as floating tool window (V2).

---

## 4. Viewport

### 4.1 Zone anatomy + corner overlays

| Slot | İçerik | Davranış |
|---|---|---|
| `tl` | View dropdown (Perspective / Front / Side / Top / Camera / Light POV) | Numpad direct + dropdown click |
| `tc` | Active camera dropdown | Click switch; çift tıkla → camera settings inspector |
| `tr` | XY gnomon 36×36 (interactive ViewCube benzeri) | Hover axis label, tıkla → view snap |
| `bl` | Active tool label | Mode değişiminde 80ms cross-fade |
| `br` | Grid spacing + units + active pane info | Hover → grid settings dropdown |

Overlay pill: 22px, `padding: 0 8px`, `--bg-overlay`, `--font-sm`, `border-radius: 0`. Multi-pane'de her pane'in kendi seti.

### 4.2 Camera navigation (Maya baseline)

| Aksiyon | Gesture | Alternatif |
|---|---|---|
| Orbit | `Alt+LMB drag` | `MMB drag` (Blender alias) / Numpad 2/4/6/8 |
| Pan | `Alt+MMB drag` | `Shift+MMB drag` / Numpad arrows |
| Dolly (zoom) | `Alt+RMB drag` | `Scroll` / Numpad +/− |
| Frame selected | `F` | Otomatik fit + 1.25× padding |
| Frame all | `A` | — |
| Reset camera | `Home` | — |
| Lock to view | `Numpad 5` | Persp ↔ Ortho toggle |
| Walk mode | `Shift+~` (Unreal) | V2 |

R3F: `<OrbitControls makeDefault enableDamping={false} />` + custom Alt-modifier keybind layer. Damping kapalı — DCC'de instant feel.

### 4.3 Multi-pane split

MVP **1-pane**; mimari 1/2-V/2-H/4-pane'i destekler.

- Pane sağ-üst 16×16 menü: Split V / Split H / Close / Maximize / Lock View.
- **Maximize:** `Space tap`; **Hotbox:** `Space hold` (ayrı davranış).
- Split bar 4px, `--border-splitter` (#1a1a1a), hover `--accent-select`.
- Pane focus: hover'da 1px `--accent-select` strip.

### 4.4 Shading modes (9 mode + 2 toggle)

| Mode | Görünüm | Three.js |
|---|---|---|
| Wireframe | Sadece edge'ler | `material.wireframe = true` |
| Solid (default) | Flat color + basic Lambert | `MeshLambertMaterial` / `MeshBasicMaterial` |
| Material | PBR preview, scene light yok | `MeshStandardMaterial` + viewport ambient |
| Lit | Tam PBR + scene lights + shadows | `MeshStandardMaterial` + scene `<Lights>` |
| Unlit | Material color, no shading | `MeshBasicMaterial` |
| Normals | RGB = XYZ normal | `MeshNormalMaterial` |
| UV | UV map renkli | Custom shader |
| Agent Heatmap | Mor halo agent, gri insan | userData scan + overlay |
| X-ray | Yarı saydam | `transparent + opacity 0.4` (toggle) |

**Toggle:** `Alt+Z` X-ray, `Shift+Z` Wireframe overlay (mode üstüne katmanlı).

### 4.5 Gizmo system

Drei `<TransformControls>` baseline + custom multi-handle. 4 mod: Move / Rotate / Scale / Universal (`T`).

- **Renk-handle:** X `--axis-x` / Y `--axis-y` / Z `--axis-z`; merkez küre `--accent-select`; screen-space outer ring `--accent-pivot`.
- **Handle boyut:** axis arrow 0.6 unit (camera distance auto-scale), arrowhead 0.12 unit; rotate ring 0.7 unit; scale box 0.08 unit; center 0.1 unit.
- **State'ler:**
  - Idle: solid color.
  - Hover: `--text-active` highlight + 1.2× scale + 80ms transition.
  - Dragging: solo handle solid, diğerleri opacity 0.3 + sonsuz axis guide line.
  - Locked axis: `--text-disabled`.
  - Snap active: handle `--accent-snap` flash.

### 4.6 Transform Reference × Pivot (Modo Action Center)

İki dropdown dik eksen. **TR = gizmo orientation**, **Pivot = gizmo position**. Birleştirilmez.

**Transform Reference:** World / Local / Parent / Object / Element / Selection / Selection Center / Active / Camera / Pivot / Custom.

**Pivot:** Median Point / Individual Origins / 3D Cursor / Active Element / Bounding Box Center / Custom.

**Görsel cue:** Individual Origins'te her obje 0.5× gizmo. 3D Cursor: kırmızı/beyaz `+` daire (Blender). Custom pivot: `--accent-pivot` (#ffd84a) küre + label.

### 4.7 Selection + halo state sistemi (4 renk, **çakışma önceliği: Error > Warning > Agent > User**)

Outline 1.5px solid; halo outline'ın 2-3px dışında 8px outer glow.

| State | Outline | Halo (40% opacity) |
|---|---|---|
| User selected | `--accent-select` (orange) | `--accent-playhead` mavi |
| Active object | `--accent-active` (#ffb84a) | mavi + 2px iç bordür ekstra parlak |
| Agent controlled / pending | `--accent-agent` (mor) | mor |
| Validation warning | `--text-warning` (sarı) | sarı |
| Failed / broken | `--text-error` (kırmızı) | kırmızı |
| Hover (not selected) | `--text-secondary` 1px | yok |
| Locked | `--text-disabled` 1px dashed | yok |

Implementation: `EffectComposer` + `OutlinePass` (postprocessing kütüphanesi).

### 4.8 Snap visualization

Drag sırasında snap target'a:
- 8×8 kare `--accent-snap`.
- 1px dashed line gizmo → snap point.
- Snap label pill: `V` vertex, `E` edge, `F` face, `G` grid, `P` pivot.

### 4.9 Grid + 3D cursor

- **Floor grid:** XZ plane, 100cm major (unit cm default). Major `--grid-major`, minor `--grid-floor`. X eksen `--grid-axis-x` (koyu kırmızı), Z eksen `--grid-axis-z` (koyu mavi).
- **3D cursor:** Default origin; `Shift+S` cursor menü; görsel 12×12 kırmızı/beyaz dama daire.
- **Origin indicator:** XYZ axis arrows world origin'de daima (0.3 unit, opacity 0.5).

---

## 5. Right panels

### 5.1 Outliner — yapı

**Header (28px):** 🔍 search · `Filter ▾` · sort · `⋯` menü · `⚙` · `+` add object.

**Density preference:** Compact 20px / **Default 22px** / Comfortable 26px (Settings).

### 5.2 Outliner — row anatomy

```
[indent 12px×depth] ▸/▾ [type-icon 14×14] [name] [tag strip max 4 + N chip] [⚙ on-hover]
```

| Element | Davranış |
|---|---|
| Chevron | Tıkla expand/collapse; Alt+click recursive |
| Type icon | Mesh/Light/Camera/Group/Empty/Bone/Curve; tooltip tip ismi |
| Name | Çift tıkla rename input |
| Tag strip | Inline (right-aligned), 14×14 ikonlar, max 4 + `+N` chip overflow |
| Active gear | Hover'da görünür → context menu (rename / duplicate / delete / group / parent / clear parent / show in viewport / copy path) |

**Visibility/Lock toggle ayrı yerleşim:** her row'da `👁` ve `🔒` 14×14 ikon — tag'lerden ayrı, fix yer. Alt+click solo, Shift+click hierarchy recursive.

### 5.3 Outliner — tag system (C4D DNA, **inline strip**)

Tag'ler obje isminin sağında küçük rozetler. Ayrı tag paneli YOK.

**Tag ailesi + priority (Error > Warning > Agent > Animation > Constraint > Dynamics > Rig > Modifier > Material > Linked > Note):**

| Tag | Icon | Anlam |
|---|---|---|
| 🛑 Error | red stop | Scene validation error |
| ⚠ Warning | yellow tri | Scene validation warning |
| ●agent Agent | mor dot | `AgentMetadataComponent` aktif |
| 🎬 Animation | film | Animation clip var |
| ⚙ Constraint | gear | Constraint var |
| ⚡ Dynamics | bolt | Physics/cloth/particle |
| 🪢 Rig | knot | Armature ilişkili |
| 🔧 Modifier | wrench | Modifier stack |
| 📐 Material | palette | Material atanmış |
| 🔗 Linked | chain | External asset reference |
| 📝 Note | paper | User annotation |

**Etkileşim:**
- **Tek tıkla:** ilgili Inspector component/card'a scroll + 200ms `--accent-select` flash.
- **Alt+click:** ilgili component enable/disable toggle.
- **Right-click:** tag context menu (remove tag / edit / show only tagged in outliner filter / explain).
- **Max 4 görünür**, fazlası `+N` chip → hover'da popover tüm tag listesi.

### 5.4 Outliner — agent metadata cue

1. Row sol kenarı: 2px dikey strip `--accent-agent`.
2. Name color: `--text-agent` mor.
3. Hover bg: `--bg-agent-tint`.
4. Tag strip'te `●agent` rozeti.
5. Hover 800ms → transaction tooltip: `Created by T-042 (Anthropic / opus-4-7) — 'import hero character'`.

**Multi-agent attribution:** Birden fazla agent transaction'ı düzenlemişse rozet `●●●` (kademeli 3 nokta). Hover'da liste.

### 5.5 Outliner — interactions

| Aksiyon | Davranış |
|---|---|
| Tek seçim | LMB click |
| Multi-select | Ctrl/Cmd+click toggle, Shift+click range |
| Drag reorder | 2px `--accent-select` insertion line |
| Drag parent | Drop **üstüne** → child; drop zone highlight `--bg-active` |
| Drag unparent | Sürükle root veya boş alana |
| Group | Ctrl+G |
| Right-click context | rename / duplicate / delete / group / unparent / show in viewport / focus camera / copy path / make agent-controlled / mark for validation |
| Search | Fuzzy match; eşleşmeyen opacity 0.3; parent'lar auto-expand |
| Keyboard nav | ↑↓ navigate; ←→ collapse/expand; Enter rename; Delete remove; Space visibility |

### 5.6 Inspector — Component stack model (Unity DNA)

Obje = `Object3D { id, name, transform }` + N × Component. Inspector seçili obje'nin component'larını dikey stack olarak gösterir.

**Component aileleri:**

```
TransformComponent       (REQUIRED — remove/disable edilemez; sadece reset/copy/paste)
MeshComponent
MaterialComponent        (n × slot)
CameraComponent
LightComponent           (directional / point / spot / area)
AnimationComponent       (clips + state)
ConstraintComponent      (n × constraint; parent / IK / aim / lookat)
ModifierComponent        (stack: subdivision / array / mirror / …)
PhysicsComponent         (V2: rigid body / collider / cloth)
TagComponent             (multi-tag)
AgentMetadataComponent   (only on agent-created/modified objects; manual + via add menu)
ScriptComponent          (V2 — Houdini parameter+expression)
```

**MVP Inspector = tek Component Stack.** Blender Properties tarzı dikey ikon tab kolonu V2; o zaman da scope/filter olarak çalışır (component stack'in yerine geçmez): `Object / Components / Materials / Modifiers / Animation / Physics / Agent / Validation`.

### 5.7 Inspector — Component card anatomi

```
┌─ Component Card ──────────────────────┐
│ ▾ [icon] Component Name        ⚙ ⏻   │  ← header 32px
├───────────────────────────────────────┤
│  Field 1   [value]                    │
│  Field 2   [value]                    │
│  Group ▾                              │
│    Sub-field [value]                  │
└───────────────────────────────────────┘
```

| Element | Davranış |
|---|---|
| `▾/▸` chevron | Collapse/expand; state per-obje localStorage |
| Icon 16×16 | Component type; category dot |
| Name | Çift tıkla optional user label override |
| `⚙` 3-dot menu | Reset / Copy values / Paste values / Remove component / Move up / Move down / Convert to script |
| `⏻` enable toggle | **Power icon / checkbox state** (●agent badge ile karışmasın). Off iken component grayscale + runtime skip. |
| Drag handle | Header sol kenar grab cursor → reorder (Blender Modifier Stack DNA) |
| **Agent stripe** | Component agent tarafından eklendi/düzenlendi ise sol kenar 2px `--accent-agent` strip + header'da `●agent T-NNN` chip |

**TransformComponent special:** Remove/disable yok; sadece `Reset / Copy / Paste`.

### 5.8 Inspector — field types

| Type | Render | Etkileşim |
|---|---|---|
| Number | `[12.5]` | Click edit; drag horizontal scrub; Shift precision; Ctrl+click → expression mode |
| Vector3 | `X[…] Y[…] Z[…]` inline | **Adaptive:** dar genişlikte (panel <340px) stacked compact |
| Color | `[#hex ▣]` | Click → eyedropper + picker (HSV/RGB/hex/preset) |
| Boolean | `[✓]` | Tri-state `[—]` mixed multi-edit |
| Dropdown | `[Selected ▾]` | Popup list + fuzzy search |
| Slider | `━━━●━━ 0.45` | Drag handle; click track; çift tıkla reset |
| File | `[asset.glb 📁]` | Click picker; drag-drop; clear × |
| Expression | `[= sin(time) * 0.5]` mono | Yeşil border valid, kırmızı error |
| Reference | `[→ Hero.Armature ◎]` | Pick mode; viewport/outliner'dan seçim |
| Vector List | `Keyframes: [3 items ▾]` | Expand mini list, +/- |

**Numeric field detay:**
- `--bg-input` bg, 1px transparent border.
- Focus: `--border-focus` 1px.
- Suffix unit: `--text-secondary` küçük (`12.5 cm`, `45 °`, `1.20 m`).
- Drag-scrub hover preview: 1px alt çizgi `--accent-select`.

### 5.9 Inspector — multi-edit + mixed values

- Ortak component'ler gösterilir; tek obje'de olan component → header'da `Mixed` badge.
- Field değerleri farklı: Number `—` italic `--text-secondary`; Color çoklu mini swatch grid + "Multiple"; Boolean tri-state.
- Düzenleme **tüm seçili objelere** uygulanır.
- **Alt+click field** → sadece **active** obje'ye uygula.
- Header `Apply to All Selected ▾` global override modu.

**Transaction üretim:**
- Multi-edit → **grouped transaction**: `affectedObjectIds = [all selected]`, `before/after` per-object saklanır.
- Alt+click active-only → **single-object transaction**.

### 5.10 Inspector — AgentMetadataComponent (only on agent-touched objects)

**Not visible** by default on human-created objects. Otomatik eklenir agent-created veya agent-modified obje'de. Kullanıcı manuel `+ Add Component` ile ekleyebilir.

```
▾ 🤖 AgentMetadata                ⚙ ⏻
  Created by agent  T-042  2026-05-18 14:23
  Modified by agent T-043, T-045
  Reviewed by human serhat  2026-05-18 15:10
  Original Prompt   "import hero character with cyan light"
  Provider          Anthropic
  Model             opus-4-7
  Version           2026.05
  Confidence        ●●●●○  0.82
  Validations       [2 passed, 1 warning ⚠]
  Variants          [A active] [B] [C]
  Re-generate       [↻ Run again]
  Lock Authorship   [○]
```

- **Field davranışları:**
  - Transaction link → Agent Workbench → Transaction History o satır scroll + highlight.
  - **Variants chip dizisi:** hover → ghost thumbnail preview (5sn fade), click → **preview mode** (viewport canlı swap, üst overlay "Previewing variant B"), Apply commit, **Esc original'e döner**.
  - `Re-generate`: aynı prompt + güncel sahne ile yeni transaction kuyruğa.
  - Confidence 5-nokta; hover numeric.
  - **Lock Authorship off:** insan field düzenleyince component stripe insan rengine → `Modified by` listesi büyür, `Reviewed by human` field güncellenir.
- Provider/Model/Version **generic** — hardcode değil; config'ten gelir.

### 5.11 Inspector — Add Component flow

Stack altında sabit `[+ Add Component ▾]`. Click → 2-sütun popup grid (C4D generator pattern):

```
┌────────────────────────────────────┐
│ 🔍 search component…                │
├──────────────────┬─────────────────┤
│ ⊞ Transform     │ 🟦 Mesh          │
│ 🎨 Material     │ 📷 Camera        │
│ 💡 Light         │ 🎬 Animation    │
│ 🔧 Modifier     │ ⚙ Constraint    │
│ 🪢 Armature     │ ⚡ Physics       │
│ 📝 Tag           │ 🤖 AgentMetadata │
│ ─────────────────────────────────  │
│ 📜 Script (expression)             │
└────────────────────────────────────┘
```

Search filter; ↑↓→ navigate, Enter add. Eklenen component stack altına; auto-scroll + 200ms `--accent-select` flash.

---

## 6. Time editor

### 6.1 Sekme yapısı — **MVP tek-sekme swap**

`▾Timeline  ▾Dopesheet  ▾Curves  (▾Sequencer — V2)`

- MVP: sekme tıkla → içerik swap.
- V2: `Shift+click` → side-by-side split.
- **Sequencer (V2):** camera cuts, shot blocks, render ranges, audio track, agent cinematic actions.
- Animate workspace V2 preset: Timeline + Dopesheet, veya Dopesheet + Curves split.

### 6.2 Header — transport + controls (28px)

```
▾Timeline ▾Dopesheet ▾Curves    ⏮ ◀ ⏵/⏸ ▶ ⏭   loop⤺  ⏺AutoKey  ◆Key  Time:30F▾  24fps▾  1.0×▾  ⚙
```

| Control | Hotkey |
|---|---|
| Go to start ⏮ | `Shift+←` / `Home` |
| Prev frame ◀ | `←` |
| Play/Pause ⏵/⏸ | **`K` daima**; `Space tap` timeline focus'ta; `Alt+Space` global |
| Next frame ▶ | `→` |
| Go to end ⏭ | `Shift+→` / `End` |
| Loop region ⤺ | `L` |
| AutoKey | Kapalı `--text-secondary`, açık `--accent-autokey` (#f4c842) |
| Set keyframe ◆Key | `I` insert at playhead |
| Time format dropdown | Frames / Seconds / SMPTE (HH:MM:SS:FF) |
| FPS dropdown | 12/24/25/30/48/60/120/custom |
| Speed multiplier | 0.25/0.5/1/2/4 |
| `⚙` settings | Snap to frame, auto-scroll playhead, motion path settings |

### 6.3 Ruler (24px)

- Tick: her frame 1px, her 5'te 4px, her 10'da label + 6px.
- Zoom: `Ctrl+scroll` / `Ctrl+MMB drag` — dinamik densitiy.
- Playhead: 1px `--accent-playhead`, üstte 8×8 ⬥.
- Drag → scrub (anlık viewport update).
- Hover: 1px hayalet çizgi + frame tooltip.
- **Loop region:** `--accent-playhead 15%` zemin highlight.
- **Markers:** ruler altında 12px strip; renkli noktalar + label; `M` add at playhead, drag taşı.

### 6.4 Dopesheet (per-row keyframe matrix)

**Outliner hierarchy'yi aynalar.** Row sync: **Outliner selection ↔ Dopesheet row selection** çift yönlü; Inspector focused field → Dopesheet ilgili field row highlight.

| Element | Görsel |
|---|---|
| Object row | 22px, ▸/▾ + obj icon + name |
| Component row | 22px, indent 12, `--text-secondary` name |
| Field row | 22px, indent 24, keyframe diamond'lar burada |
| ◆ standart | `--accent-keyframe` (#f4c842) |
| ◇ breakdown | `--accent-keyframe-breakdown` (#4a9bd4) |
| ▲ extreme | `--accent-keyframe-extreme` (#e74c3c) |
| ⬢ jitter | `--accent-keyframe-jitter` (#7ab841) |
| Agent keyframe | Standart shape ama `--accent-agent` mor; hover'da Transaction ID |

**Etkileşimler:** Click select; Shift+click range; B box select; drag horizontal time shift (Shift snap); Shift+D duplicate; Delete; S scale around playhead.

**Right-click context (standart keyframe):** Interpolation (Constant/Linear/Bezier/Spline) · Easing preset · Convert to breakdown · Bake to N frames.

**Right-click context (agent keyframe — ek):** View transaction · Explain why generated · Convert to human keyframe · Lock from agent edits · Regenerate segment.

### 6.5 Curve editor

- 2D curve graph: Y = field value (auto-fit), X = time.
- Curve renkleri axis-aware: TransformPosition.X → `--accent-curve-x`, .Y → -y, .Z → -z; generic → `--accent-keyframe`.
- Keyframe handle: ◆ pivot + 2 bezier tangent (sol/sağ).
- **Tangent modes:** Free / Auto / Vector / Aligned / Flat. Right-click → mode.
- Multi-curve overlay; curve list sol-altta toggle.
- Snap: `Ctrl+drag value` → integer / 0.1 / 0.01.
- **Pre/post extrapolation:** kenar dropdown — Constant / Linear / Cycle / Cycle with Offset / Bounce.

### 6.6 Range slider (24px, ruler altı — Maya DNA)

```
[⟨ 0 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 240 ⟩]      Time: 30 F   1:00 sec
```

- Drag handle → start/end change.
- Tıkla orta drag → window olarak.
- Çift tıkla reset to scene duration.
- Sağda Time + Total.

### 6.7 Motion path (MVP basic) + Onion skin (V2)

**Motion path — MVP basic display:**
- Selected obje için viewport'ta keyframe position trajectory çizgisi.
- Toolbar toggle.
- Renk: `--accent-curve-x/y/z` kombine veya `--text-primary` mono.
- Keyframe noktaları ◆ olarak çizilir.
- **MVP'de editable değil** (3D space'te direkt drag → V2).

**Onion skin — V2:**
- Toolbar toggle (göz).
- Settings: pre-frames, post-frames, color (pre=mavi, post=kırmızı, opacity gradient).
- Mesh siluet kopyaları frame offset'lerle.

---

## 7. Content Browser

```
┌─ Content Browser (alt çekmece, 240px) ────────────────────────────────────────┐
│ All | Meshes | Materials | Textures | Animations | Lights | Cameras | Agent   │  26px tab
├───────────────────────────────────────────────────────────────────────────────┤
│ 🔍 search | ▾filter | ▾sort | ⬚grid/list | + import | ●agent toggle | ⋯       │  28px util
├──┬────────────────────────────────────────────────────────────────────────────┤
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ …                                              │
│📁│ │cube│ │hero│ │tree│ │car │                                                │
│  │ │    │ │●ag │ │    │ │    │                                                │
│ ▾│ └────┘ └────┘ └────┘ └────┘                                                │
└──┴────────────────────────────────────────────────────────────────────────────┘
```

**Pozisyon:** **Alt çekmece** (MVP fixed). Material workspace'inde otomatik açık + Materials tab aktif + grid view. Sağ/sol dock V2.

**Yapı:**
- **Sol folder tree (160px):** hierarchical klasör (`/Meshes/Characters/Hero`, `/Agent_Generated/2026-05-18`). Right-click: New folder / Rename / Delete.
- **Üst tab bar:** All / Meshes / Materials / Textures / Animations / Lights / Cameras / Audio / Agent-Generated. Aktif tab `--text-active` + underline.
- **Util bar:** Search · type filter · sort (Name / Date / Size / Author) · view (grid 96×96 / list 24 row) · Import (file picker) · Agent toggle (`●agent` chip → sadece agent-generated).
- **Asset card (grid 96×96):** Thumbnail · alt isim truncate · sağ-üst tag ikonları (`●agent` / 🔗 linked / ⚠) · hover pill (import / drag / preview / locate).
- **Drag-into-viewport:** ghost preview at drop point.
- **Right-click context:** Rename / Duplicate / Delete / Copy path / Locate on disk / Reimport / **Generate variant (agent)** / Replace selected with this.

**Agent-generated klasör auto-organize:** `/Agent_Generated/YYYY-MM-DD/T-NNN/`. `●agent` toggle aktif → sadece bu hiyerarşi.

---

## 8. Status bar (22px)

```
Object Mode  |  Hero (1 selected, +3 in hierarchy)  |  tris 24,180  verts 12,090  |  24 MB  |  60 FPS  |  T-042 ●agent applied
```

| Bölüm | İçerik | Click |
|---|---|---|
| Mode | `Object Mode` / `Edit Mode` / `Pose Mode` / `Agent Mode` | Mode dropdown |
| Active object | `Hero (1 selected, +3 in hierarchy)` | Frame selected |
| Stats | `tris 24,180 verts 12,090` | Toggle scene-wide stats |
| Memory | `24 MB` (estimated VRAM) | Memory breakdown panel |
| FPS | `60 FPS` (60 altı sarı, 30 altı kırmızı) | Performance overlay |
| Last transaction | `T-042 ●agent applied` chip | Agent Workbench → Transaction History scroll |

**Sol-alt köşede validation badge:** `⚠ 3` veya `🛑 1 ⚠ 2`. Tıkla → Validation drawer toggle. Critical error **otomatik açmaz** — badge `pulse` (3 saykıl, 600ms each).

Renk: default `--text-secondary`; warning chip `--text-warning`; error `--text-error`.

---

## 9. Scene Validation panel (default gizli)

Status bar badge tıklanınca açılır 200px çekmece (Content Browser komşusu). Unreal Message Log + Unity Console DNA.

```
┌─ Validation ────────────────────────────────────────────────────────────┐
│ All | Errors (1) | Warnings (3) | Info |  🔍 filter | Clear |  ⚙       │
├─────────────────────────────────────────────────────────────────────────┤
│ 🛑 Key_Light has no falloff           [Select] [Repair] [Ignore]  T-042 │
│ ⚠ Hero mesh 24k tris (>10k)          [Select] [Optimize]              │
│ ⚠ Material Skin_PBR missing normal   [Select] [Repair]          T-039 │
│ ⚠ Animation "Walk" has no loop       [Select] [Set Loop]              │
│ ℹ Camera Main aspect ratio mismatch  [Select] [Auto-Fit]              │
└─────────────────────────────────────────────────────────────────────────┘
```

**Repair semantik (Bölüm 7 revize 9):**
- **Direkt apply** (basit statik aksiyon): Set Loop · Auto-Fit · Rename duplicate.
- **Agent task** (karmaşık fix): Repair çoğu durumda **small agent task üretir** → Agent Workbench diff flow'una düşer. Kullanıcı diff'i Apply/Reject eder.

**Group by:** Object / Severity / Component / Transaction.

**Validation kaynakları:**
- Statik kurallar (tris, missing materials/textures, hierarchy depth, naming, FPS budget).
- Agent-suggested (transaction validation report ile gelir, `agent-suggested` etiketi).
- Custom rules (V2: user-defined validation scripts).

---

## 10. Interaction model

### 10.1 Hotkey haritası (Maya baseline + Blender alias)

**Global:**
```
Ctrl+S          Save              Ctrl+Z          Undo
Ctrl+Shift+S    Save As           Ctrl+Shift+Z    Redo
Ctrl+O          Open              Ctrl+P          Command palette
Ctrl+N          New scene         Ctrl+1..7       Workspace direct
Ctrl+Tab        Cycle workspaces  F12             Agent Workbench toggle
F11             Maximize app      Alt+Space       Global play/pause
Esc             Cancel / clear selection / close popup
```

**Viewport focus:**
```
Q  Select          1  Object Mode       Numpad 0  Camera view
W  Move (G alias)  2  Edit Mode         Numpad 1  Front
E  Rotate          3  Sculpt            Numpad 3  Side
R  Scale           4  Paint             Numpad 7  Top
T  Universal       5  Pose / Agent      Numpad 5  Persp/Ortho
Y  Last tool       Tab Object↔Edit      Numpad .  Frame sel
B  Box select      
F  Frame sel       A  Frame all / Select all (mode-dependent)
H  Hide            Shift+H  Isolate     Alt+H  Unhide
Z  Cycle shading   Alt+Z  X-ray         Shift+Z  Wireframe overlay
Shift+A  Add menu (pie menu)            X / Delete  Delete
D  Duplicate       Ctrl+D  Linked dup   Ctrl+G  Group        Ctrl+Shift+G  Ungroup
P  Parent          Alt+P  Clear parent
Space (tap)  Maximize pane (viewport focus)
Space (hold) Hotbox
```

**Modifier (gizmo / select / drag):**
```
Shift  Add to selection / Snap-to-grid / Uniform scale
Ctrl   Toggle selection / Precision drag / Step rotate (15°)
Alt    Solo / Recursive / Smooth modifier / Active-only edit
```

**Timeline focus:**
```
K            Play/pause (DAİMA, focus-bağımsız)
Space (tap)  Play/pause (timeline focus'ta)
←/→          Prev/next frame
Shift+←/→    Start/end
,/.          Prev/next keyframe (Blender)
I            Insert keyframe
Shift+I      Insert with interpolation prompt
Alt+I        Delete keyframe
L            Loop region
M            Add marker
[/]          Set start/end of range
```

**Outliner focus:**
```
↑↓  Navigate          ←/→  Collapse/expand        Enter  Rename
F2  Rename            Delete  Remove                Space  Toggle visibility
Ctrl+L  Lock          /  Focus search
```

**Inspector focus:**
```
Tab  Next field       Shift+Tab  Previous field    Enter  Commit value
Esc  Cancel/revert    Ctrl+R  Reset to default     Ctrl+C / V  Copy/paste value
```

**Tool-modal (tool aktif):**
```
X / Y / Z         Constrain to axis        Shift+X/Y/Z  Exclude axis (constrain to plane)
Numbers           Direct numeric input     Enter  Commit                Esc / RMB  Cancel
```

### 10.2 Gesture sistemi

**Viewport (mouse):**

| Gesture | Aksiyon |
|---|---|
| LMB click | Select obje / activate gizmo handle |
| LMB drag (empty) | Marquee select; Shift add, Ctrl toggle |
| LMB drag (gizmo) | Transform |
| MMB drag | Orbit (alias Alt+LMB) |
| Alt+LMB drag | Orbit (Maya baseline) |
| Alt+MMB drag | Pan |
| Alt+RMB drag | Dolly |
| Scroll | Zoom (cursor-anchored) |
| Ctrl+scroll | Zoom finer |
| RMB tap | Context menu |
| RMB hold (300ms) | Marking menu (pie menu — 10.3) |
| Shift+RMB | Place 3D cursor |
| Double-click obje | Enter Edit Mode |
| Double-click empty | Deselect all |

**Outliner:** LMB click (replace); Ctrl/Cmd+LMB (toggle); Shift+LMB (range); LMB drag (reorder/parent); RMB (context); double-click name (rename).

**Trackpad (macOS, MVP):**

| Gesture | Aksiyon |
|---|---|
| 2-finger drag | Pan |
| 2-finger pinch | Zoom |
| 2-finger rotate | Orbit (yatay) |
| 3-finger swipe | Switch workspace |

**Pen/Tablet (V2):** Stylus pressure → brush size; tilt → angle; 2 yan buton modifier (Alt+Shift).

### 10.3 Pie / marking menu sistemi

**Trigger:** `Q tap` veya `RMB hold` (300ms) → 8-yönlü radial menü cursor merkezinde.

```
              N
              │
    NW ──────────── NE
       ╲        ╱
        ╲      ╱
   W ────●────── E    ← center = cancel
        ╱      ╲
       ╱        ╲
    SW ──────────── SE
              │
              S
```

- Drag cursor → highlight segment.
- Release → execute.
- Cancel: Esc veya merkeze release.

**Tool palette pie (`Q`):** N Move · NE Rotate · E Scale · SE Add Primitive · S Select · SW Light · W Camera · NW Pen.

**RMB context pie (object mode):** N Smart Action (agent suggestion) · NE Duplicate · E Group · SE Convert to… · S Properties · SW Frame · W Hide · NW Delete.

**Workspace pies:**
- **Model RMB:** N Bevel · NE Loop cut · E Inset · SE Array · S Mirror · SW Boolean · W Subdivide · NW Extrude.
- **Animate RMB:** N Insert key · NE Easing preset · E Set range · SE Marker · S Delete key · SW Onion skin · W Bake · NW Snap to frame.
- **Agent RMB:** N Ask agent here · NE Generate variant · E Explain · SE Validate · S Show transactions · SW Re-prompt · W Lock from agent · NW Repair.

**Sub-pie:** Segment'te `▸` üçgen → hover sub-pie açılır. Max 2 derinlik (16 alt komut). Daha derin → command palette.

**Customization:** Settings > Keymap > Pie menus → drag-drop slot atama.

### 10.4 Command palette (`Ctrl/Cmd+P`)

```
┌──────────────────────────────────────────────────────────────┐
│ > _                                            [Cmd | Agent ⇄ Tab] │
├──────────────────────────────────────────────────────────────┤
│ ⌥ Set Keyframe                        Animate workspace   I   │
│ ⌥ Insert Breakdown Key                Animate              ⇧I │
│ ⌥ Bake Animation                      Animate                 │
│ ⌥ Apply Easing › Cubic Ease Out       Animate                 │
│ ─────────────────────────────────────────────────────────────│
│ recent:                                                       │
│ ⌥ Add Light › Directional             Model                   │
│ ⌥ Set Material Color                                          │
└──────────────────────────────────────────────────────────────┘
```

**3 mode (Tab geçiş):**
1. **Cmd (`>`):** Komut fuzzy search; tüm action + hotkey + workspace context; Enter execute.
2. **Agent (`?`):** Natural language input; Enter → Agent Workbench'e gönderir + chat'e ekler + palette kapanır; status bar "Agent thinking…".
3. **Search (`/`):** Sahnede + content browser + hierarchy fuzzy search; Enter → jump (Outliner highlight + viewport frame).

**Davranış:**
- ↑↓ navigate, Enter execute, Esc dismiss.
- Mode prefix değiştirilebilir.
- Ranking: recent > workspace-relevant > exact > prefix > sub-string.
- Sağ: hotkey + workspace badge.
- Top-3 recent default görünür.
- **AI-native:** `?` mode'da input'a yazdıkça canlı tool call preview alt-strip'te.

### 10.5 Agent Workbench — detaylı UX

```
┌─ Agent Workbench ──────────────────────────────────────┐
│ Mode:Edit▾ | Provider:Anthropic▾ Model:opus-4-7▾ | ⚙  │  32px üst bar
├────────────────────────────────────────────────────────┤
│ ▾ Chat                                                  │
│ ▾ Tool Call Log                                         │
│ ▾ Scene Diff (T-NNN proposed)                          │
│ ▾ Transaction History                                   │
│ ▾ Validation                                            │
│ ▾ Alternatives (T-NNN)                                 │
│ ▾ Action Graph                                          │
├────────────────────────────────────────────────────────┤
│ [@context: selection ▾] [📎]                           │
│ ┌──────────────────────────────────────────────┐ ⏎    │
│ │ Type your prompt or / for commands…          │       │
│ └──────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
```

**Üst bar:**
- **Mode:** Edit (apply tool calls live) / Plan (output plan, no execute) / Review (read-only) / Dry-run (simulate, no commit).
- **Provider + Model:** **Generic, config-driven** (hardcode YOK). Default `Anthropic / opus-4-7`. Fallback list config'ten.
- `⚙` workbench preferences: auto-apply confidence threshold, max tool calls per turn, context window cap.

**Chat:** User `--text-primary`, agent `--text-agent`. Token-token streaming. Tool call streaming sırasında Tool Call Log accordion auto-open. Inline: `[👍][👎][↻ Regenerate][📋 Copy]`.

**Tool Call Log:** Her satır tool ismi + args (mono, truncate) + status (⏳/✓/✗). Click → detail popover. Hover → viewport'ta etkilenen obje highlight.

**Scene Diff:** Her item: field + before → after + `[✓ apply] [✗ reject] [⤺ undo if applied]`. **Preview in Viewport:** pending diff'ler ghost/wireframe overlay 3sn fade-in (Esc cancel). Apply → kalıcı + transaction committed. Multi-edit grouped transaction olarak iletim.

**Transaction History:** `●agent` mor, `○human` gri, `↩` rollback-able. Click → o noktaya rollback önizleme (viewport ghost); confirm uygula. Rollback sonrası sonraki transaction'lar `--accent-rollback` strikethrough. Right-click: replay / re-run with edits / export as script / explain.

**Validation:** Validation panel'in (Bölüm 9) agent-context kopyası. Repair → agent task (Bölüm 9 semantik).

**Alternatives:** Agent n-variants (default 3). `[A][B][C]` tabs → hover ghost thumbnail 5sn fade → click **preview mode** (viewport canlı swap, üst overlay) → Apply commit veya Esc original.

**Action Graph (Houdini DNA):** Transaction'lar node; parameter değişimi node'a iliştirilmiş; drag node value → downstream re-evaluate. **MVP: feature flag arkasında** (data layer hazır, UI minimal liste view; full graph UI V2).

**Input bar:**
- **@context chip:** selection / scene / file / viewport-screenshot / none (multi-select).
- **📎 attach:** file picker (script / mesh / image inject).
- **Prompt:** multi-line growing textarea, `/` slash commands (`/clear`, `/undo`, `/explain`, `/validate`, `/optimize`).
- Enter send; Shift+Enter newline; Esc clear.

### 10.6 Keymap profilleri

| Profile | Tool tuşları | Add menu | Select all |
|---|---|---|---|
| **Maya (default)** | Q/W/E/R | Shift+A | Ctrl+A |
| **Blender** | T (toolbar)/G/R/S | Shift+A | A (mode-dependent) |
| **Custom** | User JSON | — | — |

- Per-action override: Settings > Keymap > action ara → custom hotkey ata. Conflict warning.
- **Workspace-aware keymap:** Animate'te `I` insert keyframe; Model'de `I` inset face. Workspace context çözer.

### 10.7 Discoverability (MVP)

- **First-run overlay:** workspace-specific 8-10 hotkey tooltip tour (opt-out).
- **Hotkey hint pills:** her menü item sağında hotkey.
- **`?` global help overlay** (MVP): mevcut workspace + mode için aktif hotkey cheatsheet floating.
- **Status bar tooltip:** tool seçildiğinde kısa kullanım hint (`Move + | LMB drag axis | Shift snap | Esc cancel`).
- **Command palette son kullanılanlar:** tekrar aranan komut için "did you know? hotkey: I" notu.

---

## 11. AI-native state visual cues — özet

| State | Treatment |
|---|---|
| **Generated by agent** | Outliner row sol kenar 2px `--accent-agent` strip + name `--text-agent` + hover `--bg-agent-tint` + `●agent` tag |
| **Pending diff** | Card `border-left: 3px solid --accent-pending` + Apply/Reject |
| **Applied** | Card `--accent-applied` 3px strip + ✓; 5sn fade-to-default |
| **Rejected** | Card `--accent-rejected` 3px strip + strikethrough; dismiss 3sn |
| **Rolled back** | Transaction list item `--accent-rollback` strikethrough |
| **Agent in-progress** | Workbench üst bar 3-dot wave + "thinking…"; viewport sağ-üst küçük mor pulse |
| **Validation warning** | Component card header sağda 12×12 ⚠ `--text-warning`; tıkla → detay |
| **Validation error** | Header 🛑 `--text-error`; Inspector tab kırmızı rozet |
| **Multi-agent attribution** | Outliner badge `●●●` 3 nokta; hover → liste |
| **Viewport halo** (Bölüm 4.7) | Failed > Warning > Agent > User önceliği; halo glow 8px outer, 40% opacity |

---

## 12. MVP scope summary

**MVP (4-6 hafta hedef — Full DCC Vision'a doğru ilk slice):**

- ✅ Layout zone iskeleti (CSS Grid, sabit yükseklikler, dock/float/split mekanik MVP=fixed)
- ✅ Workspace switcher (Model / Animate / Rig / Material / Simulate / Render / Script / Agent / Layout…)
- ✅ Top toolbar + Sub-toolbar (Transform Reference + Pivot ayrı dropdowns)
- ✅ Sol tool palette (Q/W/E/R + G alias + T universal + Pen / Text / Add Primitive / Camera / Light / Measure)
- ✅ 1-pane viewport + orbit/pan/dolly + Maya gesture baseline
- ✅ Shading modes (Wireframe / Solid / Material / Lit + Alt+Z X-ray + Shift+Z Wireframe overlay)
- ✅ Gizmo (Move/Rotate/Scale + Universal T) + Transform Reference × Pivot interplay
- ✅ Selection + 4-renk halo state sistemi (Error > Warning > Agent > User önceliği)
- ✅ Snap + 3D cursor + grid + origin indicator
- ✅ Outliner (tree + inline tag strip + visibility/lock + drag-reorder/parent + search + density preference)
- ✅ Inspector Component Stack (Unity DNA) — TransformComponent required, AgentMetadata only on agent-touched
- ✅ Add Component flow (2-sütun popup grid)
- ✅ Time editor MVP — tek-sekme swap (Timeline / Dopesheet / Curves); Range slider
- ✅ Transport (K play/pause + Space tap focus-aware + Alt+Space global)
- ✅ Motion path basic display (non-editable)
- ✅ Content Browser (alt çekmece, tabs, grid view, drag-into-viewport, Agent toggle)
- ✅ Status bar (mode + active + stats + memory + FPS + transaction badge + validation badge)
- ✅ Scene Validation panel (default gizli, status badge ile açılır; Repair = agent task except simple statics)
- ✅ Hotkey haritası (Maya baseline + Blender alias)
- ✅ Mouse + trackpad gesture sistemi
- ✅ Pie menu (Q tap + RMB hold)
- ✅ Command palette (Cmd + Agent + Search modes)
- ✅ Agent Workbench (Chat / Tool Call Log / Scene Diff / Transaction History / Validation / Alternatives) — Action Graph behind feature flag
- ✅ Provider/Model generic config-driven
- ✅ Discoverability: first-run overlay + `?` cheatsheet

**V2+ deferred (mimari hazır, UI gizli veya implement edilmemiş):**

- 🕓 Multi-pane split (2-V / 2-H / 4-pane)
- 🕓 Time editor side-by-side split (`Shift+click`)
- 🕓 **Sequencer sekme** (camera cuts + shot blocks + render ranges + audio + agent cinematic)
- 🕓 Onion skin
- 🕓 Editable motion path (3D drag → keyframe update)
- 🕓 Curve editor advanced (pre/post extrapolation cycle/bounce — basic OK MVP, advanced V2)
- 🕓 Panel detach as floating window (tool palette, agent workbench OS native)
- 🕓 Inspector scope/filter tabs (Blender Properties Editor benzeri)
- 🕓 Action Graph full UI (Houdini-style proc graph)
- 🕓 Content Browser sağ/sol dock
- 🕓 ScriptComponent (Houdini parameter+expression)
- 🕓 PhysicsComponent (rigid body / cloth / collider)
- 🕓 Pen/Tablet pressure + tilt
- 🕓 Custom validation scripts
- 🕓 Multi-user collaboration (avatar, sync status)
- 🕓 Tauri/Electron native chrome
- 🕓 WebGPU migration via `WebGPURenderer`

---

## 13. Implementation mapping (Three.js + R3F + drei)

| Spec section | R3F / drei component | Notes |
|---|---|---|
| §4 viewport | `<Canvas>` + `<Suspense>` | r3f Canvas. Multi-pane via portals. |
| §4.2 camera nav | `<OrbitControls makeDefault enableDamping={false} />` | Custom Alt-modifier keybind layer overlay |
| §4.4 shading modes | Conditional material per `useMode()` hook | Wireframe via `material.wireframe`; Agent Heatmap custom shader |
| §4.5 gizmo | `<TransformControls>` (drei) + custom multi-handle | drei base, custom outline overlay |
| §4.7 selection halo | `EffectComposer` + 2× `OutlinePass` (postprocessing) | Multi-color outline + glow |
| §4.9 grid + 3D cursor | `<Grid>` (drei) + custom Mesh for 3D cursor | Floor grid with axis tints |
| §5.6 Component stack | Custom React component, JSON-driven | Each Component = React subtree; reorder via `react-dnd` |
| §6 time editor | Custom canvas + SVG renderer | Ruler + dopesheet + curves; transport uses Bölüm 1 PlaybackController pattern |
| §6.4 dopesheet sync | Shared Zustand store (`useSelection`) | Outliner ↔ Dopesheet ↔ Inspector |
| §7 Content Browser | Custom grid/list; GLTFLoader + thumbnail render via `useThree({ gl })` offscreen | Async asset thumbnails cached |
| §9 validation | Static rule engine + agent integration via task queue | Background worker for static checks |
| §10.3 pie menu | Custom React overlay, radial geometry math | Trigger from any focus context |
| §10.4 command palette | Custom modal with fuzzy search (`fuse.js`) | Mode prefixes parsed |
| §10.5 Agent Workbench | Existing AI task protocol extended | Tool call log = streamed parsed events |

---

## 14. Migration roadmap (this folder → agentic-3d-studio)

1. **Rename:** `animation/ai-2d-studio` → `animation/agentic-3d-studio`; `pnpm-workspace.yaml` entry + `package.json` name.
2. **Strip Remotion as primary motor:** Keep optional `src/exporters/remotion-adapter.ts` for video render; remove from main render path.
3. **Replace SVG scene renderer with R3F:** `src/scene/SceneRenderer.tsx` → `src/scene/SceneRenderer3D.tsx` using `<Canvas>` + `<Object3D>` traversal.
4. **Convert schema 2D → 3D:** `Transform2D { x, y }` → `Transform3D { position: Vec3, rotation: Euler|Quaternion, scale: Vec3 }`. Object types: `mesh / light / camera / group / empty / bone / curve`.
5. **Preserve engine/runtime/AI-task patterns:** `PlaybackController`, `TimeController`, `ViewportRuntime`, `agent-tasks/*.json` protocol — adapt signatures to 3D.
6. **Add Component model:** Refactor scene objects into `GameObject + Component[]` structure.
7. **Implement chrome per this spec:** styles.css full rewrite using §2 tokens; layout via CSS Grid §1.1; components per §3-9.
8. **Add Agent Workbench:** §10.5 panel + integrate with existing task queue.
9. **Validate:** `pnpm --filter agentic-3d-studio exec tsc --noEmit` + `pnpm --filter agentic-3d-studio build` clean.
