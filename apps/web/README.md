# patlix-web

The main **dashboard** of the Patlix workspace: log in and launch every project from a single place.

## Stack

- Angular (standalone components, no NgModules)
- Angular Material **M3** theme (custom violet/cyan palette, see `src/theme.scss`)
- SCSS + routing + Vitest unit tests
- Consumes `@patlix/shared` DTOs and the `patlix-api` REST API

## Run

```bash
npx nx serve web        # http://localhost:4200
```

The dev server proxies `/api` → `http://localhost:3000` (see `proxy.conf.json`).

## Structure

```
src/
├── main.ts                 # bootstrap (provideHttpClient, animations, router)
├── theme.scss              # Material M3 theme tokens
└── app/
    ├── app.ts/.html/.scss  # shell: toolbar + router-outlet
    ├── app.routes.ts       # /login and dashboard (authGuard)
    ├── app.config.ts       # providers
    ├── core/
    │   ├── auth/           # AuthService (JWT + user state), authGuard
    │   └── http/           # apiInterceptor (attaches Bearer token)
    └── features/
        ├── login/          # login page (Material form)
        └── dashboard/      # project launcher grid (Material cards)
```

## Conventions

- New features go under `features/`, shared code under `core/`.
- Use the `@patlix/shared` DTOs instead of redefining types.
- Every public member is documented; new pages get a spec file.

## Quality

```bash
npx nx lint web
npx nx test web        # heavy (bundles the app) — run alone
npx nx build web
```
