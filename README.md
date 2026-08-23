# patlix-workspace

The primary Nx monorepo for all PatlixStudio projects. It hosts the **Patlix dashboard** — the single place to log in and launch every workspace project.

## Stack & conventions

| Layer     | Technology                                                             |
| --------- | ---------------------------------------------------------------------- |
| Frontend  | Angular (standalone) + Angular Material **M3** + SCSS                  |
| Backend   | NestJS + **TypeORM** + **PostgreSQL**                                  |
| Workspace | Nx (preset `ts`), npm, no Nx Cloud (local cache)                       |
| Tooling   | ESLint, Prettier, Jest (api) / Vitest (web, shared), strict TypeScript |

Conventions applied to **every** project:

- **Swagger** documentation exposed by the API at `/api/docs`.
- **Code documentation**: TSDoc/JSDoc on all public members + per-app `README.md`.
- Each project lives in `apps/*` / `libs/*` and is its **own git repository**, wired into this workspace as a git **submodule**.
- Repos live under the `PatlixStudio` GitHub org (`patlix-<name>`).

## Projects

| Project               | Path                       | Role                                                                                                         | Port |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | ---- |
| `patlix-web`          | `apps/patlix-web`          | Dashboard: login → launch all workspace projects. Slot reserved for the future **AI-Dashboard** (UX-driven). | 4200 |
| `patlix-api`          | `apps/patlix-api`          | REST API: JWT auth + projects CRUD, Swagger at `/api/docs`.                                                  | 3000 |
| `patlix-shared`       | `libs/shared`              | Shared DTOs/types (`@patlix/shared`).                                                                        | —    |
| `arkadion-web`        | `apps/arkadion-web`        | Arkadion AI assistant UI: chat with 21 personas (Angular, standalone repo).                                  | 4201 |
| `arkadion-api`        | `apps/arkadion-api`        | Arkadion backend: entities, chat (WebSocket), LLM chain, speech (NestJS, standalone repo).                   | 3001 |
| `falina-web`          | `apps/falina-web`          | Falina — Your Personal Oracle (Angular + Ionic + Capacitor mobile app, custom design system).                | 4202 |
| `falina-api`          | `apps/falina-api`          | Falina backend: coffee/tarot/astrology readings, Oracle, AI abstraction (NestJS, standalone repo).           | 3002 |
| `falina-shared`       | `libs/falina-shared`       | Falina shared contracts (`@falina/shared`).                                                                  | —    |
| `aurel-dashboard-web` | `apps/aurel-dashboard-web` | Aurel AI Command Center — analytics & monitoring dashboard (Angular, standalone repo).                       | 4203 |
| `aurel-dashboard-api` | `apps/aurel-dashboard-api` | Aurel backend: orchestration, subagents, tasks, chat; Swagger at `/api/docs` (NestJS, standalone repo).      | 3003 |
| `patlix-world-web`    | `apps/patlix-world-web`    | Patlix World — open-world AI workforce UI (Angular, standalone repo).                                        | 4204 |
| `patlix-world-api`    | `apps/patlix-world-api`    | Patlix World backend: agents, Aurel orchestration, tasks, tools, events (NestJS, standalone repo).           | 3004 |
| `patlix-world-shared` | `libs/patlix-world-shared` | Patlix World shared contracts (`@patlix/world-shared`).                                                      | —    |
| `patlix-people-web`   | `apps/patlix-people-web`   | Patlix People — social platform UI (Angular + Ionic + Capacitor, custom design system).                      | 4205 |
| `patlix-people-api`   | `apps/patlix-people-api`   | Patlix People backend: auth, profiles, likes, boost (NestJS, standalone repo).                               | 3005 |
| `patlix-people-shared`| `libs/patlix-people-shared`| Patlix People shared contracts (`@patlix-people/shared`).                                                    | —    |
| `ai-love-web`         | `apps/ai-love-web`         | ai-love — AI Companion catalog UI (Angular Material M3, rose/plum custom theme, Google Icons, 18+ gate).     | 4206 |
| `ai-love-api`         | `apps/ai-love-api`         | ai-love backend: companion catalog REST + Swagger at `/api/docs` (NestJS, workspace-managed).               | 3006 |
| `aurel-core`          | `apps/aurel-core`          | Aurel Core — native gRPC server, .NET runtime, Avalonia desktop UI, plugin system.                           | 50051 (gRPC) |
| `aurel-core-contracts`| `libs/aurel-core-contracts`| Shared gRPC protobuf contracts (C#/TypeScript).                                                              | — |

> Naming rule: Patlix's own apps keep the short names `patlix-web` / `patlix-api`. Feature projects carried into the workspace keep `<name>-web` / `<name>-api` (e.g. `arkadion-web` / `arkadion-api`).

## Quick start

```bash
npm install
git submodule update --init --recursive   # pull the project repos
npm install --prefix apps/arkadion-api    # arkadion has its own dependencies
npm install --prefix apps/arkadion-web

# Start the API (http://localhost:3000, docs at /api/docs)
npx nx serve patlix-api

# Start the web dashboard (http://localhost:4200)
npx nx serve patlix-web

# Start Arkadion (API on :3001, web on :4201)
npx nx serve arkadion-api
npx nx serve arkadion-web

# Start Falina (API on :3002, web on :4202)
npm install --prefix apps/falina-api
npm install --prefix apps/falina-web
npx nx serve falina-api
npx nx serve falina-web

# Start Aurel Core (gRPC on :50051, desktop UI)
dotnet run --project apps/aurel-core/src/Aurel.Core &
dotnet run --project apps/aurel-core/src/Aurel.Desktop

# Start Aurel Dashboard (API on :3003, docs at /api/docs, web on :4203)
npm install --prefix apps/aurel-dashboard-api
npx nx serve aurel-dashboard-api
npx nx serve aurel-dashboard-web

# Start Patlix World (API on :3004, web on :4204)
npm install --prefix apps/patlix-world-api
npm install --prefix apps/patlix-world-web
npx nx serve patlix-world-api
npx nx serve patlix-world-web

# Start Patlix People (API on :3005, docs at /api/docs, web on :4205)
npm install --prefix apps/patlix-people-api
npm install --prefix apps/patlix-people-web
npx nx serve patlix-people-api
npx nx serve patlix-people-web
```

The web dev server proxies `/api` to the API (see `apps/patlix-web/proxy.conf.json`). `arkadion-web` calls `arkadion-api` directly at `http://localhost:3001/api` (CORS is enabled on the backend).

### Default login

The API seeds an admin user on first start:

- **email:** `admin@patlix.dev`
- **password:** `admin123`

(override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `apps/patlix-api/.env`)

## PostgreSQL & shared infra (local dev)

PostgreSQL (and the `speaches` STT/TTS service) run in **Docker Desktop on Windows** and are reachable from WSL. The whole stack is declared in the workspace-level `docker-compose.yml`:

```bash
docker compose up -d        # starts patlix-postgres (:5432) and patlix-speaches (:8969)
docker compose down         # stops them (volumes are kept)
```

- Container `patlix-postgres` — superuser `arkadion` / `arkadion` (volume `patlix_pgdata`).
- Container `patlix-speaches` — OpenAI-compatible STT/TTS on `:8969` (volume `speaches_models`).
- Each project uses its own database inside the shared Postgres:
  - **`patlix`** (role `patlix` / password `patlix`) → `patlix-api`
  - **`arkadion`** → `arkadion-api`
  - **`falina`** → `falina-api`
  - **`patlixworld`** → `patlix-world-api`
  - **`patlixpeople`** (role `patlixpeople`) → `patlix-people-api`
- `aurel-dashboard-api` is stateless (in-memory) — no DB.
- Connection settings live in each app's `.env` (templates: `.env.example`).

Create the `patlix` role/database once if missing:

```bash
docker exec patlix-postgres psql -U arkadion -d postgres -c "CREATE ROLE patlix LOGIN PASSWORD 'patlix';"
docker exec patlix-postgres psql -U arkadion -d postgres -c "CREATE DATABASE patlix OWNER patlix;"
```

> The schema auto-syncs on API start (`synchronize: true`) — **dev only**.

## Common commands

```bash
# All quality gates for every project (use --parallel=1 on low-RAM machines)
npx nx run-many -t lint test build --parallel=1

# Single project
npx nx lint patlix-web
npx nx test patlix-api
npx nx build patlix-web

# Generate a new app/lib
npx nx g @nx/angular:app <name> --directory=apps/<name> --style=scss --routing
npx nx g @nx/nest:app <name> --directory=apps/<name>
npx nx g @nx/js:lib <name> --directory=libs/<name> --importPath=@patlix/<name>
```

## Git & repos

- This workspace is one git repo: `git@github.com:PatlixStudio/patlix-workspace.git`.
- Each project is a **submodule** pointing at its own repo:
  - `PatlixStudio/patlix-web` → `apps/patlix-web`
  - `PatlixStudio/patlix-api` → `apps/patlix-api`
  - `PatlixStudio/patlix-shared` → `libs/shared`
  - `PatlixStudio/arkadion-web` → `apps/arkadion-web`
  - `PatlixStudio/arkadion-api` → `apps/arkadion-api`
  - `PatlixStudio/falina-web` → `apps/falina-web`
  - `PatlixStudio/falina-api` → `apps/falina-api`
  - `PatlixStudio/falina-shared` → `libs/falina-shared`
  - `PatlixStudio/aurel-dashboard-web` → `apps/aurel-dashboard-web`
  - `PatlixStudio/aurel-dashboard-api` → `apps/aurel-dashboard-api`
  - `PatlixStudio/patlix-world-web` → `apps/patlix-world-web`
  - `PatlixStudio/patlix-world-api` → `apps/patlix-world-api`
  - `PatlixStudio/patlix-world-shared` → `libs/patlix-world-shared`
- `PatlixStudio/patlix-people-web` → `apps/patlix-people-web`
- `PatlixStudio/patlix-people-api` → `apps/patlix-people-api`
- `PatlixStudio/patlix-people-shared` → `libs/patlix-people-shared`
- `PatlixStudio/aurel-core` → `apps/aurel-core`
- `PatlixStudio/aurel-core-contracts` → `libs/aurel-core-contracts`

```bash
git submodule update --init --recursive
```

> Arkadion was previously a standalone workspace (its old `arkadion` wrapper repo is archived on GitHub). `apps/arkadion-web` and `apps/arkadion-api` are the working locations now.

> Aurel Core is a .NET project outside the Nx workspace structure (uses `dotnet` CLI, not `nx`). It provides gRPC services on port 50051 and an Avalonia desktop UI. It also has a shared contracts library at `libs/aurel-core-contracts`.

> Development happens inside each project's repo; the workspace repo tracks the submodule commits.

## Documentation

- API reference: http://localhost:3000/api/docs (Swagger UI)
- This repo: `AGENTS.md` documents the conventions for AI coding agents.
