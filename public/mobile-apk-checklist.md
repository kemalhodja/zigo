# Zigo Mobile APK Checklist

1. Deploy the Next.js app to a reachable HTTPS URL.
2. Set `CAPACITOR_SERVER_URL` to that hosted URL before `cap sync`.
3. Add `/auth/callback` to Supabase Auth redirect URLs.
4. Apply Supabase migrations `001` through `023`.
5. Test `/auth`, `/onboarding`, `/`, `/micro`, `/sparks`, `/create`, `/profile`, and `/moderation` on the hosted URL.
6. Run `npm run android:preflight` and confirm `android/app/src/main/assets/capacitor.config.json` does not contain `localhost`.

Build:

```bash
set CAPACITOR_SERVER_URL=https://your-zigo-domain.example
npm run android:preflight
npm run android:sync
npm run android:open
```

If Windows or OneDrive locks `.next`, use `npm run build:safe` before syncing Android.

Release bundle:

```bash
set CAPACITOR_SERVER_URL=https://your-zigo-domain.example
npm run android:build:release
npm run android:copy:release
```
