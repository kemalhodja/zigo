# Zigo Mobile APK Checklist

Use this checklist before building an Android APK.

## Required

1. Deploy the Next.js app to a reachable HTTPS URL.
2. Set `CAPACITOR_SERVER_URL` to that hosted URL before `cap sync`.
3. Keep Supabase Auth redirect URLs aligned with the hosted app:
   - `https://zigo.app/auth/callback`
4. Apply Supabase migrations `001` through `055` (`npm run migrations:cloud` or `npm run migrations:pending` for 050–055 only).
5. Test these routes on the hosted URL before opening Android Studio:
   - `/auth`
   - `/onboarding`
   - `/`
   - `/micro`
   - `/sparks`
   - `/create`
   - `/profile`
   - `/moderation`
6. Run `npm run android:preflight` and confirm generated Android config does not contain `localhost`.

## Build

```bash
set CAPACITOR_SERVER_URL=https://zigo.app
npm run android:preflight
npm run android:sync
npm run android:open
```

Signing (Play Store release):

```bash
copy android\keystore.properties.example android\keystore.properties
# Edit keystore.properties, generate zigo-release.keystore with keytool
npm run android:build:release
npm run android:copy:release
```

If `CAPACITOR_SERVER_URL` is missing, the APK shows the packaged setup fallback page instead of trying to open `localhost`.
If Windows or OneDrive locks `.next`, use `npm run build:safe` before syncing Android.

Release bundle:

```bash
set CAPACITOR_SERVER_URL=https://zigo.app
npm run android:build:release
npm run android:copy:release
```
