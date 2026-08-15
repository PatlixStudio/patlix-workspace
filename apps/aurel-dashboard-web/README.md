# Aurel Dashboard — Web

Aurel AI Command Center: the analytics and monitoring dashboard frontend for Aurel AI — an AI Command Strategist & Operations Coordinator for Patflix Studio.

## Stack

- Angular (standalone) + Angular Material **M3** theming
- SCSS styling with custom design tokens
- Icon provider: **Google Material Symbols Outlined**
- Nx project (`aurel-dashboard-web`), served on **:4203**

## Design

Built from the reference images at `design/aurel-dashboard/`:

- `Aurel Dashboard UX.png` — dark theme
- `Aurel Dashvoard Light.png` — light theme

### Themes (dark / light switcher)

The topbar toggle switches between dark and light. The active mode is
persisted in `localStorage` and managed by `src/app/theme.service.ts`
(`theme-dark` / `theme-light` class on `<html>`).

| Token | Dark | Light |
| --- | --- | --- |
| Background | `#05060a` (cyan radial glow) | `#f0f0f0` (gold radial glow) |
| Surface / cards | `#0d1826` | `#ffffff` |
| Primary accent | cyan `#01c3f5` | gold `#a86800` |
| Tertiary / highlight | gold `#ffd700` | gold `#a86800` |
| Hover (nav, buttons, rows) | **gold** `#ffd700` | **gold** `#a86800` |
| Text | `#e8eef4` / muted `#8fa3b8` | `#1f2937` / muted `#4b5563` |
| Status: online / away / offline | `#21d07a` / `#ffb300` / `#ff5252` | `#16a34a` / `#d97706` / `#dc2626` |

Tonal palettes are defined in `src/theme/palettes.scss` and consumed via
Material color semantics (`primary`/`tertiary`) in `src/styles.scss`; design
tokens (`--ad-*`) live in the same file per theme so the whole component
library follows the brand palette.

### Layout

- **Collapsible sidebar**: brand, animated 3D-style bot avatar with gold/cyan
  ring + live voice waves, 9 nav sections (collapse to icon-only), live status
  footer.
- **Topbar**: live clock, search, theme toggle, notifications, user profile.
- **Dashboard grid**: mission-overview stat cards, Aurel profile, mission
  progress, live conversation waveform, subagents, **user conversation + chat
  input** (type and talk to Aurel — send a message and get a reply), subagent
  activity, system insights, active projects, recent activities.

## Dev

```bash
npx nx serve aurel-dashboard-web   # http://localhost:4203
npx nx lint aurel-dashboard-web
npx nx test aurel-dashboard-web
npx nx build aurel-dashboard-web
```