# Google Play — Data safety & Families policy checklist

Use this when filling **Play Console → App content** for Zigo (`com.zigo.education`).

**Privacy policy URL (production):** `https://zigo.app/legal/privacy`  
**Static fallback (same content, no React):** `https://zigo.app/privacy-policy.html`  
**Terms URL:** `https://zigo.app/legal/terms`

Canonical production origin for Zigo. **Deploy required** — if `zigo.app` does not load, Play Console cannot verify the link until Vercel/hosting is live.

> Lawyer review still required before public launch. This doc maps **current code behaviour** to Play Console fields — not legal advice.

---

## 1. App content — quick answers

| Play Console item | Zigo answer |
| --- | --- |
| Privacy policy | Required — URL above |
| Ads | **Yes** — verified teachers may run labelled sponsored education posts (`sponsored_label`, click-through URL). No third-party ad SDK in the Android shell. |
| App access | Login required for core features — provide **test accounts** (teacher, parent, student) in the review notes |
| Target audience | **Includes children** (education platform, age groups on education areas, parent-managed child profiles) |
| News app | No |
| COVID-19 apps | No |
| Data safety | See §2 below |
| Government apps | No |
| Financial features | Stripe subscriptions (Zigo Plus) — declare payments |
| Health | No |

---

## 2. Data safety form (field-by-field)

### Collection & sharing (summary)

| | |
| --- | --- |
| **Collects data** | Yes |
| **Shares data** | Yes — with infrastructure/payment/security processors only |
| **Sold** | No |
| **Encrypted in transit** | Yes (HTTPS) |
| **Deletion request** | Yes — `/legal/delete-account`, `request_account_deletion()` |
| **Independent security review** | No (unless you commission one) |

### Data types to declare

For each row: **Collected = Yes**, **Shared = Yes** (service providers), **Ephemeral = No**, **Required = varies**, **Purpose** as listed.

#### Personal info

| Data type | Collected | Purpose | Notes |
| --- | --- | --- | --- |
| **Email address** | Yes | Account management, Developer communications | Supabase Auth + `users.email` |
| **Name** | Yes | Account management, App functionality | `users.full_name`, child `display_name` |
| **User IDs** | Yes | Account management, App functionality | UUID primary keys |
| **Other info** | Yes | App functionality | Role (`teacher`/`parent`/`student`), verification status, organization type |

#### Financial info

| Data type | Collected | Purpose | Notes |
| --- | --- | --- | --- |
| **Purchase history** | Yes | App functionality | Zigo Plus via **Stripe** (subscription tier, not full card numbers — Stripe vaults PAN) |

#### App activity

| Data type | Collected | Purpose | Notes |
| --- | --- | --- | --- |
| **App interactions** | Yes | App functionality, Analytics (if enabled) | `learning_events`, video completions, quiz results, duel outcomes, points |
| **In-app search history** | Optional | App functionality | Explore/search queries if logged server-side |
| **Other user-generated content** | Yes | App functionality, Fraud prevention, safety | Posts, questions, answers, comments, stories — **moderated** before student display |
| **Other actions** | Yes | App functionality | Reward approvals, report actions, moderation strikes |

#### App info and performance

| Data type | Collected | Purpose | Notes |
| --- | --- | --- | --- |
| **Crash logs** | Optional | Analytics | Only if `SENTRY_DSN` / similar is enabled in production |
| **Diagnostics** | Optional | Analytics | Hosting provider (e.g. Vercel) request logs |

#### Files and docs

| Data type | Collected | Purpose | Notes |
| --- | --- | --- | --- |
| **Photos and videos** | Yes (teachers) | App functionality | Lesson/media URLs in posts; student identity document upload when `ZIGO_REQUIRE_STUDENT_DOCUMENT=true` |
| **Other files** | Optional | App functionality | Teacher verification documents if enabled |

#### Device or other IDs

| Data type | Collected | Purpose | Notes |
| --- | --- | --- | --- |
| **Device or other IDs** | No* | — | No ad SDK. *reCAPTCHA may use Google signals at sign-up — declare under **Security practices** if Google asks. |

### Purposes (tick when Play asks)

