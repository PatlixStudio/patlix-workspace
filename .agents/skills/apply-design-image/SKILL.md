---
name: apply-design-image
description: Apply a design/reference image (usually under design/<project>/) to an existing UI project. INVOKE IMMEDIATELY when the user says to apply a design, use a reference image/screenshot, match a mockup, or hand a design file for a project. Trigger words - apply the design, reference image, apply image, design image, match the mockup, use the design folder, Aurel Dashboard UX, apply it.
---

# Apply Design Image

Workflow for turning a design/reference image into a live UI implementation in
an existing project. Invented on `aurel-dashboard` (dark command-center M3
dashboard). Reuse it for every future project + design image.

## Golden rules

1. **Find the image first.** Workspace convention: `design/<project>/` at the
   repo root. Example: `design/aurel-dashboard/Aurel Dashboard UX.png`.
2. **Assume you can't see images.** Default models are text-only. Do NOT guess
   the design from a filename. Extract the spec using step 2 below.
3. **Never rely on a single vision model.** Cross-check with 2+ models AND
   ground-truth pixel analysis. Vision models disagree on exact hexes.
4. **Ask before building the shell if the project is not scaffolded yet** —
   run the design-guider skill first for new UI projects.
5. **Keep tokens in the theme files**, never hard-code brand hexes in
   component styles. Use Material color semantics so the whole component
   library follows the palette.
6. **Log the project + design in shared memory** and update the app README.

## Step 1 — Locate the design

```bash
ls design/<project>/          # find the reference image(s)
```

If not under `design/`, ask the user where the design lives (image path, Figma
export, sketch, etc.).

## Step 2 — Extract the spec (image → structured design)

My current model cannot read images, so extract via vision APIs + pixels.

### 2a. Vision models (NVIDIA API)

- NVIDIA key lives in the openclaw configs
  (`grep -rh "nvapi-" ~/.openclaw/`). Endpoint:
  `https://integrate.api.nvidia.com/v1/chat/completions`, auth
  `Authorization: Bearer nvapi-…`.
- Vision models available:
  - `nvidia/nemotron-nano-12b-v2-vl` (fast, best detail)
  - `meta/llama-3.2-90b-vision-instruct` (strong, slow — can time out on
    large images)
  - `meta/llama-3.2-11b-vision-instruct` (cross-check)
- Prompt: ask for EXACT hex colors (background, surface, primary/tertiary,
  text, borders, status), layout & nav structure, typography, components,
  icons provider, overall style, brand name. Request structured markdown.
- Send image as `data:image/png;base64,…` in `image_url` content.
- Timeout: 300s. If 90b times out, use the 12b VL model.
- Save outputs to `/tmp/opencode/` and read them back.

Reference script used successfully: `/tmp/opencode/vision_design.py` and
`/tmp/opencode/vision_detail.py` (accepts model as argv, reads image +
stdin prompt). Recreate if missing — pattern below.

### 2b. Ground-truth pixel analysis (the source of truth for colors)

Vision models disagree (aurel: teal `#00BFA5` vs blue `#00ADEF`). Settle with
pixels. PIL is NOT installed and there's no pip — decode the PNG manually with
zlib/struct (Paeth unfiltering), sample a grid, and quantize:

- Dominant colors → background / surface / text.
- Saturated pixels (`max-min >= 25`, `max >= 40`) → accent & status colors.
- Bright-cyan filter (`max > 150`, `max-min > 60`, `max == r`) → exact accent
  hue samples.

Use a pure-python PNG decoder (see `/tmp/opencode/png_colors.py` and
`/tmp/opencode/png_exact.py`). Report the dominant hexes back to the user.

### 2c. Reconcile into a spec

Combine model output + pixel truth into a definitive design spec: palette
(exact hexes), layout/nav, typography, components, icons, style. Record it in
the app README under a "Design" section.

## Step 3 — Apply the theme

For Angular Material (M3):

1. `styles.scss`: `@include mat.theme((color: (theme-type: <dark|light>,
   primary: <palette>, tertiary: <palette>), typography: …))`.
   - `mat.theme` requires **tonal palettes**, not hex strings (hex throws a
     Sass `map.remove` error). Build custom palettes in
     `src/theme/palettes.scss` (anchor the brand color at tone 40/60, add
     `secondary/neutral/neutral-variant` keys).
2. Define custom design tokens as CSS custom properties (`--app-*`) in
   `:root` for background, surfaces, borders, accent, text, status colors.
3. Add fonts (Inter, Material Symbols Outlined) to `index.html`.

## Step 4 — Build the shell + content

- Shell: sidebar (brand + nav routes) + topbar (clock/search/notifications/
  profile) + `<router-outlet>`. Use modern Angular control flow
  (`@for`/`@if`/`@switch`), not `*ngFor`, to avoid importing CommonModule.
- Content: match the image's layout (grid columns, panels, cards, charts,
  lists). Use Material Symbols classes (`material-symbols-outlined`) for icons.
- Charts without a chart lib: CSS waveform bars, progress tracks, SVG
  sparklines.
- Update `app.routes.ts`, `app.ts`/`app.html`, delete the `nx-welcome`
  starter, and fix `app.spec.ts` to match the new shell.

## Step 5 — Verify

```bash
npx nx lint <project>
npx nx test <project>
npx nx build <project>            # if component style budget exceeded, bump anyComponentStyle maxWarning/maxError in project.json
npx nx serve <project>            # confirm :200 on the port
```

Bump the component-style budget if a full-screen style (e.g. dashboard.scss)
exceeds the 4kb default — that is expected for rich dashboards.

## Step 6 — Document + remember

- Write/update the app `README.md`: stack, **Design** section (palette table
  with hexes, layout description), dev commands.
- Append to `~/memory/conversations/YYYY-MM-DD.md`: which project, which design
  image, palette/decisions, ports, and any OPEN items.
- Run `graphify update .` in the workspace root to refresh the knowledge graph.