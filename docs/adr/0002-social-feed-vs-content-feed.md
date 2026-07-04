# ADR 0002: Separate social/ and feed/ domain modules

## Status

Accepted

## Context

Migration `039_unified_content_posts.sql` introduced `social_posts`, while older `/learn` flows still use the unified content feed over legacy `posts` semantics. Merging both into one module caused smoke regressions and unclear ownership.

## Decision

- **`src/lib/domain/social/`** owns Instagram-style social surfaces: hydrated cards, likes, stories, `/api/social/posts`.
- **`src/lib/domain/feed/`** owns legacy unified content feed helpers for `/learn` and migration adapters.
- Legacy HTTP routes (`POST /api/posts`) return **410 Gone** with a replacement hint.

## Consequences

- New social features extend `social/` only.
- `docs/domain-modules.md` documents import boundaries.
- Dead-code and smoke audits treat both modules as first-class.
