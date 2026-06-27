# Features Architecture (SaaS Modular Layer)

Zigo is migrating from flat `src/lib/domain/` + `src/components/` to a **feature-first** layout under `src/features/`.

## Folder contract

Each feature module owns:

```
src/features/<feature>/
  types/        # Zod schemas + inferred TS types
  services/     # Supabase/domain orchestration (server-safe)
  hooks/        # Client data hooks (TanStack Query target)
  components/   # Feature UI barrels (re-export or colocate)
  index.ts      # Public barrel
```

Current modules:

| Module | Scope |
| --- | --- |
| `shared` | Global error handler, API wrappers, role constants |
| `auth` | Supabase session gates, registration schemas |
| `booking` | Lesson slots, reservations, conflict checks |
| `lesson` | Parent–teacher lesson requests |
| `profile` | User profile, interests, children |
| `dashboard` | Parent analytics cards, weekly progress |

**Rule:** New feature code goes in `src/features/<name>/`. Existing `src/lib/domain/` remains source of truth until migrated; feature `services/` wrap domain helpers instead of duplicating logic.

## Global error handler

Use `@/features/shared` (or `@/features/shared/errors/global-error-handler`) for API routes:

```ts
import { jsonError, jsonSuccess, withApiHandler } from "@/features/shared";
import { requireAuthenticatedProfile, isErrorResponse } from "@/features/shared";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, { roles: ["parent"] });
  if (isErrorResponse(profileOrError)) return profileOrError;
  return jsonSuccess(await fetchSomething(supabase, profileOrError.id));
}, { fallbackMessage: "Could not load resource." });
```

Standard error JSON:

```json
{ "error": "Human message", "code": "FORBIDDEN" }
```

Mapped codes: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `RATE_LIMITED`, `SUBSCRIPTION_REQUIRED`, `MODERATION_BLOCKED`, `BAD_REQUEST`, `INTERNAL_ERROR`.

Legacy `@/lib/domain/api-errors` re-exports the same handler for backward compatibility.

## Roles & security

- **Auth:** Supabase SSR (`middleware.ts` + RLS). Not NextAuth.
- **Roles:** `teacher`, `parent`, `student` (PostgreSQL `user_role`).
- **Institution:** registration `accountKind`, not a separate middleware role.
- **API:** use `requireAuthenticatedProfile()`; page guards stay in `middleware.ts`.

## Roadmap (next phases)

1. ~~TanStack Query in feature `hooks/`~~ — **live** across booking UI
2. ~~Zod on ecosystem + profile + social API routes~~ — complete
3. ~~Hand-maintained DB Zod schemas~~ — `features/shared/types/db-schemas.ts` + `npm run db:schemas:check`
4. zod-prisma or SQL-first codegen from `supabase/migrations` (future automation)
5. Role-aware route middleware helpers per feature
6. ~~Move booking UI into `features/booking/components/`~~ — done (legacy `@/components/*` re-exports kept)
7. ~~Migrate admin API routes to `withAdminApiHandler`~~ — `/api/admin/*` uses `features/shared/api/rbac.ts`
8. Migrate remaining API routes (billing, auth helpers) to `withApiHandler`
9. ~~Role-aware page middleware~~ — `features/shared/middleware/role-guards.ts` (+ `/admin` platform admin guard)

## Modules

| Module | Scope |
| --- | --- |
| `questions` | Match-feed Q&A, teacher answers |
| `learning` | Quiz play/submit, micro video rewards, teacher quiz create |
| `matching` | Student needs, teacher matching RPC, weekly progress |
| `notifications` | In-app feed, dispatch, Supabase Realtime bridge |
| `social` | Feed, likes, comments, stories, reports, upload |

## Role middleware (RBAC)

- Rules: `ROLE_PATH_RULES` in `features/shared/middleware/role-guards.ts`
- Auth: Supabase session + `public.users.role` (not raw JWT parse in middleware)
- Login: `/auth` (`/login` redirects)
- Institution accounts use `role = teacher`
- Wired in root `middleware.ts` after auth gate `ready`
- Wrong role → redirect to `/teacher`, `/parent`, or `/student`
- `/admin` → `current_user_is_platform_admin` RPC; non-admin → role dashboard
- `/dashboard/teacher|parent|student` aliases redirect to canonical paths
- Admin API: `withAdminApiHandler()` + `API_RBAC_PREFIX_RULES` in `features/shared/api/rbac.ts`
- Cursor rule: `.cursor/rules/rbac-middleware.mdc`

## DB schema tooling

- Mirrors: `src/features/shared/types/db-schemas.ts`
- `npm run db:schemas:check` — unit validation
- `npm run db:schemas:sync` — coverage report vs `database.types.ts`

## TanStack Query

- Provider: `src/features/shared/providers/query-provider.tsx` (wired in `src/app/layout.tsx`)
- Booking hooks: `useBookings`, `useCancelBooking`, `useCreateBooking`, `useUpdateBookingStatus`, `useTeacherAvailability`, `useTeacherOpenSlots`
- Client fetch helper: `src/features/shared/api/client-fetch.ts`
- Booking UI lives in `src/features/booking/components/` (with legacy re-exports under `src/components/`)

Reference: `docs/domain-modules.md` for legacy domain boundaries.
