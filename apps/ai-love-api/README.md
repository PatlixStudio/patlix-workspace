# ai-love API

Backend for the ai-love AI Companion app: serves the seeded companion catalog (8 female + 6 male profiles) over a REST API.

## Stack

- NestJS 11 (workspace-managed — deps live in the workspace root `package.json`)
- Swagger at `/api/docs`

## Run

```bash
npx nx serve ai-love-api
```

API on :3006. Swagger docs at `http://localhost:3006/api/docs`.

## Endpoints

| Method | Path                    | Description                                        |
| ------ | ----------------------- | -------------------------------------------------- |
| GET    | `/api/companions`       | List companions; `?gender=female\|male`, `?tag=`   |
| GET    | `/api/companions/:id`   | Single companion (e.g. `ava`); 404 when unknown    |

## Ports

- API: `3006` (`process.env.PORT` overrides)

## Status

Milestone 1 — stateless seeded catalog. Chat, profile persistence and the
Postgres-backed data model arrive in later milestones.