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
4. **Ports (avoid collisions):** arkadion=:3001/:4201, falina=:3002/:4202, **aurel-dashboard=:3003/:4203, patlix-world=:3004/:4204**.
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
- [x] **M1 — Backend core:** auth/users, companies/properties/projects, agents/tasks, world zones, event bus + WS gateway, seed. (DB `patlixworld` must be created in Postgres.)
- [x] **M2 — Models + Aurel:** port provider chain into `models`; orchestration request→plan→assign.
- [x] **M3 — Tools:** permissioned OpenCode executor → real task, streamed progress events.
- [x] **M4 — Web shell:** WS service, WorldStateStore, WorldAdapter, inspector/map/chat UI, auth.
- [x] **M5 — 3D world:** renderer, terrain, water, trees, sky, lighting, HQ building.
- [x] **M6 — Character system:** shared rig + animation controller + GLB loader (placeholder Mixamo assets).
- [x] **M7 — Player controller:** third-person camera + walk/run/jump + Rapier physics.
- [x] **M8 — AI behavior:** state→navmesh→animation; minimap/waypoint/compass; interaction prompts.
- [x] **M9 — End-to-end:** full MVP scenario + observability panel + approval stub.
- [ ] **M10 (next) — Hardening:** agent state machine per role (pick only idle agents, reuse role-matched busy agents), prompt/workspace guardrails, run metrics + outbox cleanup, minimap zone labels.

## Current state

- **Done:** M0 complete. **M1 complete** — backend core implemented, typechecked, linted, tested, and verified end-to-end: auth (register/login/JWT), users, companies, properties, projects, agents, tasks, workflows, events outbox→WS (`/world` socket, JWT handshake), world zones + `GET /api/world/snapshot`, idempotent seed (demo user `dev@patlix.studio`/`patlixworld`; zones beach/hq/forest/village/river/mountain; company "Patlix"; property "Patlix HQ" at hq zone; project `patlix-world-web`; agents Aurel/Developer-01/Designer-01; task "Implement JWT authentication"). API pushed (commit `4dca02d`); runs at :3003, Swagger `/api/docs`.
  - Notes: union-typed (`string | null`) columns need explicit `type:` in entities (TypeORM). `allowScripts` added to api `package.json` so shared-lib build runs on install. Avoid `pkill -f` patterns that match the shell's own command line.
