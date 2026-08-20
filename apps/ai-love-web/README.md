# ai-love Web

AI Companion catalog UI: browse fourteen companion personalities (8 female + 6 male), filter by gender and personality tag, and open a profile page.

## Stack

- Angular (standalone) + Angular Material **M3** with a custom **rose/plum** theme
- Google **Material Symbols** (icons) + Playfair Display / Inter fonts
- SCSS with full `.html` / `.scss` / `.ts` component separation
- Proxy `/api` → `ai-love-api` (:3006)

## Run

```bash
npx nx serve ai-love-web
```

Web on :4206. Make sure `ai-love-api` is running on :3006.

## Routes

| Route            | Description                                   |
| ---------------- | --------------------------------------------- |
| `/`              | Redirects to `/companions`                    |
| `/age-gate`      | 18+ consent gate (localStorage) + NSFW opt-in |
| `/companions`    | Catalog grid with gender + tag filters        |
| `/companions/:id`| Companion detail page                         |

## Ports

- Web: `4206` (Nx serve config), proxy target `:3006`

## Status

Milestone 1 — catalog browsing with 18+ gate. Chat with companions, voice, and
profile customization are upcoming milestones.