---
name: design-guider-csharp
description: C#/Avalonia design workflow for desktop UI projects. INVOKE IMMEDIATELY when applying a design/reference image to an Avalonia app, creating a new desktop UI theme, or restyling Aurel.Desktop. Trigger words - apply the design, Avalonia theme, desktop design image, Aurel-UI, design guide, restyle desktop.
---

# Design Guider C# (Avalonia)

The C# counterpart of `design-guider` (Angular) + `apply-design-image`.
Adapted from the aurel-dashboard workflow; proven on Aurel.Desktop
(Avalonia 11, .NET 10). Reference implementation: `apps/aurel-core`.

## Golden rules

1. **Find the image first.** Workspace convention: `design/<project>/` at repo
   root, or `<app>/Design/`. Example: `apps/aurel-core/Design/Aurel-UI.png`.
2. **Assume you can't see images.** Extract the spec via vision models + pixel
   analysis (Step 2). Never style from a filename.
3. **Pixels win.** Vision models disagree on hexes; ground-truth pixel
   sampling is the source of truth for colors.
4. **Tokens only.** All colors/sizes/fonts go in the token dictionary
   (`Styles/DesignTokens.axaml`), consumed via `{DynamicResource}`. No hex in
   view XAML or control C#.
5. **MVVM strictly.** Views: XAML + `InitializeComponent` only. Logic:
   ViewModels with CommunityToolkit.Mvvm `[ObservableProperty]` /
   `[RelayCommand]`. Services resolved via DI (`Microsoft.Extensions.DependencyInjection`).
6. **Perf budget before beauty.** Every visual decision is checked against the
   red-lines in Step 5. Simplify expensive design elements to the closest
   cheap equivalent and record the substitution.

## Step 1 — Locate the design

```bash
ls design/<project>/ <app>/Design/   # find reference image(s)
```

## Step 2 — Extract the spec

### 2a. Vision models (NVIDIA API)
- Key: `grep -rh "nvapi-" ~/.openclaw/`. Endpoint:
  `https://integrate.api.nvidia.com/v1/chat/completions`.
- Models: `nvidia/nemotron-nano-12b-v2-vl` (fast), `meta/llama-3.2-90b-vision-instruct`
  (strong, may time out), `meta/llama-3.2-11b-vision-instruct` (cross-check).
- Ask for EXACT hexes (background, surface, primary/secondary accent, text
  tiers, borders, status colors), layout grid, typography, component list,
  icon style. Structured markdown. Timeout 300s. Save to `/tmp/opencode/`.

### 2b. Pixel ground-truth
PIL is not installed — decode the PNG with zlib/struct (Paeth unfiltering),
sample a grid, quantize:
- Dominant colors → background / surface / text.
- Saturated pixels (`max-min >= 25`, `max >= 40`) → accents & status.
- Reference scripts: `/tmp/opencode/png_colors.py`, `/tmp/opencode/png_exact.py`
  (recreate if missing).

### 2c. Reconcile into the design guide
Write `Design/DESIGN-GUIDE.md` in the app repo: palette table (token → hex),
type scale, spacing scale (8px base), layout grid, component inventory,
animation/perf budget, simplification decisions. This document is the contract
for all agents.

## Step 3 — Apply the theme (Avalonia)

1. **Tokens** → `Styles/DesignTokens.axaml` (ResourceDictionary): `Color`,
   `SolidColorBrush`, `x:Double`, `CornerRadius`, `Thickness`, `FontFamily`
   resources. Brushes reference colors via `{DynamicResource}` so themes can
   be swapped.
2. **Roots**: `AppStyles.axaml` and `ControlStyles.axaml` must be `<Styles>`
   roots (NOT ResourceDictionary — Avalonia 11 rejects RD roots there).
   Token file is included via `ResourceInclude` in `App.axaml`
   `Application.Resources`; styles via `StyleInclude`.
3. **Fonts**: embed TTF/WOFF in `Assets/Fonts/` (`<AvaloniaResource>`),
   register `FontFamily` tokens (`Inter`, `JetBrains Mono` with system
   fallbacks). Never rely on OS-installed fonts.
4. **Icons**: vector `StreamGeometry` resources in a `Icons.axaml`
   ResourceDictionary, rendered via `PathIcon`/`Path`. NO emoji glyphs, NO
   icon font downloads. One consistent stroke style (design-derived).
5. **Effects**: `DropShadowEffect` only on static, non-animated chrome. Glow
   looks come from pre-baked gradient borders/assets.

## Step 4 — Build the shell + content

- Shell grid: topbar (brand / nav tabs / clock+window controls) → body
  (sidebar tree + content) → status bar. Sections mapped to top tabs as
  groups; sidebar shows the active group's items.
- Navigation: ViewModel-driven (`CurrentSection` string + converter to views,
  or view-locator). No code-behind navigation.
- Custom window chrome: `ExtendClientAreaToDecorationsHint="True"` +
  caption buttons bound to Window commands via behaviors/ViewModel.
- Dashboard zones: center (character + command), left rail (modules/processes),
  right rail (tasks/resources/agents), bottom row (feed/globe/quick
  access/monitor). Each zone is a UserControl with its own ViewModel.

## Step 5 — Performance red-lines (check every component)

| Temptation | Red line | Do instead |
|---|---|---|
| Glow/blur everywhere | Live `DropShadowEffect` on animated/large elements | Pre-baked static borders; effects only on static chrome |
| Per-frame XAML animations | Animating Layout properties (Width/Margin) | `RenderTransform` + composition animations |
| Waveform/rings | Per-frame redraw via binding churn | Custom control with throttled `DispatcherTimer` render (30fps cap) |
| Long lists | Plain `ItemsControl` | `ItemsRepeater` / virtualizing `ListBox` |
| Metrics polling | Timer per panel | One shared telemetry service, 5s default interval, `async` with cancellation |
| Startup | Sync I/O in constructors | DI singletons, lazy init, async load after first frame |

## Step 6 — Verify

```bash
cd <app-repo>
dotnet build
DISPLAY=:0 dotnet run --project src/<DesktopProject> &   # smoke run
# screenshot to Screenshots/ and compare against the design image
```

Fix all build errors before declaring a step done. Update the app README
"Design" section and `~/memory/conversations/YYYY-MM-DD.md`; run
`graphify update .` in the repo.

## Step 7 — Ledger

Each phase/step is an `atask` entry. Mark done only after the build + run
verification passes. Never re-implement something already in the inventory
(check the app AGENTS.md / README first).
