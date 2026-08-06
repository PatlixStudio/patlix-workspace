# patlix-workspace

The primary Nx monorepo for all PatlixStudio projects. It hosts the **Patlix dashboard** — the single place to log in and launch every workspace project.

## Stack & conventions

| Layer | Technology |
| --- | --- |
| Frontend | Angular (standalone) + Angular Material **M3** + SCSS |
| Backend | NestJS + **TypeORM** + **PostgreSQL** |
| Workspace | Nx (preset `ts`), npm, no Nx Cloud (local cache) |
| Tooling | ESLint, Prettier, Jest (api) / Vitest (web, shared), strict TypeScript |

Conventions applied to **every** project:

- **Swagger** documentation exposed by the API at `/api/docs`.
- **Code documentation**: TSDoc/JSDoc on all public members + per-app `README.md`.
- Each project lives in `apps/*` / `libs/*` and is its **own git repository**, wired into this workspace as a git **submodule**.
- Repos live under the `PatlixStudio` GitHub org (`patlix-<name>`).

## Projects

| Project | Path | Role | Port |
| --- | --- | --- | --- |
| `patlix-web` | `apps/web` | Dashboard: login → launch all workspace projects. Slot reserved for the future **AI-Dashboard** (UX-driven). | 4200 |
| `patlix-api` | `apps/api` | REST API: JWT auth + projects CRUD, Swagger at `/api/docs`. | 3000 |
| `patlix-shared` | `libs/shared` | Shared DTOs/types (`@patlix/shared`). | — |

## Quick start

```bash
npm install

# Start the API (http://localhost:3000, docs at /api/docs)
npx nx serve api

# Start the web dashboard (http://localhost:4200)
npx nx serve web
```

The web dev server proxies `/api` to the API (see `apps/web/proxy.conf.json`).

### Default login

The API seeds an admin user on first start:

- **email:** `admin@patlix.dev`
- **password:** `admin123`

(override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `apps/api/.env`)

## PostgreSQL (local dev)

PostgreSQL runs in **Docker Desktop on Windows** and is reachable from WSL at `localhost:5432`.

- The shared container is `arkadion-postgres` (superuser `arkadion`).
- The workspace uses a dedicated role/database: **`patlix` / `patlix` / database `patlix`**.
- Connection settings live in `apps/api/.env` (template: `apps/api/.env.example`).

Create the role/database once if missing:

```bash
docker exec arkadion-postgres psql -U arkadion -d postgres -c "CREATE ROLE patlix LOGIN PASSWORD 'patlix';"
docker exec arkadion-postgres psql -U arkadion -d postgres -c "CREATE DATABASE patlix OWNER patlix;"
```

> The schema auto-syncs on API start (`synchronize: true`) — **dev only**.

## Common commands

```bash
# All quality gates for every project (use --parallel=1 on low-RAM machines)
npx nx run-many -t lint test build --parallel=1

# Single project
npx nx lint web
npx nx test api
npx nx build web

# Generate a new app/lib
npx nx g @nx/angular:app <name> --directory=apps/<name> --style=scss --routing
npx nx g @nx/nest:app <name> --directory=apps/<name>
npx nx g @nx/js:lib <name> --directory=libs/<name> --importPath=@patlix/<name>
```

## Git & repos

- This workspace is one git repo: `git@github.com:PatlixStudio/patlix-workspace.git`.
- Each project is a **submodule** pointing at its own repo:
  - `PatlixStudio/patlix-web`
  - `PatlixStudio/patlix-api`
  - `PatlixStudio/patlix-shared`

```bash
git submodule update --init --recursive
```

> Development happens inside each project's repo; the workspace repo tracks the submodule commits.

## Documentation

- API reference: http://localhost:3000/api/docs (Swagger UI)
- This repo: `AGENTS.md` documents the conventions for AI coding agents.
