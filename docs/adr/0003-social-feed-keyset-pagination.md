# ADR 0003: Keyset pagination for social feed

## Status

Accepted

## Context

Offset pagination on ranked social feeds degrades as tables grow and duplicates rows when new posts arrive between pages. `hydrateSocialPosts` previously issued N+1 count queries per page.

## Decision

- Database fetch uses keyset cursor on `(created_at DESC, id DESC)`.
- API exposes `meta.nextCursor`; legacy `offset` remains for older clients.
- Interaction counts batch-load with `.in("post_id", postIds)`.
- Home For You feed uses `unstable_cache` tagged `social-feed`, invalidated on post create via `revalidateTag`.

## Consequences

- Client infinite scroll should prefer cursor over offset.
- Ranking still happens in memory after fetch; cursor reflects raw DB order, not `ranking_score`.
- Performance smoke checks reference `encodeFeedCursor` and batch hydration helpers.
