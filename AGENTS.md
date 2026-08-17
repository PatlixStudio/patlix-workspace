<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Project conventions — patlix-workspace

Stack and rules for this workspace:

- **Frontend** = Angular (standalone) + Angular Material **M3** + SCSS. Use `@nx/angular:app` generators.
- **Backend** = NestJS + **TypeORM** + **PostgreSQL**. Use `@nx/nest:app` generators.
- **Shared code** = `libs/shared` (`@patlix/shared`) for DTOs/types consumed by both apps. Keep it framework-agnostic (plain types/enums only).
- **Always add Swagger** (`@nestjs/swagger` at `/api/docs`) and **code documentation** (TSDoc on every public member, README per app).
- Every project in `apps/*` / `libs/*` is its **own git repo** wired in as a git **submodule**. Work inside each project repo; the workspace repo tracks submodule commits. Repo naming: Patlix's own apps are `patlix-<name>` (`patlix-web`, `patlix-api`, `patlix-shared`); feature projects keep `<name>-web` / `<name>-api` (e.g. `arkadion-web`, `arkadion-api`).
- npm is the package manager. Strict TypeScript, ESLint + Prettier, tests (Jest for api, Vitest for web/shared).
- Module boundaries are enforced via `scope:*` tags in `eslint.config.mjs` (`scope:web`, `scope:api`, `scope:shared`). `arkadion-*` projects run their own tooling via `nx:run-commands` and are not bound to the patlix scope tags.

## Resource-constrained machine (important)

This WSL2 box has ~3.8 GB RAM. Nx tasks can OOM / hit vitest worker timeouts when run in parallel:

- Always run multi-project task batches with `--parallel=1`:
  `npx nx run-many -t lint test build --parallel=1`
- Prefer serving one app at a time. `web:test` is heavy (bundles the Angular app) — run it alone.

## Port allocation (mandatory rule)

Every project owns a **dedicated port pair** — API on `30xx`, web on `42xx` (web = api + 1200). Never reuse another project's port; never change an assigned port unless it collides with another project.

| Project              | API   | Web   |
| -------------------- | ----- | ----- |
| patlix (`api`/`web`) | 3000  | 4200  |
| arkadion             | 3001  | 4201  |
| falina               | 3002  | 4202  |
| aurel-dashboard      | 3003  | 4203  |
| patlix-world         | 3004  | 4204  |
| *next free*          | 3005  | 4205  |

- **New project → next free pair:** API `3005`, web `4205` (increment until unused). Then update this table, the `Common commands` section below, the app README, and any proxy/env files.
- **API port** = `process.env.PORT ?? <api>` in `src/main.ts`; **web port** = `"port"` in the Nx serve config (`project.json` / `angular.json`); web proxy target must equal the API port.
- Reserved infra (do not reassign): Postgres `5432`, Redis `6379`, patlix-speaches `8969`.

## Common commands

- `npx nx serve api` → API on :3000, Swagger at `/api/docs`
- `npx nx serve web` → dashboard on :4200 (proxies `/api` → :3000)
- `npx nx serve arkadion-api` → :3001 (needs its own deps: `npm install --prefix apps/arkadion-api`)
- `npx nx serve arkadion-web` → :4201 (needs its own deps: `npm install --prefix apps/arkadion-web`)
- `npx nx serve falina-api` → :3002 (needs its own deps: `npm install --prefix apps/falina-api`)
- `npx nx serve falina-web` → :4202 (needs its own deps: `npm install --prefix apps/falina-web`)
- `npx nx serve aurel-dashboard-api` → :3003 (needs its own deps: `npm install --prefix apps/aurel-dashboard-api`), Swagger at `/api/docs`
- `npx nx serve aurel-dashboard-web` → :4203
- `npx nx serve patlix-world-api` → :3004 (needs its own deps: `npm install --prefix apps/patlix-world-api`)
- `npx nx serve patlix-world-web` → :4204 (needs its own deps: `npm install --prefix apps/patlix-world-web`)
- `npx nx lint|test|build <project>` for a single project
- `npx nx run-many -t lint test build --parallel=1` for all quality gates
- `npx nx g @nx/angular:app <name> --directory=apps/<name> --style=scss --routing --unitTestRunner=vitest-angular`
- `npx nx g @nx/nest:app <name> --directory=apps/<name> --unitTestRunner=jest`
- `npx nx g @nx/js:lib <name> --directory=libs/<name> --importPath=@patlix/<name>`

## Database & shared infra

- Postgres runs in Docker Desktop on Windows at `localhost:5432` — container `patlix-postgres` (superuser `arkadion`/`arkadion`, volume `patlix_pgdata`). Start/stop via `docker compose` at the workspace root (also manages `patlix-speaches` on :8969).
- Each project uses its own DB inside the shared Postgres: `patlix` (role `patlix`, `apps/api/.env`), `arkadion` (`apps/arkadion-api/.env`), `falina` (`apps/falina-api/.env`), `patlixworld` (`apps/patlix-world-api/.env`). `aurel-dashboard-api` is stateless (in-memory) — no DB.
- Schema auto-syncs (`synchronize: true`) — dev only.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Agent coordination (shared workspace)

This repo is shared by openclaw (Aurel, orchestrator) and opencode (executor). Rules:

- **Lock before editing:** `agent-lock acquire . <owner>` before a multi-edit session;
  `agent-lock release . <owner>` when done. Check `agent-lock status .` first. One heavy
  writer at a time — never edit while another agent holds the lock.
- **Ledger:** tasks/plans go into the durable ledger `atask` (`atask list` shows what's
  running/queued). Create one via `atask new`; update status as you work.
- **Gate:** never claim done without `nx-verify <project>` (lint+test+build, `--parallel=1`).
  This box has ~3.8GB RAM — never run parallel heavy Nx tasks; serve one app at a time.
- **Design workflow:** use the `designer` agent for UX-image → UI work; never guess hexes.
