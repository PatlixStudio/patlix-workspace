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
- Every project in `apps/*` / `libs/*` is its **own git repo** (`PatlixStudio/patlix-<name>`) wired in as a git **submodule**. Work inside each project repo; the workspace repo tracks submodule commits.
- npm is the package manager. Strict TypeScript, ESLint + Prettier, tests (Jest for api, Vitest for web/shared).
- Module boundaries are enforced via `scope:*` tags in `eslint.config.mjs` (`scope:web`, `scope:api`, `scope:shared`).

## Resource-constrained machine (important)

This WSL2 box has ~3.8 GB RAM. Nx tasks can OOM / hit vitest worker timeouts when run in parallel:

- Always run multi-project task batches with `--parallel=1`:
  `npx nx run-many -t lint test build --parallel=1`
- Prefer serving one app at a time. `web:test` is heavy (bundles the Angular app) — run it alone.

## Common commands

- `npx nx serve api` → API on :3000, Swagger at `/api/docs`
- `npx nx serve web` → dashboard on :4200 (proxies `/api` → :3000)
- `npx nx lint|test|build <project>` for a single project
- `npx nx run-many -t lint test build --parallel=1` for all quality gates
- `npx nx g @nx/angular:app <name> --directory=apps/<name> --style=scss --routing --unitTestRunner=vitest-angular`
- `npx nx g @nx/nest:app <name> --directory=apps/<name> --unitTestRunner=jest`
- `npx nx g @nx/js:lib <name> --directory=libs/<name> --importPath=@patlix/<name>`

## Database

- Postgres runs in Docker Desktop on Windows at `localhost:5432` (container `arkadion-postgres`).
- Dev credentials: user `patlix`, password `patlix`, database `patlix` (see `apps/api/.env`).
- Schema auto-syncs (`synchronize: true`) — dev only.
