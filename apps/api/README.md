# patlix-api

NestJS REST API for the Patlix workspace dashboard: authentication (JWT) and project management.

## Stack

- NestJS 11 + TypeORM + PostgreSQL
- Swagger docs at `/api/docs` (JWT bearer auth)
- `@nestjs/config` (`.env`), global ValidationPipe, CORS enabled
- Jest unit tests
- Shares DTO contracts with the frontend via `@patlix/shared`

## Run

```bash
npx nx serve api
# API:      http://localhost:3000/api
# Swagger:  http://localhost:3000/api/docs
```

Configuration lives in `.env` (see `.env.example`). PostgreSQL must be reachable at `localhost:5432` (Docker Desktop on Windows).

On first start the app seeds:

- an **admin user** (`admin@patlix.dev` / `admin123`, override in `.env`)
- **5 workspace projects** so the dashboard has content

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api` | — | API metadata |
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/register` | — | Create account |
| GET | `/api/auth/me` | Bearer | Current user profile |
| GET | `/api/projects` | Bearer | List all projects |
| GET | `/api/projects/:id` | Bearer | Single project |
| POST | `/api/projects` | Bearer | Create project |
| PUT | `/api/projects/:id` | Bearer | Update project |
| DELETE | `/api/projects/:id` | Bearer | Delete project |

## Structure

```
src/
├── main.ts                      # bootstrap: Swagger, ValidationPipe, CORS
└── app/
    ├── app.module.ts            # ConfigModule + TypeORM + feature modules
    ├── entities/                # User, Project (TypeORM entities)
    ├── auth/                    # AuthModule: JWT login/register, JwtAuthGuard
    ├── users/                   # user data access
    ├── projects/                # ProjectsModule: CRUD + DTO validation
    └── seed/                    # SeedService: admin + sample projects
```

## Conventions

- Every endpoint is documented with `@nestjs/swagger` decorators.
- Every public service/entity member has a TSDoc comment.
- DTOs implement the shared contracts from `@patlix/shared` and validate with `class-validator`.
- New features get a module with controller + service + spec.

## Quality

```bash
npx nx lint api
npx nx test api
npx nx build api
```
