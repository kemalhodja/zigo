# ZIGO Deployment Strategy

## Overview

This document describes the deployment architecture, environments, and rollback procedures for ZIGO.

## Environments

| Environment | URL | Purpose | Auto-deploy Trigger |
|-------------|-----|---------|---------------------|
| **Development** | localhost:3000 | Local development | Manual |
| **Staging** | staging.zigo.app | Pre-production testing | Push to `develop` branch |
| **Production** | zigo.app | Live users | Push to `main` with `release:` prefix or manual |
| **Hetzner (Self-hosted)** | zigo.app (alt) | Alternative hosting | Manual workflow dispatch |

## CI/CD Pipeline (GitHub Actions)

### Pipeline Stages

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Quality     │───▶│ Full Audit  │───▶│ E2E Tests   │───▶│ Deploy      │
│ Gates       │    │ Suite       │    │ (Playwright)│    │ Staging     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │ Deploy      │
                                                  │ Production  │
                                                  └─────────────┘
```

### Quality Gates (every PR/push)
- TypeScript strict check (`npm run typecheck`)
- ESLint (`npm run lint`)
- Security audits (auth, CORS, env leak, service-role, RLS)
- Moderation pipeline audit
- Product scope audit
- Unit tests (343 tests)

### Full Audit Suite (main/develop pushes)
- All 42 audit scripts (`npm run audit:all`)
- Build verification (`npm run build:safe`)

### E2E Tests (main/develop pushes)
- Playwright tests against built preview
- Smoke tests after deployment

## Deployment Commands

### Vercel (Staging)
```bash
npx vercel --token=$VERCEL_TOKEN
```

### Vercel (Production)
```bash
npx vercel --prod --token=$VERCEL_TOKEN
```

### Hetzner (Docker)
```bash
# Standard
docker-compose up -d --build

# Blue-green
docker-compose -f docker-compose.yml -f docker-compose.blue.yml up -d --build
```

## Rollback Procedures

### Vercel Rollback (Instant)
1. Go to Vercel Dashboard → Deployments
2. Click "..." on previous deployment → "Promote to Production"
3. Or use CLI: `vercel rollback <deployment-url>`

### Git-based Rollback (Hetzner/Self-hosted)
```bash
# Record current deployment before deploying
node scripts/deploy-rollback.mjs record production

# Rollback to previous
node scripts/deploy-rollback.mjs rollback
```

### Blue-Green Deployment (Hetzner)
```bash
# Zero-downtime deployment
node scripts/deploy-rollback.mjs blue-green
```

This:
1. Builds new version
2. Deploys to inactive environment (blue/green)
3. Health checks new environment
4. Switches nginx traffic
5. Decommissions old environment

## Environment Variables

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.example` | Template | ✅ Yes |
| `.env.local` | Local development | ❌ No |
| `.env.staging` | Staging config | ❌ No |
| `.env.production` | Production config | ❌ No |

### Required Secrets (GitHub/Vercel)
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
GOOGLE_PLAY_SERVICE_ACCOUNT
HETZNER_SSH_KEY
HETZNER_HOST
HETZNER_USER
```

## Health Checks

All environments expose `/health` endpoint:

```bash
# Local
curl http://localhost:3000/health

# Staging
curl https://staging.zigo.app/health

# Production
curl https://zigo.app/health
```

Expected response: `200 OK` with `{ "status": "healthy" }`

## Monitoring & Alerts

- **Sentry**: Error tracking (all environments)
- **PostHog**: Analytics (all environments)
- **Vercel Analytics**: Web vitals (production)
- **Uptime**: External monitoring on `/health`

## Release Process

1. Ensure all tests pass on `main`
2. Create release commit: `git commit --allow-empty -m "release: v1.2.3"`
3. Push to `main` → triggers production deployment
4. GitHub Release created automatically
5. Android AAB uploaded to Play Console (internal testing)

## Emergency Procedures

### Hotfix
```bash
# Create hotfix branch from main
git checkout -b hotfix/issue-123 main

# Fix issue, test locally
npm run test:unit
npm run build:safe

# Push and create PR to main
# After merge, production deploys automatically
```

### Database Migration Rollback
```bash
# Check migration status
npm run migrations:pending

# Rollback last migration (if down migration exists)
# Manual: run down migration in Supabase dashboard
```

### Feature Flag Emergency Disable
```bash
# Set in Vercel dashboard or .env.production
NEXT_PUBLIC_ENABLE_DUELS=false
# Redeploy
```

## Verification Checklist

After any deployment:

- [ ] `/health` returns 200
- [ ] Home page loads
- [ ] Authentication works (login/signup)
- [ ] Key user flows (quiz, video, duel)
- [ ] Sentry shows no new errors
- [ ] PostHog events flowing
- [ ] Cron jobs executing (check logs)

## Contacts

- **On-call**: Check GitHub Actions for failed deployments
- **Infrastructure**: Hetzner/Vercel dashboards
- **Database**: Supabase dashboard
- **Payments**: Stripe dashboard