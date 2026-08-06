# patlix-shared

Shared DTOs, enums and types consumed by both `patlix-web` (Angular) and `patlix-api` (NestJS).

Import as `@patlix/shared`.

## Contents

- `user.dto.ts` — `UserDto`, `UserRole`
- `project.dto.ts` — `ProjectDto`, `ProjectStatus`
- `auth.dto.ts` — `LoginRequestDto`, `RegisterRequestDto`, `AuthResponseDto`, `AuthUser`

## Conventions

- **Framework-agnostic**: plain TypeScript types/enums only. No runtime dependencies on Angular or NestJS.
- The API DTO classes implement these interfaces and add `class-validator` + Swagger decorators locally.
- Add a contract here first, then implement it in `apps/api` and consume it in `apps/web`.

## Quality

```bash
npx nx lint shared
npx nx test shared
npx nx build shared
```
