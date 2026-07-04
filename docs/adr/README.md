# Architecture Decision Records (ADR)

Lightweight records for decisions that affect Zigo's data model, feed logic, or deployment workflow.

| ADR | Title | Status |
| --- | --- | --- |
| [0001](./0001-match-feed-via-user-interests.md) | Match-Feed via `user_interests` | Accepted |
| [0002](./0002-social-feed-vs-content-feed.md) | Separate `social/` and `feed/` modules | Accepted |
| [0003](./0003-social-feed-keyset-pagination.md) | Keyset pagination for social feed | Accepted |
| [0004](./0004-migration-baseline-plan.md) | Migration squash / baseline plan | Proposed |

When adding a new ADR:

1. Copy the template section from any existing ADR.
2. Use the next sequential number.
3. Link related migrations, routes, and smoke invariants.
