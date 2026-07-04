# UX & quality gates

Automated checks for accessibility, performance hooks, and error recovery.

```bash
npm run audit:ux
```

## Accessibility (`accessibility-audit.mjs`)

- Skip-to-content link in `AppShell`
- `aria-label` on icon-only navigation controls
- `prefers-reduced-motion` styles in `globals.css`
- Playwright QA checklist covers skip link

## UX polish (`ux-polish-audit.mjs`)

- `allowedDevOrigins` for local Playwright
- Cached Match-Feed (`getCachedSocialFeed`)
- LCP `fetchPriority` on first feed media
- Global `error.tsx` recovery surface

## Manual follow-ups (roadmap §5)

- axe-core scan in Playwright for major pages
- Lighthouse CI budget on PR previews
- Keyboard trap audit for comment sheet and story viewer
