# ADR 0001: Match-Feed via user_interests

## Status

Accepted

## Context

Zigo learners and parents must only see teacher content in education areas they selected. Teachers publish only in assigned areas. The product should feel like a social feed, but authorization and ranking must stay area-scoped.

## Decision

- Feed queries filter `social_posts.area_id` against the viewer's `user_interests.area_id` rows.
- Teachers write posts and answers only when `area_id` is in their own `user_interests`.
- Parents and students never create posts; they create questions in selected areas.

## Consequences

- Every new feed surface must preserve the Match-Feed invariant (see `getSocialFeed` and migration `014_social_match_feed_rls.sql`).
- Smoke and live matrix tests assert cross-area leakage is blocked.
- Explore/search features inherit the same area filter unless explicitly documented otherwise.
