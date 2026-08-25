# ai-love — Next milestone (persisted users & polish)

> Recorded 2026-08-26 — carry-over from the in-memory auth milestone.
> This file is the handoff for the next agent / next milestone. Nothing here is implemented yet.

## Goal

Move ai-love from in-memory `Map` auth to a persisted data model, and polish the login-nudge / premium-gated explicit flow shipped in the previous milestone.

## Must do

1. **Postgres + TypeORM for users** (`apps/ai-love-api`)
   - Follow workspace convention: `apps/patlix-api/.env`, `arkadion`, `falina` etc. — each app owns its own DB in the shared `patlix-postgres` container (`AGENTS.md: Database & shared infra`).
   - New DB `ailove` (or `ai_love`), role `ailove` (or reuse `patlix`). Add `apps/ai-love-api/.env` with `DATABASE_URL` / `POSTGRES_*`.
   - Entity `User { id (uuid), email (unique), passwordHash, name, surname, isSubscribed, createdAt }` — shape already matches `auth.service.ts: User`. Keep `surname` field.
   - `TypeOrmModule.forRoot({ synchronize: true })` for dev (same as other apps). Replace the `users = new Map()` in `apps/ai-love-api/src/app/auth/auth.service.ts` with `Repository<User>`. Keep the `UsersStore` helper shape (`getUserById`, `getUserByEmail`, `validateToken`) so the chat controller diff is minimal.
   - Seed / migration: no seed needed; registration creates rows.

2. **Persist guest message counts** (optional but recommended)
   - Today `guestMessageCounts: Map<string, number>` (`guest:${companionId}` → used) resets on restart. Either persist in the same Postgres (table `guest_counters` keyed by IP or a `guestId` cookie) or Redis. If you keep it ephemeral, document that the 3-free-messages limit resets on deploy.

3. **Fix `GET /auth/messages-left` contract**
   - Currently `@Get('messages-left')` with `@Body()` — invalid. Change to `@Get('messages-left')` with `@Query('companionId')` or fold the check into `POST /chat/:id` response (`{ allowed, messagesLeft, needsLogin }`). Update the web client accordingly.

4. **Harden chat auth**
   - Chat today trusts `req.headers['x-user-id']` fallback and an optional `allowExplicit` boolean from the client. Keep the `effectiveExplicit = body.allowExplicit && user?.isSubscribed` server gate (already shipped), but also add a Nest guard / middleware that populates `req.user` from `Authorization: Bearer <jwt>` for all `/chat/**` routes so `getUserId` is not spoofable.

## Nice to have (polish)

- Stripe (or mock) for `POST /auth/subscribe` — today it just flips `isSubscribed = true`.
- Rate limiting on `POST /chat/:id` and `POST /chat/:Id/speak` (TTS).
- E2E test for the full funnel: guest 3 turns → login nudge → free → explicit attempt → premium upsell → premium+explicit → explicit reply + TTS.
- `graphify update .` after schema lands.

## How to resume

```bash
# from workspace root
cat apps/ai-love-api/docs/NEXT_MILESTONE.md
# then follow steps 1–4 above
```

## References

- In-memory impl: `apps/ai-love-api/src/app/auth/auth.service.ts` — look for `TODO(DB):`
- Nudge/premium logic: `apps/ai-love-api/src/app/chat/chat.service.ts` — `effectiveExplicit`, `getLoginNudgeResponse`, `getPremiumUpsellResponse`
- Prestige work already shipped: pill filters, voice per companion, dual M3 themes, typing indicator (see `git log --oneline` `9ac447a`, `52bc3d4`).