- **Done:** **M2 complete** — `models` module (provider chain NVIDIA→Google→Groq→OpenRouter→Ollama, provider-agnostic; `ModelsService.chat`) + `orchestration` module (Aurel: `POST /api/orchestration/requests` → plan → assign; `plans` table, `PlanDto`/`PlanStepDto` in shared; LLM plan with deterministic local-planner fallback; steps materialized as Tasks with `planId`, agents assigned by role). Verified end-to-end with local fallback (no provider keys/ollama yet); pushed.
- **Done:** **M3 complete** — `tools` module: permissioned OpenCode executor (`POST /api/tools/execute`), runs `opencode run --format json [--auto]` in an allowed patlix-world repo (workdir whitelist), streams `agent.tool.started/message.sent/completed/failed` + task/agent updates over `/world`, persists `tool_runs` (transcript + tokens/cost). Verified end-to-end: executed the seeded task via real OpenCode, agent created a file in `apps/patlix-world-web`, task→REVIEW/100%, agent→IDLE. `WORLD_WORKSPACE_ROOT` + `OPENCODE_BIN`/`OPENCODE_AUTO` env knobs.
- **Done:** **M4 complete** — web shell (`patlix-world-web`, Angular 22 standalone, :4203): `AuthService` (login/register, token in localStorage), `WorldSocketService` (`/world` socket.io with JWT handshake), `WorldStateStore` (signals; consumes every `PatlixEvent` incl. plans/plan-step-assigned), `ApiService` (snapshot + orchestrate + tools), `WorldAdapter` seam with `ConsoleWorldAdapter` placeholder (real Three.js impl in M5+), HUD: workforce list, inspector, task panel, Aurel plan panel (ask→plan&assign), activity/event feed. 5 vitest specs for the store pass; `ng build` clean; dev server verified on :4203. Pushed (web repo identity set: PatlixStudio/dev@patlix.studio).
- **Done:** **M5 complete** — 3D world: `RendererService` (WebGL renderer, ACES tone mapping, shadows, OrbitControls stand-in camera, animation loop + `onFrame` hooks), `EnvironmentService` (deterministic height field terrain with vertex colors by height, water plane, seeded trees, sky/fog/hemisphere+directional sun, Patlix HQ tower at hq zone (-40,-60), zone ring+label markers), `ThreeWorldAdapter` implements the `WorldAdapter` contract (capsule agents colored by status, labels, live position from backend, ground snap + bob). `WORLD_ADAPTER` InjectionToken for swappable adapters. 9 vitest specs pass; `ng build` clean.
- **Done:** **M6 complete** — character system (`three/characters/`): `Character` contract with animation states idle/walk/work/blocked (`animationForStatus` maps agent status→anim); `ProceduralCharacter` built-in humanoid rig (torso/head/hat/limbs, breathing idle, limb-swing walk, typing work, slouch blocked); `GlbCharacter` Mixamo-style GLB loader (GLTFLoader + AnimationMixer, clip-keyword mapping, crossfade); `CharacterManager` loads `public/assets/characters/<name>.glb` with automatic procedural fallback. `ThreeWorldAdapter` now drives rigged characters (group + label + async load; position from backend; status-driven animation). `public/assets/characters/README.md` documents asset naming (user supplies GLBs per decision #7). 12 vitest specs pass.
- **Done:** **M7 complete** — player controller (`three/player/`): `InputService` (WASD/arrows + Shift run + Space jump, pointer-drag orbit, wheel zoom), `PlayerControllerService` (Rapier dynamic capsule body + heightfield ground collider from the terrain height field, gravity/jump, CCD; movement relative to camera yaw; ground clamp; character via `CharacterManager.load('player')`, heading from velocity, idle/walk animation; damped third-person camera follow). `RendererService.enableCameraControl()` + `canvas()` helpers; OrbitControls disabled once the player spawns. Player spawns at the beach zone center from the World component. 15 vitest specs pass; `ng build` clean.
- **Done:** **M8 complete** — AI behavior HUD: `WaypointService` (flag marker + ring in the 3D scene, `distanceTo`/`bearingTo` compass math), `InteractionService` (per-frame raycast from the camera center → nearest agent within 6m in front → `[E] Inspect` prompt; E selects the agent in the store → inspector), `Minimap` component (canvas top-down: zones by kind, agents colored by status, player arrow from live position/heading, waypoint flag; click sets a waypoint; compass strip N/E + waypoint distance/bearing), `PlayerControllerService` now exposes `position`/`heading`/`moving` signals for the HUD, `ThreeWorldAdapter` does smooth waypoint travel for NAVIGATING/ASSIGNED agents (walk animation + heading while traveling). World shell wires E-key + interaction prompt button + minimap overlay. 21 vitest specs pass; `ng build` clean; dev server restarted on :4203 after stale-cache NG2012.
- **Done:** **M9 complete** — end-to-end AI workforce: **approval gate** (`PlanStatus.PENDING_APPROVAL`/`REJECTED`; `POST /plans/:id/approve`|`/reject`; `OrchestrationRequest.requireApproval` default true via `ORCHESTRATION_REQUIRE_APPROVAL`), **ExecutorModule** (sequential real-work driver: agent NAVIGATING→walk→`ToolsService.executeAndWait` (opencode), step/plan status progression, self-healing bootstrap resume of ACTIVE plans with unfinished steps), **observability** (`Timeline` panel: live event feed with agent/task/plan/system filters; `PlanPanel` loads plans on init + approval/reject buttons + live step dots; `Minimap` auto-fits zone bounds). Verified live: seeded scenario "Ship a version footer" → approved via API → agents traveled (NAVIGATING) → ran real opencode runs in `apps/patlix-world-web` (analyze Developer-01, implement, review Designer-01) → plan COMPLETED, all steps COMPLETED. Found during e2e: api `nest start --watch` restarts if an agent writes outside its repo (it touched `libs/patlix-world-shared` → added prompt constraint "work only inside current repo, no commits"); executor was stranded once by a restart → fixed via bootstrap resume. Agent demo artifacts (orphan version-footer component, version.ts, tsconfig `resolveJsonModule`, shared `health.ts`) were reverted after the run to keep repos clean; stranded RUNNING tool_runs marked FAILED. 22 vitest specs + api jest pass; web `ng build` clean. All repos pushed.
- **Known gaps / next:** agents 2+ same role fall back to any idle agent (Aurel executed the implement step — role matching only considers idle agents); tool-run token accounting shows 0 for free-tier runs; a full plan run takes ~15 min (3 sequential free-tier opencode runs) — consider concurrency + faster model. M10 hardening list above.
- **Workflow rule:** work only in the patlix-world repos; commit/push each repo separately; never modify other submodules.
- **Note:** parent nx has scope tags; `patlix-world-*` project.json files reference the parent `../../node_modules/nx/...` schema. Shared lib is built by api's `prestart` hook.

## MVP scenario to prove

User spawns on a beach → third-person walk/run + camera orbit → open map → select Patlix HQ property → waypoint → physically travel through forest → reach building → see Aurel/Developer/Designer characters with real backend state → Developer runs a real task (OpenCode) → status/activity reflected → approach → `[E] Inspect/Talk` → contextual panel → leave → agents keep working without the user watching.
