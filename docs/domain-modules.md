# Domain module boundaries

Zigo domain logic lives under `src/lib/domain/`. API routes should stay thin: parse input, load auth profile, call domain helpers, map errors via `respondWithDomainError`.

## Feed modules (do not merge)

| Module | Role | Consumers |
| --- | --- | --- |
| `social/feed.ts` | Instagram-style social feed: pagination, post types, hydrated cards, Match-Feed for `/api/social/posts` and home | Social API, explore, profile grids |
| `feed/` | Legacy unified content feed (`getPersonalizedFeed`) for `/learn` and older `posts` table migration path | `learn/page.tsx`, legacy adapters |

**Rule:** new social features use `social/`. Only extend `feed/` when touching the unified content model or `/learn` quiz+post bridge.

## Modular domains (2.1)

| Barrel | Submodules |
| --- | --- |
| `social.ts` | `types`, `schemas`, `helpers`, `feed`, `interactions`, `safety` |
| `learning.ts` | `types`, `schemas`, `progress`, `quiz`, `awards` |
| `questions.ts` | `schemas`, `queries`, `mutations` |
| `feed.ts` | `schemas`, `types`, `queries`, `mutations` |

After splitting a domain, update `readLearningDomain()` / `readSocialDomain()` in `scripts/smoke-test.mjs` if smoke invariants reference implementation strings.

## HTTP error mapping

All write routes should prefer:

```ts
import { respondWithDomainError, RateLimitExceededError } from "@/lib/domain/api-errors";

try {
  // domain call
} catch (error) {
  return respondWithDomainError(error, "Fallback message", 400);
}
```

Mapped errors:

| Error | HTTP | Code |
| --- | --- | --- |
| `ModerationRejectedError` | 422 | `MODERATION_BLOCKED` / AI codes |
| `RateLimitExceededError` | 429 | `RATE_LIMITED` |
| `DomainForbiddenError` | 403 | `FORBIDDEN` or custom |

## Legacy API deprecation

| Route | Status | Replacement |
| --- | --- | --- |
| `POST /api/posts` | **410 Gone** | `POST /api/social/posts` |
| `GET /api/feed` | maintained | prefer `GET /api/social/posts` for new clients |

Telemetry: legacy routes return explicit `410` with migration hint (see `src/app/api/posts/route.ts`).

## Public import surface

Prefer `@/lib/domain/<module>` for tree-shaking. Barrel `@/lib/domain/index` exports core modules for scripts and tooling only.