- **Account management** — sign-up, sign-in, profiles, child profiles under parent account  
- **App functionality** — Match-Feed, quizzes, duels, gamification, Kumbara store  
- **Developer communications** — email verification, security notices  
- **Fraud prevention, security, and compliance** — reCAPTCHA, moderation, strike system  
- **Personalization** — education area interests → feed matching  
- **Analytics** — only if you enable Sentry/Vercel Analytics (optional today)

Do **not** tick **Advertising or marketing** unless you add marketing email or ad networks later.

---

## 3. Third-party processors (declare as “shared with”)

| Processor | Data | Why |
| --- | --- | --- |
| **Supabase** | Auth, profiles, UGC, media storage, Postgres | Backend + RLS |
| **Stripe** | Email, subscription customer id, payment metadata | Zigo Plus billing |
| **Google reCAPTCHA** | Sign-up abuse signals, IP (Google policy) | Registration when keys configured |
| **Hosting (e.g. Vercel)** | HTTP logs, TLS-terminated requests | Serves Next.js + legal pages |
| **Google Play** | Install/device metadata | Store distribution only |

---

## 4. Families / children policy

Zigo targets learners including minors. Align Play Console and policy text with:

| Requirement | Zigo implementation |
| --- | --- |
| **No behavioral ads to children** | No ad SDK; sponsored posts are labelled education content from verified teachers |
| **No student-to-student DM** | Enforced in product rules + RLS |
| **Parental gate / supervision** | Parent role: child profiles, reward approvals, focus analytics |
| **UGC moderation** | Keyword + obscenity filters; strikes; admin alerts (`moderation_violations`) |
| **Age-appropriate content** | Match-Feed by education area; verified teacher publishing |
| **Data minimization for children** | Child profiles: display name, age group, points — no public email |
| **Deletion / export** | Parent account holder can use `/legal/delete-account` |

**Play Console → Target audience:** declare that the app is designed for children and families; complete the **Families Policy** questionnaire honestly.

**Teacher Designed for Families (optional):** only if you certify teacher-facing tools meet Google’s program — not required for initial internal testing.

---

## 5. Store listing copy (suggested)

**Short description (TR):**  
Doğrulanmış öğretmen içerikleri, veli denetimi ve oyunlaştırılmış öğrenme — güvenli eğitim sosyal akışı.

**Full description highlights:**
- Verified teachers publish in assigned education areas  
- Parents supervise child progress and rewards  
- Students: micro lessons, quizzes, duels — no direct messaging  
- Moderated comments and safety filters  

**Category:** Education  
**Content rating:** Complete IARC — expect **PEGI 3 / Everyone** with **User interaction**, **Shares info** (UGC), **In-app purchases** (Zigo Plus).

---

## 6. Android technical notes

- **Permissions:** `INTERNET` only (`android/app/src/main/AndroidManifest.xml`)  
- **No location, contacts, SMS, microphone, camera permission** in manifest — media upload uses WebView/file picker on hosted URL  
- **Capacitor** loads `CAPACITOR_SERVER_URL` — legal pages must be live on that domain before review  

---

## 7. Pre-submission checklist

- [ ] Production deploy with `/legal/privacy`, `/legal/terms`, `/legal/kvkk`, `/legal/delete-account`  
- [ ] Privacy policy mentions children, moderation, third parties (Supabase, Stripe, reCAPTCHA)  
- [ ] Data safety form matches §2 (update if you enable Sentry/Analytics)  
- [ ] Target audience + Families questionnaire completed  
- [ ] Test accounts in “App access” notes  
- [ ] AAB signed with **upload key** (`npm run android:build:release`)  
- [ ] `CAPACITOR_SERVER_URL` points to production HTTPS  
- [ ] Internal testing track upload before production  

---

## Related

- `docs/compliance.md` — KVKK pages and export/delete APIs  
- `docs/mobile-apk-checklist.md` — Capacitor build  
- `docs/production-checklist.md` §5–6 — legal sign-off + Play Store  
- In-app legal text: `src/lib/i18n/catalog.tr.ts` / `catalog.en.ts` → `legalContent`
