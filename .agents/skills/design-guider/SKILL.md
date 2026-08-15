---
name: design-guider
description: Design guider for Angular frontend projects. INVOKE IMMEDIATELY when creating any new UI/web project or starting a new feature with a visual shell, layout, or theme. Enforces the pre-flight questions (Ionic vs Angular Material, icon provider) and custom-theme rules before any scaffolding or styling happens. Trigger words - new project, scaffold, create app, design, theme, dark mode, icon, dashboard layout, shell.
---

# Design Guider

The design guider owns every visual decision for new Angular frontend projects. It runs **before** any scaffolding, component generation, or styling work.

## Non-negotiable rules

1. **Never copy an existing project** to create a new, unrelated project. A new project is scaffolded fresh from generators. Copying is only acceptable between genuinely related projects, and only with explicit user approval.
2. **Always ask before creating** a UI project. Use the `question` tool. The questions are mandatory, not optional:
   - **UI framework**: Ionic or Angular Material?
   - **Icon provider**: Google Icons (Material Symbols), Font Awesome, Ionicons, or something else?
3. **Always build a custom theme** — never ship a default theme. The theme must follow the chosen framework's theming system (see below). Every project gets a custom color palette + typography.
4. Apply the answers everywhere the design touches: styles/theme files, global stylesheet, component styles, shell, and any new component that renders branded UI.

## Remember new projects

When a new project is created (any name, frontend or backend), log it in the
shared cross-agent memory `~/memory/conversations/YYYY-MM-DD.md`: name, path,
purpose, framework (Ionic vs Angular Material), icon provider, assigned ports,
and key decisions. This guarantees opencode and openclaw both remember it next
session. Also update `README.md`'s Projects table (path + port) if it exists.

## Question template

Ask these before scaffolding a new UI project (frontend only — backend/shared libs don't need the design questions):

```text
1. UI framework: Ionic or Angular Material?
   - Ionic → component library with its own theming (CSS custom properties), great for cross-platform / mobile-shell apps.
   - Angular Material → M3 design system with SCSS theme tokens, best for desktop/admin-style apps.
2. Icon provider: Google Icons (Material Symbols), Font Awesome, Ionicons, or other?
```

Use the `question` tool with these options. If the user answers with a reference image or design brief, the theme/icon choices may come from the image instead — reconcile, but still confirm explicitly.

## Custom theme recipes

### Ionic theme

Customize via CSS custom properties (Ionic theming docs: https://ionicframework.com/docs/theming/themes, https://ionicframework.com/docs/theming/colors, https://ionicframework.com/docs/theming/typography).

- **Colors**: override `--ion-color-primary`, `--ion-color-secondary`, `--ion-color-tertiary`, `--ion-color-success`, `--ion-color-warning`, `--ion-color-danger`, `--ion-color-light`, `--ion-color-medium`, `--ion-color-dark`, plus their `-rgb` variants and `-contrast`/`-shade`/`-tint`. Define new custom colors with `--ion-color-<name>` + `--ion-color-<name>-rgb`, and register via `ion-color` utility classes.
- **Typography**: set `--ion-font-family` on `:root` (or `body`) to a custom font stack.
- Define the palette/tokens in a dedicated SCSS file (e.g. `src/theme/`), keep component styles free of hard-coded brand hexes.

### Angular Material (M3) theme

Use Material's SCSS theme API (docs: https://material.angular.io/guide/theming, https://material.angular.io/guide/theming-colors).

- In `styles.scss`, use `@use '@angular/material' as mat;` and `@include mat.theme((color: (theme-type: light, primary: <custom-color>, tertiary: <custom-color>), typography: Roboto))` (dark theme variant uses `theme-type: dark`).
- For custom palettes build tokens from `mat.define-theme` / `mat.$xxx-palette`; use Material **color semantics** (`primary`, `tertiary`, `error`, `neutral`, `neutral-variant`) rather than hard-coded hexes so components get full M3 role support.
- Generate/update the theme tokens with `mat.theme` and apply component theming via `mat.elevation`-style APIs where needed.

## Icon provider setup

| Provider | Setup |
| --- | --- |
| Google Icons / Material Symbols | Add the `material-symbols-outlined` font (Google Fonts) and use `<span class="material-symbols-outlined">icon_name</span>` or the `MaterialSymbols`/`MatIcon` components. |
| Font Awesome | Install `@fortawesome/fontawesome-free` (or Pro) and use `<i class="fa-solid fa-..."></i>`. |
| Ionicons | Available with Ionic (`ion-icons`/`<ion-icon name="...">`). For Angular Material apps, add `ionicons` npm package + `addIcons()` or `<ion-icon>`. |
| Custom/other | SVG sprite, Lucide, Tabler, etc. — wire up accordingly and document in the app README. |

Use the chosen provider consistently across every icon in the app; never mix providers in the same screen.

## Workflow

1. On new UI project request → confirm or ask the two questions (framework, icon provider).
2. Scaffold the project fresh with the workspace generators (see `nx-generate` skill) — do not copy another app.
3. Immediately set up the custom theme file(s) and icon provider per the answers.
4. Only then build components/shells, using the theme tokens and chosen icons.
5. Update the app README with the theme (palette, typography) and icon provider used.