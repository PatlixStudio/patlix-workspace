# Patlix World — Decision Log & Build State

> Persistent memory for the Patlix World project. **On restart/failure, read this file first and continue from the Current State section.**

## Product

**Patlix World** = an open 3D world where human users live/explore, own properties, companies/projects have physical buildings, and **real AI agents** perform real work. Third-person open-world interaction (GTA-style), NOT a dashboard, NOT an office simulator, NOT top-down.

- Central orchestrator: **Aurel** (plans → assigns agents → monitors → recovers). Aurel doesn't do the work itself.
- **Critical principle:** backend is the source of truth. `LLM → agent reasoning → orchestration → task → tool → real execution → backend state → events → Angular → WorldStateStore → WorldAdapter → Three.js`. The 3D renderer is a consumer. No fake AI behavior, no teleport by default, no floating UI cards for agents.
- Providers are interchangeable (OpenCode, OpenClaw, Ollama, NVIDIA, OpenAI-compatible). Never hard-code one LLM.

## Fixed decisions

1. **Frontend:** Angular 22 standalone + Three.js directly (NO React / NO React Three Fiber). WebGPU preferred, WebGL fallback.
2. **Backend:** NestJS 11 + TypeORM + PostgreSQL. WebSockets (socket.io) for realtime.
3. **New repos (submodules in `patlix-workspace`):**
   - `apps/patlix-world-api` → https://github.com/PatlixStudio/patlix-world-api
   - `apps/patlix-world-web` → https://github.com/PatlixStudio/patlix-world-web
   - `libs/patlix-world-shared` → https://github.com/PatlixStudio/patlix-world-shared
4. **Ports (avoid collisions):** arkadion=:3000/:4201, falina=:3002/:4202, **patlix-world=:3003/:4203**.
5. **Shared lib import:** `@patlixworld/shared` via `file:../../libs/patlix-world-shared`; built with `tsc` before api start (see api `prestart`/`prestart:dev`).
6. **DB:** user `patlixworld` / password `patlixworld` / db `patlixworld` on localhost:5432, `synchronize:true` dev-only.
7. **Assets:** use ready models as placeholders (Mixamo-compatible GLB with animations). User can download and place them under the project (web `public/`). Runtime = GLB/GLTF; FBX/Blender/Mixamo only as source.
8. **Per-project workflow:** when working on one project, do not touch others. Commit/push per project repo independently.
9. **Reuse (patterns, not code):** arkadion `LlmService` provider chain (NVIDIA→Google→Groq→OpenRouter→Ollama), arkadion `ChatGateway` JWT+WS, arkadion `avatar.ts` GLB/WebGL loader.
10. **Tool execution:** real work via `opencode` CLI (v1.18.18 installed). Permissioned tool layer.
11. **Player + AI share one character system** (rig/animation/physics/navigation); only the control source differs.
12. **World:** one continuous environment, not isolated scenes. Map = navigation tool (select → close map → waypoint → physical travel). Minimap stays clean.

## Architecture (target)

**Backend modules:** `auth`, `users`, `companies`, `properties`, `projects`, `agents`, `tasks`, `workflows`, `orchestration` (Aurel), `models` (providers), `tools` (OpenCode), `events` (outbox→WS), `world` (zones/spatial), `gateway` (`/world` socket, JWT), `persistence`.

**Frontend layers:** WebSocketService → WorldStateStore (signals) → WorldAdapter (state→3D, no business logic) → Three.js (Scene/Camera/Third-person controller/Terrain/Water/Buildings/Characters/Animation/Navigation/Rapier physics/Interaction/Minimap). Angular UI: inspector, task panel, chat, map overlay.

**Events:** `agent.created/updated/status.changed/location.changed/task.*/tool.*/message.*`, `project.*`, `property.*`, `company.*`, `task.*`, `workflow.*` (full list in `libs/patlix-world-shared/src/types/event.ts`).

## Build order (milestones)

- [x] **M0 — Scaffold:** repos created + pushed + submodules wired; shared types (agent/task/project/company/property/world/event/user); NestJS + Angular skeletons; `PATLIX_WORLD_DECISIONS.md`.
- [ ] **M1 — Backend core:** auth/users, companies/properties/projects, agents/tasks, world zones, event bus + WS gateway, seed. (DB `patlixworld` must be created in Postgres.)
- [ ] **M2 — Models + Aurel:** port provider chain into `models`; orchestration request→plan→assign.
- [ ] **M3 — Tools:** permissioned OpenCode executor → real task, streamed progress events.
- [ ] **M4 — Web shell:** WS service, WorldStateStore, WorldAdapter, inspector/map/chat UI, auth.
- [ ] **M5 — 3D world:** renderer, terrain, water, trees, sky, lighting, HQ building.
- [ ] **M6 — Character system:** shared rig + animation controller + GLB loader (placeholder Mixamo assets).
- [ ] **M7 — Player controller:** third-person camera + walk/run/jump + Rapier physics.
- [ ] **M8 — AI behavior:** state→navmesh→animation; minimap/waypoint/compass; interaction prompts.
- [ ] **M9 — End-to-end:** full MVP scenario + observability panel + approval stub.

## Current state

- **Done:** M0 complete. Repos: `patlix-world-shared` (types defined), `patlix-world-api` (NestJS skeleton: main.ts with Swagger + health, ConfigModule, TypeOrmModule), `patlix-world-web` (Angular skeleton: app + routes + environments → :3003/:4203). All committed + pushed; parent workspace at `53b576c`.
- **Next step:** M1 — start with DB setup (create `patlixworld` role/db) and the `events` module (event bus + persisted outbox) + `gateway` (`/world` socket), then agents/tasks/projects/companies/properties entities + seed.
- **Workflow rule:** work only in the patlix-world repos; commit/push each repo separately; never modify other submodules.
- **Note:** parent nx has scope tags; `patlix-world-*` project.json files reference the parent `../../node_modules/nx/...` schema. Shared lib is built by api's `prestart` hook.

## MVP scenario to prove

User spawns on a beach → third-person walk/run + camera orbit → open map → select Patlix HQ property → waypoint → physically travel through forest → reach building → see Aurel/Developer/Designer characters with real backend state → Developer runs a real task (OpenCode) → status/activity reflected → approach → `[E] Inspect/Talk` → contextual panel → leave → agents keep working without the user watching.