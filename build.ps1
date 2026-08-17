$env:CAPACITOR_SERVER_URL = "https://zigo-kohl.vercel.app"

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run android:build:release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run android:copy:release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
