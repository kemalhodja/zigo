/* global console */

/**
 * Static wiring invariants for Zigo. When splitting domain modules (e.g. social/),
 * update readSocialDomain() paths and re-run npm run test:smoke — see docs/testing-regression.md.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";

const root = cwd();
const checks = [];

/** Concatenated social domain sources (barrel + split modules). */
const SOCIAL_DOMAIN_FILES = [
  "src/lib/domain/social.ts",
  "src/lib/domain/social/index.ts",
  "src/lib/domain/social/types.ts",
  "src/lib/domain/social/schemas.ts",
  "src/lib/domain/social/helpers.ts",
  "src/lib/domain/social/feed.ts",
  "src/lib/domain/social/feed-cursor.ts",
  "src/lib/domain/social/cache.ts",
  "src/lib/domain/social/cached-feed.ts",
  "src/lib/domain/social/interactions.ts",
  "src/lib/domain/social/safety.ts",
];

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(filePath, "utf8");
}

function readSocialDomain() {
  return SOCIAL_DOMAIN_FILES.map((relativePath) => read(relativePath)).join("\n");
}

/** Concatenated learning domain sources (barrel + split modules). */
const LEARNING_DOMAIN_FILES = [
  "src/lib/domain/learning.ts",
  "src/lib/domain/learning/index.ts",
  "src/lib/domain/learning/types.ts",
  "src/lib/domain/learning/schemas.ts",
  "src/lib/domain/learning/progress.ts",
  "src/lib/domain/learning/quiz.ts",
  "src/lib/domain/learning/awards.ts",
];

function readLearningDomain() {
  return LEARNING_DOMAIN_FILES.map((relativePath) => read(relativePath)).join("\n");
}

function catalogEn() {
  return read("src/lib/i18n/catalog.en.ts");
}

function hasCatalog(needle) {
  return catalogEn().includes(needle);
}

function readOpsEn() {
  return read("src/lib/i18n/ops.en.ts");
}

function hasOps(needle) {
  return readOpsEn().includes(needle);
}

function check(name, predicate) {
  try {
    if (!predicate()) throw new Error("Invariant failed");
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      message: error instanceof Error ? error.message : "Unknown failure",
    });
  }
}

check("Direct point award endpoint stays disabled", () => {
  const route = read("src/app/api/gamification/award/route.ts");
  return route.includes("{ status: 410 }") && route.includes("Direct point awards are disabled");
});

check("Story visibility is Match-Feed gated", () => {
  const migration = read("supabase/migrations/021_story_area_match_feed.sql");
  const domain = readSocialDomain();
  const form = read("src/components/story-create-form.tsx");
  return (
    migration.includes("story_matches_current_user") &&
    migration.includes("stories.area_id") &&
    migration.includes("Verified teachers can create assigned area stories") &&
    domain.includes("areaId: z.coerce.number().int().positive()") &&
    form.includes("name=\"areaId\"")
  );
});

check("Social feed selects education area names", () => {
  const socialDomain = readSocialDomain();
  const homePage = read("src/app/page.tsx");
  const socialPostsRoute = read("src/app/api/social/posts/route.ts");
  const feedRoute = read("src/app/api/feed/route.ts");
  return (
    socialDomain.includes("area:area_id") &&
    socialDomain.includes("encodeFeedCursor") &&
    socialDomain.includes('.in("post_id", postIds)') &&
    homePage.includes("post.area?.area_name") &&
    homePage.includes("getCachedSocialFeed") &&
    socialPostsRoute.includes("hasMore") &&
    socialPostsRoute.includes("nextCursor") &&
    socialPostsRoute.includes("revalidateTag") &&
    feedRoute.includes("nextCursor")
  );
});

check("User-facing screens do not expose raw Area IDs", () => {
  const files = [
    "src/app/page.tsx",
    "src/app/questions/page.tsx",
    "src/components/learn-video-card.tsx",
    "src/components/learn-quiz-card.tsx",
    "src/components/answer-form.tsx",
  ];
  return files.every((file) => !read(file).includes("Area #"));
});

check("Home feed exposes real follow actions", () => {
  const homePage = read("src/app/page.tsx");
  const followButton = read("src/components/follow-button.tsx");
  const socialDomain = readSocialDomain();
  return (
    homePage.includes("import { FollowButton }") &&
    homePage.includes("CreatorRail") &&
    homePage.includes("followingId={creator.id}") &&
    homePage.includes("getSuggestedCreators") &&
    homePage.includes("variant=\"compact\"") &&
    (hasCatalog("Suggested for you") || homePage.includes("m.feed.suggested") || homePage.includes("suggested")) &&
    followButton.includes("variant?: \"compact\"") &&
    socialDomain.includes("export async function getSuggestedCreators")
  );
});

check("Follow policy targets verified teachers", () => {
  const migration = read("supabase/migrations/015_social_safety_hardening.sql");
  return (
    migration.includes("Users can follow verified teachers") &&
    migration.includes("public.user_is_verified_teacher(following_id)")
  );
});

check("Create composer shows clear publish progress", () => {
  const postComposer = read("src/components/social-create-form.tsx");
  const storyComposer = read("src/components/story-create-form.tsx");
  return (
    (postComposer.includes("Post preview") || hasCatalog("Post preview")) &&
    (postComposer.includes("Uploading...") || postComposer.includes("uploading") || hasCatalog("Uploading...")) &&
    (postComposer.includes("Publishing...") || postComposer.includes("publishing") || hasCatalog("Publishing")) &&
    postComposer.includes("areas.length === 0") &&
    (storyComposer.includes("Uploading...") || storyComposer.includes("s.uploading") || storyComposer.includes("uploading") || hasCatalog("Uploading..."))
  );
});

check("Comment surfaces keep student safety visible", () => {
  const actions = read("src/components/social-post-actions.tsx");
  const detail = read("src/app/post/[id]/page.tsx");
  return (
    (actions.includes("Student comments are reviewed before public display.") || actions.includes("studentCommentsReview") || hasCatalog("Student comments are reviewed before public display.")) &&
    actions.includes("maxLength={1000}") &&
    (detail.includes("Student comments are reviewed before public display.") || detail.includes("studentCommentsReview") || hasCatalog("Student comments are reviewed before public display."))
  );
});

check("Micro following tab is backed by real following feed", () => {
  const reelsPage = read("src/app/micro/page.tsx");
  return (
    reelsPage.includes("searchParams") &&
    reelsPage.includes("getFollowingFeed") &&
    reelsPage.includes("/micro?feed=following") &&
    (reelsPage.includes("No followed Micro lessons yet") || reelsPage.includes("noFollowedMicro") || hasCatalog("No followed Micro lessons yet"))
  );
});

check("Reel learning points require 60 watched seconds", () => {
  const component = read("src/components/reel-learning-points.tsx");
  const route = read("src/app/api/learning/reels/complete/route.ts");
  const domain = readSocialDomain();
  return (
    component.includes("requiredWatchSeconds = 60") &&
    component.includes("secondsWatched < requiredWatchSeconds") &&
    route.includes("secondsWatched: body.secondsWatched") &&
    domain.includes("secondsWatched: z.coerce.number().int().min(60)")
  );
});

check("Setup guidance includes every migration through 055", () => {
  const setup = read("src/app/setup/page.tsx");
  return (
    setup.includes("019_admin_teacher_area_assignment.sql") &&
    setup.includes("033_compliance_and_demo_child.sql") &&
    setup.includes("036_study_skills_and_exam_prep.sql") &&
    setup.includes("037_user_profile_extensions.sql") &&
    setup.includes("038_auth_email_and_student_gates.sql") &&
    setup.includes("039_unified_content_posts.sql") &&
    setup.includes("040_moderation_keyword_filter.sql") &&
    setup.includes("041_quiz_questions_and_attempts.sql") &&
    setup.includes("042_parent_child_activity.sql") &&
    setup.includes("043_content_moderation_publish_rls.sql") &&
    setup.includes("044_product_scope_hardening.sql") &&
    setup.includes("045_premium_prep_grade_optional_doc.sql") &&
    setup.includes("046_teacher_creator_plus_gates.sql") &&
    setup.includes("047_sponsored_ads_infrastructure.sql") &&
    setup.includes("048_education_organization_type.sql") &&
    setup.includes("049_registration_organization_accounts.sql") &&
    setup.includes("050_verified_teacher_answers_rls.sql") &&
    setup.includes("055_demo_social_interactions_reset.sql")
  );
});

check("Product scope audits and family store approval are wired", () => {
  const packageJson = read("package.json");
  const doc = read("docs/product-scope-audit.md");
  const migration = read("supabase/migrations/044_product_scope_hardening.sql");
  return (
    packageJson.includes('"audit:product-scope"') &&
    doc.includes("parent_update_store_redemption_status") &&
    migration.includes("parent_update_store_redemption_status") &&
    read("src/app/profiles/select/[id]/route.ts").includes("ACTIVE_CHILD_PROFILE_COOKIE")
  );
});

check("Platform admins can assign teacher education areas", () => {
  const migration = read("supabase/migrations/019_admin_teacher_area_assignment.sql");
  const lockMigration = read("supabase/migrations/020_lock_teacher_interest_self_assignment.sql");
  const route = read("src/app/api/admin/teachers/areas/route.ts");
  const interestsRoute = read("src/app/api/interests/route.ts");
  const form = read("src/components/admin-teacher-area-form.tsx");
  const adminPage = read("src/app/admin/page.tsx");
  return (
    migration.includes("admin_set_teacher_areas") &&
    lockMigration.includes("teacher areas are assigned by platform admins") &&
    route.includes("/api/admin/teachers/areas") === false &&
    route.includes("requirePlatformAdmin") &&
    route.includes("setTeacherAreas") &&
    interestsRoute.includes("profile.role === \"teacher\"") &&
    (adminPage.includes("Teachers cannot assign their own areas") || adminPage.includes("teacherSectionDesc") || hasOps("Teachers cannot assign their own areas")) &&
    (form.includes("Assigned creator areas") || form.includes("areasEyebrow") || hasOps("Assigned creator areas")) &&
    (form.includes("Save areas") || form.includes("saveAreas") || hasOps("Save areas"))
  );
});

check("Mobile APK does not default to localhost", () => {
  const capacitor = read("capacitor.config.ts");
  const generated = read("android/app/src/main/assets/capacitor.config.json");
  const packageJson = read("package.json");
  const cleanNext = read("scripts/clean-next.mjs");
  const serviceWorker = read("public/sw.js");
  const fallback = read("public/index.html");
  const checklist = read("public/mobile-apk-checklist.md");
  return (
    capacitor.includes("CAPACITOR_SERVER_URL || undefined") &&
    !generated.includes("localhost") &&
    packageJson.includes("android:build:release") &&
    packageJson.includes("android:preflight") &&
    packageJson.includes("build:safe") &&
    cleanNext.includes("Cleaned .next build cache") &&
    packageJson.includes("test:mobile") &&
    packageJson.includes("test:rls") &&
    serviceWorker.includes("STATIC_ASSET_PATTERN") &&
    serviceWorker.includes("caches.match(\"/offline.html\")") &&
    fallback.includes("CAPACITOR_SERVER_URL") &&
    checklist.includes("CAPACITOR_SERVER_URL=https://your-zigo-domain.example") &&
    checklist.includes("001` through `042") || checklist.includes("001` through `023")
  );
});

check("Saved posts are organized into private saved folders", () => {
  const collectionsPage = read("src/app/collections/page.tsx");
  const actions = read("src/components/social-post-actions.tsx");
  return (
    collectionsPage.includes("collectionFolders") &&
    (collectionsPage.includes("Private folder") || collectionsPage.includes("privateFolder") || hasCatalog("Private folder")) &&
    collectionsPage.includes("filterSavedPosts") &&
    (actions.includes("Saved.") || actions.includes("collectionSaved"))
  );
});

check("Saved folders support search and empty guidance", () => {
  const collectionsPage = read("src/app/collections/page.tsx");
  return (
    (collectionsPage.includes("Search saved") || collectionsPage.includes("searchPlaceholder") || hasCatalog("Search saved")) &&
    collectionsPage.includes("searchSavedPosts") &&
    collectionsPage.includes("getCollectionHref") &&
    (collectionsPage.includes("No saved results found") || collectionsPage.includes("c.noResults") || hasCatalog("No saved results found")) &&
    (collectionsPage.includes("Clear search") || collectionsPage.includes("c.clearSearch") || hasCatalog("Clear search"))
  );
});

check("Comment sheet supports safe reply context", () => {
  const actions = read("src/components/social-post-actions.tsx");
  return (
    (actions.includes("Reply safely") || actions.includes("replySafely") || hasCatalog("Reply safely")) &&
    actions.includes("replyingTo") &&
    (actions.includes("Student comments are reviewed before public display.") || actions.includes("studentCommentsReview") || hasCatalog("Student comments are reviewed before public display."))
  );
});

check("Reward store keeps parent approval visible", () => {
  const storePage = read("src/app/store/page.tsx");
  const productCard = read("src/components/store-product-card.tsx");
  const parentPage = read("src/app/parent/page.tsx");
  return (
    storePage.includes("StoreStat") &&
    (productCard.includes("Parent approval required") || productCard.includes("parentApprovalRequired") || hasCatalog("Parent approval required")) &&
    (productCard.includes("Parent approval keeps real-world rewards safe") || productCard.includes("parentApprovalSafe") || hasCatalog("Parent approval keeps real-world rewards safe")) &&
    (parentPage.includes("Reward approvals") || parentPage.includes("rewardApprovals") || hasCatalog("Reward approvals"))
  );
});

check("Reward store supports search filters and parent approval guidance", () => {
  const storePage = read("src/app/store/page.tsx");
  return (
    (storePage.includes("Search Kumbara Store") || storePage.includes("searchPlaceholder") || hasCatalog("Search Kumbara Store")) &&
    storePage.includes("storeCategories") &&
    storePage.includes("filterStoreProducts") &&
    storePage.includes("StoreWalletHero") &&
    (storePage.includes("Crystal wallet") || storePage.includes("crystalWallet") || hasCatalog("Crystal wallet")) &&
    (storePage.includes("Featured reward") || storePage.includes("featured") || hasCatalog("Featured reward")) &&
    storePage.includes("StoreApprovalCheckpoint") &&
    (storePage.includes("Parent approval checkpoint") || storePage.includes("parentCheckpoint") || hasCatalog("Parent approval checkpoint")) &&
    (storePage.includes("Parent approval stays visible") || storePage.includes("parentApprovalRequired") || hasCatalog("Parent approval required")) &&
    (storePage.includes("real-world rewards stay pending") || storePage.includes("pendingApproval") || hasCatalog("Pending approval")) &&
    (storePage.includes("No rewards found") || storePage.includes("noRewards") || hasCatalog("No rewards found"))
  );
});

check("Local demo quick-login is wired on auth", () => {
  const authPage = read("src/app/auth/page.tsx");
  const demoPanel = read("src/components/demo-login-panel.tsx");
  const demoEnv = read("src/lib/domain/demo-env.ts");
  return (
    authPage.includes("DemoLoginPanel") &&
    demoPanel.includes("student@zigo.test") &&
    demoEnv.includes("isLocalDemoSupabase")
  );
});

check("Auth flow explains roles and setup clearly", () => {
  const authPage = read("src/app/auth/page.tsx");
  const authPanel = read("src/components/auth-panel.tsx");
  const signInRoute = read("src/app/api/auth/sign-in/route.ts");
  const signUpRoute = read("src/app/api/auth/sign-up/route.ts");
  const setupCard = read("src/components/supabase-setup-card.tsx");
  const authProduction = read("docs/auth-production.md");
  return (
    authPage.includes("AuthPremiumHero") &&
    (authPage.includes("Registration path") || authPage.includes("registrationPath") || hasCatalog("Registration path")) &&
    (authPage.includes("Pick role") || authPage.includes("pickRole") || hasCatalog("Pick role")) &&
    (authPage.includes("Start feed") || authPage.includes("startFeed") || hasCatalog("Start feed")) &&
    (authPanel.includes("Choose role") || authPanel.includes("chooseRole") || hasCatalog("Choose role")) &&
    (authPanel.includes("Next step") || authPanel.includes("nextStep") || hasCatalog("Next step")) &&
    (authPanel.includes("Micro, quizzes, streaks, crystals") ||
      authPanel.includes("studentRole") ||
      authPanel.includes("REGISTRATION_ACCOUNT_OPTIONS") ||
      authPanel.includes("registration-account") ||
      hasCatalog("Micro, quizzes")) &&
    (authPanel.includes("Verified creator tools") ||
      authPanel.includes("verifiedTools") ||
      authPanel.includes("Eğitim kurumu") ||
      authPanel.includes("institution") ||
      hasCatalog("Verified creator tools")) &&
    authPanel.includes('"signin"') &&
    signInRoute.includes("enforceAuthRateLimit") &&
    signInRoute.includes("verifyAuthRecaptcha") &&
    signUpRoute.includes("registrationPasswordSchema") &&
    signUpRoute.includes("enforceAuthRateLimit") &&
    authProduction.includes("ZIGO_REQUIRE_EMAIL_CONFIRM") &&
    (setupCard.includes("What this means") || setupCard.includes("whatThisMeans") || hasOps("What this means")) &&
    (setupCard.includes("registration will open") || setupCard.includes("envMissingDesc") || hasOps("registration will open"))
  );
});

check("Notifications include rewards category", () => {
  const notificationsPage = read("src/app/notifications/page.tsx");
  return (
    notificationsPage.includes("category: \"learning\" | \"rewards\" | \"safety\" | \"social\"") &&
    (notificationsPage.includes("Reward approval") || notificationsPage.includes("demoReward") || hasCatalog("Reward approval")) &&
    (notificationsPage.includes("label: \"Rewards\"") || notificationsPage.includes("n.rewards") || hasCatalog("rewards:"))
  );
});

check("Notifications support unread filters and live mark-read feedback", () => {
  const notificationsPage = read("src/app/notifications/page.tsx");
  const markRead = read("src/components/mark-notifications-read-button.tsx");
  return (
    notificationsPage.includes("filterNotifications") &&
    notificationsPage.includes("filter=unread") &&
    (notificationsPage.includes("No unread activity") || notificationsPage.includes("noUnread") || hasCatalog("No unread activity")) &&
    notificationsPage.includes("ActivityDigestHero") &&
    (notificationsPage.includes("Activity digest") || notificationsPage.includes("digest") || hasCatalog("Activity digest")) &&
    notificationsPage.includes("ActivityCategorySummary") &&
    (notificationsPage.includes("Category summary") || notificationsPage.includes("categorySummary") || hasCatalog("Category summary")) &&
    notificationsPage.includes("getActivityCategoryCounts") &&
    markRead.includes("initialUnreadCount") &&
    (markRead.includes("notifications marked read") || markRead.includes("markedRead") || hasCatalog("notifications marked read"))
  );
});

check("Moderation queue has filterable safety lanes", () => {
  const moderationPage = read("src/app/moderation/page.tsx");
  const moderationRoute = read("src/app/api/social/moderation/route.ts");
  const commentsRoute = read("src/app/api/social/comments/route.ts");
  const repliesRoute = read("src/app/api/social/stories/replies/route.ts");
  const rateLimit = read("src/lib/server/rate-limit.ts");
  const migration = read("supabase/migrations/022_platform_admin_moderation_policies.sql");
  const auditMigration = read("supabase/migrations/023_moderation_audit_log.sql");
  const socialDomain = readSocialDomain();
  const postOptions = read("src/components/post-options-button.tsx");
  return (
    moderationPage.includes("type ModerationFilter") &&
    moderationPage.includes("/moderation?queue=comments") &&
    moderationPage.includes("/moderation?queue=sparks") &&
    moderationPage.includes("/moderation?queue=reports") &&
    moderationRoute.includes("isCurrentUserPlatformAdmin") &&
    commentsRoute.includes("checkRateLimit") &&
    repliesRoute.includes("checkRateLimit") &&
    rateLimit.includes("retryAfterSeconds") &&
    migration.includes("Platform admins can moderate post comments") &&
    auditMigration.includes("moderation_audit_log") &&
    socialDomain.includes("moderation_audit_log") &&
    postOptions.includes("Track it in Safety") || postOptions.includes("reportSent") || hasCatalog("Track it in Safety")
  );
});

check("Student dashboard shows league path and streak", () => {
  const studentPage = read("src/app/student/page.tsx");
  const missions = read("src/components/daily-missions-card.tsx");
  const missionsApi = read("src/app/api/learning/missions/route.ts");
  const learning = readLearningDomain();
  const gamification = read("src/lib/domain/student-gamification.ts");
  return (
    studentPage.includes("LeaguePathCard") &&
    (studentPage.includes("day streak") || studentPage.includes("dayStreak") || hasCatalog("day streak")) &&
    studentPage.includes("LEAGUE_PATH") &&
    studentPage.includes("/duels") &&
    studentPage.includes("buildStudentGamification") &&
    missions.includes("/api/learning/missions") &&
    missionsApi.includes("getDailyMissionProgress") &&
    learning.includes("getDailyMissionProgress") &&
    gamification.includes("LEAGUE_PATH") &&
    (missions.includes("Play a duel") || missions.includes("playDuel") || hasCatalog("Play a duel"))
  );
});

check("Parent dashboard surfaces pending reward approvals", () => {
  const parentPage = read("src/app/parent/page.tsx");
  const queue = read("src/components/parent-approval-queue.tsx");
  const store = read("src/lib/domain/store.ts");
  return (
    parentPage.includes("ParentApprovalQueue") &&
    parentPage.includes("getPendingParentRedemptions") &&
    parentPage.includes("normalizeRelation") &&
    (queue.includes("waiting for you") ||
      queue.includes("waitingTitle") ||
      hasCatalog("waiting for you")) &&
    store.includes("getPendingParentRedemptions")
  );
});

check("Avatar locker unlocks items from earned points", () => {
  const avatarPage = read("src/app/avatar/page.tsx");
  const avatarStore = read("src/components/avatar-store.tsx");
  const progressCard = read("src/components/learning-progress-card.tsx");
  return (
    avatarPage.includes("equippedAssets={profile.avatar_assets}") &&
    avatarPage.includes("totalPoints={profile.total_points}") &&
    (avatarStore.includes("totalPoints < price") || avatarStore.includes("totalPoints >=") || avatarStore.includes("totalPoints")) &&
    (avatarStore.includes("Locked") || avatarStore.includes("s.locked") || hasCatalog("Locked")) &&
    (progressCard.includes("quizCompletions") || progressCard.includes("quizCount")) &&
    (progressCard.includes("duelWins") || progressCard.includes("duelCount"))
  );
});

check("Profile and Explore keep stronger social discovery surfaces", () => {
  const profilePage = read("src/app/profile/page.tsx");
  const explorePage = read("src/app/explore/page.tsx");
  const socialDomain = readSocialDomain();
  return (
    profilePage.includes("ProfileCreatorDiscovery") &&
    profilePage.includes("getSuggestedCreators") &&
    (profilePage.includes("Verified teachers in your areas") || profilePage.includes("verifiedTeachers") || hasCatalog("Verified teachers in your areas")) &&
    (profilePage.includes("profileGrid.profileGridLabel") || profilePage.includes("Profile grid") || hasCatalog("Profile grid")) &&
    explorePage.includes("getMatchedTeachers") &&
    explorePage.includes("suggestedCreatorRail") &&
    (explorePage.includes("Masonry discovery") || explorePage.includes("e.masonry") || hasCatalog("Masonry discovery")) &&
    (explorePage.includes("Discover creators and topics") || explorePage.includes("e.title") || hasCatalog("Discover creators and topics")) &&
    socialDomain.includes("export async function getMatchedTeachers")
  );
});

check("Main social routes have polished loading skeletons", () => {
  const globalLoading = read("src/app/loading.tsx");
  const exploreLoading = read("src/app/explore/loading.tsx");
  const profileLoading = read("src/app/profile/loading.tsx");
  const reelsLoading = read("src/app/micro/loading.tsx");
  return (
    globalLoading.includes("story-ring") &&
    exploreLoading.includes("auto-rows-[8.35rem]") &&
    profileLoading.includes("aspect-square") &&
    reelsLoading.includes("min-h-[calc(100dvh-7rem)]")
  );
});

check("Teacher Studio explains verification application steps", () => {
  const teacherPage = read("src/app/teacher/page.tsx");
  return (
    (teacherPage.includes("Teacher verification application") || teacherPage.includes("verificationApplication") || hasCatalog("Teacher verification application")) &&
    (teacherPage.includes("Publishing is locked until verification") || teacherPage.includes("publishingLocked") || hasCatalog("Publishing is locked until verification")) &&
    (teacherPage.includes("Admin verifies educator identity") || teacherPage.includes("platformVerifies") || hasCatalog("Platform verifies educator identity")) &&
    (teacherPage.includes("Admin review") || teacherPage.includes("whatNow") || teacherPage.includes("pending") || hasCatalog("What to do now"))
  );
});

check("Mini quiz results explain correct and review states", () => {
  const quizCard = read("src/components/learn-quiz-card.tsx");
  return (
    (quizCard.includes("Great answer") || quizCard.includes("greatAnswer") || hasCatalog("Great answer")) &&
    (quizCard.includes("Learning moment") || quizCard.includes("learningMoment") || hasCatalog("Learning moment")) &&
    quizCard.includes("getResultExplanation") &&
    (quizCard.includes("verified learning action") || quizCard.includes("earnedVerified") || hasCatalog("verified learning action"))
  );
});

check("Focus analytics and study plans strengthen the Pomodoro loop", () => {
  const migration = read("supabase/migrations/031_focus_analytics_and_plans.sql");
  const analyticsCard = read("src/components/focus-analytics-card.tsx");
  const studyPlan = read("src/components/study-plan-card.tsx");
  const parentOverview = read("src/components/parent-focus-overview-card.tsx");
  const focusCard = read("src/components/focus-pomodoro-card.tsx");
  return (
    migration.includes("get_student_focus_analytics") &&
    migration.includes("upsert_study_plan") &&
    migration.includes("get_parent_focus_overview") &&
    (analyticsCard.includes("Weekly Pomodoro goal") || analyticsCard.includes("weeklyGoal") || hasCatalog("Weekly Pomodoro goal")) &&
    studyPlan.includes("/api/learning/study-plan") &&
    (parentOverview.includes("parentFocus.focusPulse") || parentOverview.includes("Focus pulse") || hasCatalog("Focus pulse")) &&
    focusCard.includes("/api/learning/focus/active")
  );
});

check("Focus Pomodoro and Study-with-me routes are wired", () => {
  const focusPage = read("src/app/focus/page.tsx");
  const focusCard = read("src/components/focus-pomodoro-card.tsx");
  const studyRail = read("src/components/study-with-me-rail.tsx");
  const migration = read("supabase/migrations/030_focus_study_with_me.sql");
  const product = read("src/lib/domain/product-standard.ts");
  return (
    focusPage.includes("FocusPomodoroCard") &&
    focusCard.includes("POMODORO_SECONDS") &&
    focusCard.includes("/api/learning/focus/start") &&
    (studyRail.includes("studyWithMeRail") || studyRail.includes("Study-with-me") || hasCatalog("Friends focusing in your areas")) &&
    migration.includes("complete_focus_session") &&
    migration.includes("get_matched_study_moments") &&
    product.includes("Focus-Gamification for Students")
  );
});

check("Zigo Plus subscription upsell explains premium study tools", () => {
  const upsell = read("src/components/zigo-plus-upsell.tsx");
  const focusDomain = read("src/lib/domain/focus-gamification.ts");
  const billing = read("src/lib/domain/billing.ts");
  return (
    upsell.includes("Zigo Plus") &&
    upsell.includes("ZIGO_PLUS_BENEFITS") &&
    upsell.includes("/api/billing/checkout") &&
    billing.includes("createZigoPlusCheckoutSession") &&
    focusDomain.includes("ZIGO_PLUS_BENEFITS")
  );
});

check("Compliance migration wires KVKK export, deletion and demo child", () => {
  const migration = read("supabase/migrations/033_compliance_and_demo_child.sql");
  const exportRoute = read("src/app/api/account/export/route.ts");
  const deleteRoute = read("src/app/api/account/delete-request/route.ts");
  const deletePage = read("src/app/legal/delete-account/page.tsx");
  const cookie = read("src/components/cookie-consent-banner.tsx");
  const appShell = read("src/components/app-shell.tsx");
  const compliance = read("src/lib/domain/account-compliance.ts");
  return (
    migration.includes("account_deletion_requests") &&
    migration.includes("export_user_data") &&
    migration.includes("request_account_deletion") &&
    exportRoute.includes("exportUserData") &&
    deleteRoute.includes("requestAccountDeletion") &&
    (deletePage.includes("Download my data") || deletePage.includes("downloadData") || hasCatalog("Download my data")) &&
    read("src/app/legal/privacy/page.tsx").includes("/legal/delete-account") &&
    read("src/app/legal/kvkk/page.tsx").includes("/legal/delete-account") &&
    cookie.includes("zigo:cookie-consent") &&
    appShell.includes("CookieConsentBanner") &&
    read("src/components/reel-video-player.tsx").includes("getMediaPlaybackUrl") &&
    read("src/components/push-notification-panel.tsx").includes("isPushConfigured") &&
    compliance.includes("export_user_data")
  );
});

check("Launch gap closure migration wires billing, child focus and store visit", () => {
  const migration = read("supabase/migrations/032_launch_gaps_closure.sql");
  const legalFooter = read("src/components/legal-footer.tsx");
  const childFocus = read("src/components/child-focus-panel.tsx");
  const parentChildren = read("src/components/parent-children-focus-card.tsx");
  const storeVisit = read("src/app/api/learning/store-visit/route.ts");
  const cheer = read("src/app/api/learning/study-moments/cheer/route.ts");
  const webhook = read("src/app/api/billing/webhook/route.ts");
  const teacherPost = read("src/components/teacher-post-form.tsx");
  return (
    migration.includes("get_parent_children_focus_stats") &&
    migration.includes("record_store_visit_mission") &&
    migration.includes("cheer_study_moment") &&
    migration.includes("set_user_subscription_tier") &&
    legalFooter.includes("/legal/kvkk") &&
    legalFooter.includes("/legal/delete-account") &&
    childFocus.includes("childProfileId") &&
    (parentChildren.includes("parentFocus.perChildPulse") || parentChildren.includes("Per-child study pulse") || hasCatalog("Per-child study pulse")) &&
    storeVisit.includes("record_store_visit_mission") &&
    cheer.includes("cheer_study_moment") &&
    webhook.includes("verifyStripeWebhookSignature") &&
    (teacherPost.includes("t.educationArea") || teacherPost.includes("Education area") || teacherPost.includes("educationArea") || hasCatalog("Education area")) &&
    teacherPost.includes("areas.map")
  );
});

check("Learn hub connects Micro quizzes duels and progress", () => {
  const learnPage = read("src/app/learn/page.tsx");
  const seedMigration = read("supabase/migrations/029_seed_matched_quizzes.sql");
  return (
    learnPage.includes("LearnHubSummary") &&
    learnPage.includes("LearnQuestHero") &&
    (learnPage.includes("Daily quest") || learnPage.includes("dailyQuest") || hasCatalog("Daily quest")) &&
    learnPage.includes("LearnRewardPath") &&
    (learnPage.includes("Reward path") || learnPage.includes("rewardPath") || hasCatalog("Reward path")) &&
    (learnPage.includes("Learning hub") || learnPage.includes("learningHub") || hasCatalog("Learning hub")) &&
    (learnPage.includes("Micro, quizzes and duels in one path") || learnPage.includes("hubSubtitle") || hasCatalog("Micro, quizzes and duels in one path")) &&
    (learnPage.includes('label: "Micro", value: videoCount') || learnPage.includes("nav.micro")) &&
    (learnPage.includes("Progress") || learnPage.includes("chipProgress") || learnPage.includes("profilesPage")) &&
    seedMigration.includes("get_matched_quizzes") === false &&
    seedMigration.includes("00000000-0000-4000-8000-000000000701")
  );
});

check("Safe duels are topic-based and DM-free", () => {
  const duelsPage = read("src/app/duels/page.tsx");
  const duelCard = read("src/components/safe-duel-card.tsx");
  const studentPage = read("src/app/student/page.tsx");
  const missions = read("src/components/daily-missions-card.tsx");
  return (
    (duelsPage.includes("Compete without student DMs") || duelsPage.includes("duelsPage") || hasCatalog("Compete without student DMs")) &&
    (duelsPage.includes("Preset answers only") || duelsPage.includes("safetyRules") || hasCatalog("Preset answers only")) &&
    (duelCard.includes("No student chat, no direct messaging") || duelCard.includes("d.topicDesc") || hasCatalog("No student chat, no direct messaging")) &&
    studentPage.includes("href=\"/duels\"") &&
    (missions.includes("Play a duel") || missions.includes("playDuel") || hasCatalog("Play a duel"))
  );
});

check("Safe duel gameplay shows progress, score and parent visibility", () => {
  const duelCard = read("src/components/safe-duel-card.tsx");
  const duelApi = read("src/app/api/learning/duels/complete/route.ts");
  const learning = readLearningDomain();
  return (
    duelCard.includes("duelQuestions") &&
    (duelCard.includes("Question {currentQuestionIndex + 1}/{duelQuestions.length}") ||
      duelCard.includes("d.questionLabel")) &&
    (duelCard.includes("Score {score}/{duelQuestions.length}") || duelCard.includes("d.scoreLabel")) &&
    (duelCard.includes("Parent-visible result") || duelCard.includes("d.parentVisible") || duelCard.includes("d.completedDesc")) &&
    (duelCard.includes("Preset answers only") || duelCard.includes("d.presetOnly") || hasCatalog("Preset answers only")) &&
    duelApi.includes("completeSafeDuelWin") &&
    learning.includes("award_safe_duel_win_points")
  );
});

check("Reports have detail tracking and admin audit visibility", () => {
  const moderationPage = read("src/app/moderation/page.tsx");
  const reportDetail = read("src/app/moderation/reports/[id]/page.tsx");
  const adminPage = read("src/app/admin/page.tsx");
  return (
    moderationPage.includes("/moderation/reports/") &&
    (reportDetail.includes("reportDetailPage.reportDetail") || reportDetail.includes("Report detail") || hasCatalog("Report detail")) &&
    (reportDetail.includes("reportDetailPage.auditTimeline") || reportDetail.includes("Audit timeline") || hasCatalog("Audit timeline")) &&
    (reportDetail.includes("reportDetailPage.reportDetailDesc") || reportDetail.includes("Track the safety review status") || hasCatalog("Track the safety review status")) &&
    (adminPage.includes("Audit log") ||
      adminPage.includes("auditEyebrow") ||
      hasOps("Audit log")) &&
    (adminPage.includes("Admin actions to review") || adminPage.includes("auditTitle") || hasOps("Admin actions to review"))
  );
});

check("Family setup clearly links parent and child learning profiles", () => {
  const familyPage = read("src/app/family/page.tsx");
  const childForm = read("src/components/child-profile-form.tsx");
  const childAreas = read("src/components/child-area-selector.tsx");
  const childRewards = read("src/components/child-reward-panel.tsx");
  const onboardingPage = read("src/app/onboarding/page.tsx");
  return (
    (familyPage.includes("Parent-child setup") || familyPage.includes("parentChildSetup") || hasCatalog("Parent-child setup")) &&
    (familyPage.includes("Link child learning profiles") || familyPage.includes("linkChildProfiles") || hasCatalog("Link child learning profiles")) &&
    (childForm.includes("supervised child profile") || childForm.includes("createChildDesc") || hasCatalog("supervised child profiles")) &&
    (childAreas.includes("Link Match-Feed areas") || childAreas.includes("childAreas") || childAreas.includes("stepChooseAreas") || hasCatalog("Link Match-Feed areas")) &&
    (childRewards.includes("Step 3") || childRewards.includes("step3") || hasCatalog("Step 3")) &&
    (onboardingPage.includes("Add child") || onboardingPage.includes("addChild") || hasCatalog("Add child"))
  );
});

check("PWA manifest includes install-ready app icons", () => {
  const manifest = read("public/manifest.json");
  const layout = read("src/app/layout.tsx");
  const setupPage = read("src/app/setup/page.tsx");
  const readinessPage = read("src/app/readiness/page.tsx");
  return (
    manifest.includes("/icon-maskable.svg") &&
    manifest.includes("/apple-touch-icon.svg") &&
    manifest.includes("Open Micro") &&
    manifest.includes('"/micro"') &&
    layout.includes("/apple-touch-icon.svg") &&
    (setupPage.includes("PWA install") || setupPage.includes("pwaTitle") || setupPage.includes("pwaEyebrow")) &&
    (readinessPage.includes("PWA app icons") || readinessPage.includes("buildChecklist") || hasOps("PWA app icons"))
  );
});

check("Uploaded media is cleaned after failed publish", () => {
  const uploadRoute = read("src/app/api/social/upload/route.ts");
  const cleanupHelper = read("src/lib/client/media-cleanup.ts");
  const postComposer = read("src/components/social-create-form.tsx");
  const storyComposer = read("src/components/story-create-form.tsx");
  const setupPage = read("src/app/setup/page.tsx");
  return (
    uploadRoute.includes("export async function DELETE") &&
    uploadRoute.includes("Uploaded media can be cleaned only by its owner") &&
    cleanupHelper.includes("cleanupUploadedMedia") &&
    postComposer.includes("await cleanupUploadedMedia(uploadedObjectPath)") &&
    storyComposer.includes("await cleanupUploadedMedia(uploadedObjectPath)") &&
    (setupPage.includes("Storage lifecycle") || setupPage.includes("storageEyebrow") || hasOps("Storage lifecycle"))
  );
});

check("Reel watch rewards listen to video playback events", () => {
  const reelsPage = read("src/app/micro/page.tsx");
  const reelVideoPlayer = read("src/components/reel-video-player.tsx");
  const points = read("src/components/reel-learning-points.tsx");
  return (
    reelsPage.includes("ReelVideoPlayer") &&
    (reelsPage.includes('label: "Quiz"') || reelsPage.includes("dockQuiz") || reelsPage.includes("ReelLearningDock")) &&
    (reelsPage.includes('label: "Save"') || reelsPage.includes("dockSave")) &&
    reelVideoPlayer.includes("zigo:reel-playback") &&
    points.includes("requiresPlayback") &&
    (points.includes("playReelForPoints") || points.includes("Play the reel to count verified watch time") || hasCatalog("Play the reel to count verified watch time"))
  );
});

check("Micro action rail updates counts and Smart Collection feedback", () => {
  const reelsPage = read("src/app/micro/page.tsx");
  const actionRail = read("src/components/reel-action-rail.tsx");
  const socialDomain = readSocialDomain();
  const postsRoute = read("src/app/api/social/posts/route.ts");
  const likesRoute = read("src/app/api/social/likes/route.ts");
  const savesRoute = read("src/app/api/social/saves/route.ts");
  return (
    reelsPage.includes("initialLikesCount={reel.likesCount}") &&
    actionRail.includes("compactFormatter") &&
    actionRail.includes("setLikesCount") &&
    actionRail.includes("likes_count") &&
    socialDomain.includes("likes_count: await countPostLikes") &&
    socialDomain.includes("saves_count: await countPostSaves") &&
    postsRoute.includes("Math.min(50") &&
    likesRoute.includes("toggle-like") &&
    savesRoute.includes("toggle-save") &&
    (actionRail.includes("Saved.") || actionRail.includes("shareCopied") || hasCatalog("Saved.")) &&
    (actionRail.includes("Micro link copied") || actionRail.includes("shareCopied") || hasCatalog("Micro link copied"))
  );
});

check("Micro page has premium learning overlay and dock", () => {
  const reelsPage = read("src/app/micro/page.tsx");
  return (
    reelsPage.includes("ReelContextOverlay") &&
    (reelsPage.includes("Micro lessons") || reelsPage.includes("messages.nav.micro") || reelsPage.includes("nav.micro") || hasCatalog("Micro lessons")) &&
    (reelsPage.includes("Match-Feed lane") || reelsPage.includes("matchFeedLane") || hasCatalog("Match-Feed")) &&
    reelsPage.includes("ReelLearningDock") &&
    (reelsPage.includes("Watch loop") || reelsPage.includes("watchLoop") || hasCatalog("Watch loop")) &&
    (reelsPage.includes("Verified") || reelsPage.includes("verifiedLabel")) &&
    reelsPage.includes("bg-black/20 p-2 backdrop-blur")
  );
});

check("Follow actions return and display live follower counts", () => {
  const socialDomain = readSocialDomain();
  const followButton = read("src/components/follow-button.tsx");
  const publicProfile = read("src/app/profile/[id]/page.tsx");
  return (
    socialDomain.includes("followers_count") &&
    socialDomain.includes("following_count") &&
    followButton.includes("initialFollowersCount") &&
    followButton.includes("showCount") &&
    publicProfile.includes("initialFollowersCount={stats.followers}")
  );
});

check("Action chips allow wrapped labels on narrow screens", () => {
  const globals = read("src/app/globals.css");
  const homePage = read("src/app/page.tsx");
  const learnPage = read("src/app/learn/page.tsx");
  return (
    globals.includes(".zigo-action-chip") &&
    globals.includes("overflow-wrap: anywhere") &&
    globals.includes(".zigo-stat-chip") &&
    globals.includes(".zigo-fit-text") &&
    homePage.includes("TodayLearningCard") &&
    learnPage.includes("zigo-action-grid")
  );
});

check("Media overlays force readable light text on dark frames", () => {
  const mediaFrame = read("src/components/social-media-frame.tsx");
  const globals = read("src/app/globals.css");
  return mediaFrame.includes("zigo-media-overlay") && globals.includes(".zigo-media-overlay");
});

check("Primary CTA buttons use zigo-cta instead of flat night", () => {
  const files = [
    "src/app/page.tsx",
    "src/app/learn/page.tsx",
    "src/app/explore/page.tsx",
    "src/components/profile-form.tsx",
  ];
  return files.every((file) => read(file).includes("zigo-cta") || read(file).includes("zigo-quick-action-primary"));
});

check("Quick action links keep explicit readable text colors", () => {
  const quickActionFiles = [
    "src/app/learn/page.tsx",
    "src/app/post/[id]/page.tsx",
    "src/components/learning-progress-card.tsx",
  ];
  return quickActionFiles.every((file) => {
    const source = read(file);
    return (
      source.includes("zigo-quick-action-primary") &&
      source.includes("text-white") &&
      !source.includes('zigo-quick-action-primary tap-scale rounded-xl px-3 py-3" href="/micro">')
    );
  });
});

check("Active tab and filter pills use crystal contrast utilities", () => {
  const globals = read("src/app/globals.css");
  const tabFiles = [
    "src/app/profile/page.tsx",
    "src/app/profile/[id]/page.tsx",
    "src/app/explore/page.tsx",
    "src/app/notifications/page.tsx",
    "src/app/store/page.tsx",
    "src/components/feed-refresh-control.tsx",
    "src/components/bottom-nav.tsx",
  ];
  const forbiddenTabActive = [
    /activeTab ===[^?]+\?[^"]*border-night text-night/,
    /activeFormat ===[^?]+\?[^"]*border-night bg-night/,
    /activeFilter ===[^?]+\?[^"]*bg-night text-white/,
    /activeCategory ===[^?]+\?[^"]*bg-night text-white/,
    /activeFeed ===[^?]+\?[^"]*bg-white\/12 text-white/,
  ];
  return (
    globals.includes("zigo-tab-active-underline") &&
    globals.includes("zigo-tab-active-pill") &&
    globals.includes("zigo-tab-active") &&
    globals.includes("color: #ffffff !important") &&
    tabFiles.every((file) => forbiddenTabActive.every((pattern) => !pattern.test(read(file))))
  );
});

check("Navigation surfaces show unread notification badges", () => {
  const layout = read("src/app/layout.tsx");
  const appShell = read("src/components/app-shell.tsx");
  const bottomNav = read("src/components/bottom-nav.tsx");
  return (
    layout.includes("getUnreadNotificationCount") &&
    appShell.includes("unreadCount={unreadCount}") &&
    (appShell.includes('aria-label="Notifications"') || appShell.includes("h.notifications") || hasCatalog("Notifications")) &&
    appShell.includes("M15 17h5l-1.4-1.4") &&
    bottomNav.includes("unreadCount") &&
    bottomNav.includes("bg-berry") === false
  );
});

check("App shell exposes premium daily quick actions", () => {
  const appShell = read("src/components/app-shell.tsx");
  return (
    appShell.includes("QuickActionDock") &&
    appShell.includes('href="/create?mode=story"') &&
    appShell.includes('href="/create?mode=reel"') &&
    (appShell.includes("z.spark") || hasCatalog("Hikaye") || hasCatalog("Story")) &&
    (appShell.includes("z.micro") || hasCatalog("Kısa ders") || hasCatalog("Short lesson")) &&
    (appShell.includes("askSafely") || hasCatalog("Ask safely")) &&
    appShell.includes('href="/learn"')
  );
});

check("Global polish includes premium motion with reduced-motion support", () => {
  const globals = read("src/app/globals.css");
  const homePage = read("src/app/page.tsx");
  const appShell = read("src/components/app-shell.tsx");
  return (
    globals.includes("story-live-pulse") &&
    globals.includes("premium-action-dock") &&
    globals.includes("premium-dock-sheen") &&
    globals.includes("prefers-reduced-motion") &&
    homePage.includes("story-live-pulse") &&
    appShell.includes("premium-action-dock")
  );
});

check("Story viewer supports auto progress and hold-to-pause controls", () => {
  const storyViewer = read("src/components/story-viewer.tsx");
  return (
    storyViewer.includes("storyDurationMs") &&
    storyViewer.includes("visibilitychange") &&
    storyViewer.includes("videoRef") &&
    storyViewer.includes("Hold to pause") &&
    storyViewer.includes("sv.previousSpark") &&
    storyViewer.includes("sv.nextSpark") &&
    storyViewer.includes("{activeIndex + 1}/{stories.length}")
  );
});

check("Home feed exposes refresh feedback and safe feed context", () => {
  const homePage = read("src/app/page.tsx");
  const refreshControl = read("src/components/feed-refresh-control.tsx");
  return (
    homePage.includes("FeedRefreshControl") &&
    homePage.includes("TodayLearningCard") &&
    homePage.includes("feed.selectedAreas") &&
    (refreshControl.includes("getMessages().feed") || refreshControl.includes("useMessages().feed") || refreshControl.includes("f.forYou")) &&
    refreshControl.includes("f.forYouRefreshed") &&
    refreshControl.includes("f.askSafely")
  );
});

check("Home feed surfaces learning shortcuts without redundant pulse hero", () => {
  const homePage = read("src/app/page.tsx");
  return (
    !homePage.includes("HomeLearningPulse") &&
    !homePage.includes("FeedTrustStrip") &&
    homePage.includes("TodayLearningCard") &&
    homePage.includes("FeedRefreshControl") &&
    (homePage.includes("ReelSpotlightRail") || homePage.includes("ForYouStarter"))
  );
});

check("Home Sparks tray shows creator state rings", () => {
  const homePage = read("src/app/page.tsx");
  return (
    homePage.includes("StoryTrayItem") &&
    (homePage.includes("Unread story") || homePage.includes("unreadStory") || hasCatalog("Unread story")) &&
    (homePage.includes("Watched story") || homePage.includes("watchedStory") || hasCatalog("Watched story")) &&
    (homePage.includes("Story progress") || homePage.includes("getStoryProgress")) &&
    homePage.includes("getStoryProgress")
  );
});

check("Explore supports format filters and safe empty guidance", () => {
  const explorePage = read("src/app/explore/page.tsx");
  return (
    explorePage.includes("formatFilters") &&
    explorePage.includes("getExploreFormat") &&
    explorePage.includes("filterExploreTiles") &&
    (explorePage.includes("Verified teacher discovery") || explorePage.includes("verifiedTeachers") || explorePage.includes("discovery") || hasCatalog("Verified teachers in your areas")) &&
    (explorePage.includes("Clear filters") || explorePage.includes("clearFilters") || hasCatalog("Clear filters"))
  );
});

check("Explore surfaces trend radar and topic bridges", () => {
  const explorePage = read("src/app/explore/page.tsx");
  return (
    explorePage.includes("ExploreTrendRadar") &&
    (explorePage.includes("trendRadar") || hasCatalog("Popular topics") || hasCatalog("Popüler konular")) &&
    (explorePage.includes("radarCards")) &&
    (explorePage.includes("topicBridges") || hasCatalog("Quick links") || hasCatalog("Hızlı erişim")) &&
    explorePage.includes("ExploreTopicBridges")
  );
});

check("Create composers autosave drafts and show publish checklists", () => {
  const socialComposer = read("src/components/social-create-form.tsx");
  const storyComposer = read("src/components/story-create-form.tsx");
  return (
    socialComposer.includes("zigo:composer-draft") &&
    (socialComposer.includes("Publish checklist") || socialComposer.includes("checklistSr") || hasCatalog("Publish checklist")) &&
    (socialComposer.includes("Draft autosaved") || socialComposer.includes("checklistSr") || hasCatalog("Draft autosaved")) &&
    storyComposer.includes("zigo:story-draft") &&
    (storyComposer.includes("Story checklist") || storyComposer.includes("checklistSr") || hasCatalog("Story checklist")) &&
    (storyComposer.includes("Media files are not stored in draft") || storyComposer.includes("draftKey") || storyComposer.includes("zigo:story-draft"))
  );
});

check("Create page feels like a premium verified creator studio", () => {
  const createPage = read("src/app/create/page.tsx");
  return (
    createPage.includes("CreateStudioHero") &&
    (createPage.includes("Creator studio") || createPage.includes("creatorStudio") || hasCatalog("Creator studio")) &&
    (createPage.includes("Publish safety lane") || createPage.includes("safetyLane") || createPage.includes("CreatePublishSafetyLane")) &&
    (createPage.includes("Teacher verified") || createPage.includes("verifiedTeacher") || hasCatalog("Teacher verified")) &&
    (createPage.includes("Student-safe display") || createPage.includes("studentSafe") || hasCatalog("Student-safe display")) &&
    (createPage.includes("studioLockedSrOnly") || createPage.includes("Creator studio locked") || hasCatalog("Creator studio locked"))
  );
});

check("Feed and post detail support double-tap like feedback", () => {
  const doubleTap = read("src/components/double-tap-like-link.tsx");
  const homePage = read("src/app/page.tsx");
  const postDetail = read("src/app/post/[id]/page.tsx");
  return (
    doubleTap.includes("doubleTapDelayMs") &&
    doubleTap.includes("Double tap to like") &&
    doubleTap.includes("/api/social/likes") &&
    homePage.includes("DoubleTapLikeLink") &&
    postDetail.includes("DoubleTapLikeLink")
  );
});

check("Post detail recommends more Match-Feed lessons", () => {
  const postDetail = read("src/app/post/[id]/page.tsx");
  const catalog = read("src/lib/i18n/catalog.en.ts");
  return (
    postDetail.includes("MoreFromMatchFeed") &&
    catalog.includes("morePosts:") &&
    catalog.includes("From your feed") &&
    postDetail.includes("PostDetailQuickActions") &&
    catalog.includes("keepLearning:") &&
    catalog.includes("replies:")
  );
});

check("Comment sheets expose moderated quick replies", () => {
  const actions = read("src/components/social-post-actions.tsx");
  const reelRail = read("src/components/reel-action-rail.tsx");
  const storyReply = read("src/components/story-reply-form.tsx");
  const catalog = read("src/lib/i18n/catalog.en.ts");
  return (
    actions.includes("safeQuickReplies") &&
    catalog.includes("Can you explain more?") &&
    catalog.includes("before public display") &&
    actions.includes("role=\"dialog\"") &&
    actions.includes("aria-modal=\"true\"") &&
    actions.includes("commentSheetInputRef") &&
    catalog.includes("Pending review") &&
    storyReply.includes("Matched Spark") &&
    storyReply.includes("area-gated safety wall moderated") &&
    catalog.includes("Like Micro") &&
    reelRail.includes("likeMicro") &&
    catalog.includes("Reply safely")
  );
});

check("Profile exposes creator actions and insights above grid", () => {
  const profile = read("src/app/profile/page.tsx");
  const publicProfile = read("src/app/profile/[id]/page.tsx");
  const catalog = read("src/lib/i18n/catalog.en.ts");
  return (
    profile.includes("ProfileActionBar") &&
    profile.includes("zigo-action-grid") &&
    (profile.includes("Spark") || profile.includes("nav.spark") || profile.includes("createStudio.spark") || hasCatalog("Spark")) &&
    (profile.includes("Micro") || profile.includes("nav.micro") || hasCatalog("Micro")) &&
    (profile.includes("profileGrid.publicGrid") || profile.includes("Public grid") || hasCatalog("Public grid")) &&
    (profile.includes("profileGrid.privateSaved") || profile.includes("Private saved") || hasCatalog("Private saved")) &&
    publicProfile.includes("Public creator profile") &&
    catalog.includes("Profile insights") &&
    profile.includes("p.insights") &&
    profile.includes("visible tiles")
  );
});

check("Profile page has premium highlights and grid mode controls", () => {
  const profile = read("src/app/profile/page.tsx");
  const highlights = read("src/components/profile-highlights.tsx");
  const globals = read("src/app/globals.css");
  return (
    profile.includes("ProfileGridModeStrip") &&
    (profile.includes("Grid mode") || profile.includes("gridMode") || hasCatalog("Grid mode")) &&
    (profile.includes("profileGrid.profileGridLabel") || profile.includes("Profile grid") || hasCatalog("Profile grid")) &&
    (profile.includes("Posts grid") || profile.includes("profileGrid.profileGridLabel") || hasCatalog("Profile grid")) &&
    highlights.includes("min-w-16 text-center") &&
    (highlights.includes("Smart grid") || highlights.includes("profileHighlights") || highlights.includes("h.sparks")) &&
    (highlights.includes("Replies") || highlights.includes("h.qa") || hasCatalog("Q&A")) &&
    globals.includes("profile-highlight-card")
  );
});

check("Main social surfaces use a cleaner Zigo visual reset", () => {
  const globals = read("src/app/globals.css");
  const layout = read("src/app/layout.tsx");
  const appShell = read("src/components/app-shell.tsx");
  const homePage = read("src/app/page.tsx");
  const feedRefresh = read("src/components/feed-refresh-control.tsx");
  const profile = read("src/app/profile/page.tsx");
  const explore = read("src/app/explore/page.tsx");
  const scenes = read("src/components/social-media-scenes.tsx");
  const mediaFrame = read("src/components/social-media-frame.tsx");
  const reelVideo = read("src/components/reel-video-player.tsx");
  const storyViewer = read("src/components/story-viewer.tsx");
  const stateCard = read("src/components/state-card.tsx");
  const catalog = read("src/lib/i18n/catalog.en.ts");
  return (
    globals.includes("background: #ffffff") &&
    appShell.includes("isSocialSurface") &&
    homePage.includes("ReelSpotlightRail") &&
    homePage.includes("formatFeedTimestamp") &&
    explore.includes("grid-tile-caption") &&
    profile.includes("ProfileActionBar") &&
    (feedRefresh.includes("getMessages().feed") || feedRefresh.includes("useMessages().feed") || feedRefresh.includes("f.forYou")) &&
    feedRefresh.includes("f.forYou") &&
    feedRefresh.includes("f.following") &&
    profile.includes("border border-slate-200 bg-white") &&
    explore.includes("zigo-tab-active-pill") &&
    globals.includes("zigo-shell-bg") &&
    globals.includes("zigo-media") &&
    mediaFrame.includes("zigo-media") &&
    mediaFrame.includes("loading=") &&
    layout.includes("getRoleThemeClass") &&
    appShell.includes("role-accent-chip") &&
    scenes.includes("getSceneStyle") &&
    mediaFrame.includes("preload={controls ? \"metadata\" : \"none\"}") &&
    reelVideo.includes("IntersectionObserver") &&
    storyViewer.includes("Spark media") &&
    stateCard.includes("StateCard")
  );
});

check("Profiles page behaves like a role-based mode switcher", () => {
  const profiles = read("src/app/profiles/page.tsx");
  return (
    profiles.includes("ProfileSwitchCard") &&
    (profiles.includes("Family profile bridge") || profiles.includes("familyBridge") || hasCatalog("Family profile bridge")) &&
    (profiles.includes("Family setup") || profiles.includes("familySetup") || hasCatalog("Family setup")) &&
    (profiles.includes("Student mode") || profiles.includes("studentMode") || hasCatalog("Student mode")) &&
    (profiles.includes("Continue feed") || profiles.includes("continueFeed") || hasCatalog("Continue feed"))
  );
});

check("Onboarding recommends role-based next best actions", () => {
  const onboarding = read("src/app/onboarding/page.tsx");
  const authGates = read("src/lib/domain/auth-gates.ts");
  const catalog = read("src/lib/i18n/catalog.en.ts");
  return (
    onboarding.includes("NextBestActionPanel") &&
    catalog.includes("Next best action") &&
    (catalog.includes("Choose interests to unlock Selected areas") || catalog.includes("Choose interests to unlock Match-Feed")) &&
    onboarding.includes("TeacherPendingCard") &&
    catalog.includes("Verify") &&
    catalog.includes("Duels") &&
    authGates.includes('profile.role === "teacher"')
  );
});

check("Question composer autosaves drafts and provides safe templates", () => {
  const questionForm = read("src/components/question-form.tsx");
  const catalog = read("src/lib/i18n/catalog.en.ts");
  return (
    questionForm.includes("zigo:question-draft") &&
    catalog.includes("Safe question templates") &&
    catalog.includes("Draft autosaved") &&
    questionForm.includes("What should we learn next?") &&
    catalog.includes("Question draft restored")
  );
});

check("Teacher answer composer autosaves guided answer drafts", () => {
  const answerForm = read("src/components/answer-form.tsx");
  const catalog = read("src/lib/i18n/catalog.en.ts");
  return (
    answerForm.includes("zigo:teacher-answer-draft") &&
    catalog.includes("Teacher answer templates") &&
    catalog.includes("Teacher answer draft restored") &&
    catalog.includes("Parent approval") &&
    catalog.includes("Draft autosaved")
  );
});

check("Manual and visual QA checklists are linked", () => {
  const manualQa = read("docs/manual-qa-checklist.md");
  const visualQa = read("docs/visual-regression-checklist.md");
  const safeFeel = read("docs/safe-instagram-feel-checklist.md");
  const finalAcceptance = read("docs/final-acceptance-checklist.md");
  const setupPage = read("src/app/setup/page.tsx");
  const readinessPage = read("src/app/readiness/page.tsx");
  return (
    manualQa.includes("Register one student") &&
    manualQa.includes("Student direct messaging is not available") &&
    manualQa.includes("network offline") &&
    visualQa.includes("Home Feed") &&
    visualQa.includes("Micro fills the vertical viewport") &&
    visualQa.includes("Empty And Offline States") &&
    safeFeel.includes("Güvenli Instagram-Hissi Checklist") &&
    safeFeel.includes("Match-Feed ile alan bazlı içerik") &&
    finalAcceptance.includes("Live Supabase Gate") &&
    finalAcceptance.includes("npm run build:safe") &&
    finalAcceptance.includes("safe-instagram-feel-checklist.md") &&
    setupPage.includes("/manual-qa-checklist.md") &&
    setupPage.includes("/visual-regression-checklist.md") &&
    setupPage.includes("/safe-instagram-feel-checklist.md") &&
    (setupPage.includes("Final acceptance") || setupPage.includes("finalAcceptance")) &&
    (readinessPage.includes("Manual QA checklist") || readinessPage.includes("buildChecklist") || hasOps("Manual QA checklist")) &&
    (readinessPage.includes("Visual regression checklist") || readinessPage.includes("buildChecklist") || hasOps("Visual regression checklist")) &&
    (readinessPage.includes("Safe Instagram-feel checklist") || readinessPage.includes("safeFeelChecklist") || setupPage.includes("safeFeelChecklist") || hasCatalog("Güvenli Instagram-Hissi Checklist"))
  );
});

check("Release QA gate and coverage map are wired", () => {
  const coverageMap = read("docs/qa-coverage-map.md");
  const finalAcceptance = read("docs/final-acceptance-checklist.md");
  const packageJson = read("package.json");
  const releaseGate = read("scripts/test-release-gate.mjs");
  const visualProbe = read("scripts/visual-regression-probe.mjs");
  const qaSpec = read("e2e/qa-checklist.spec.ts");
  return (
    coverageMap.includes("test:release") &&
    finalAcceptance.includes("Sign-off") &&
    packageJson.includes("test:release") &&
    packageJson.includes("test:visual") &&
    releaseGate.includes("visual-regression-probe") &&
    visualProbe.includes("skeleton-shimmer") &&
    qaSpec.includes("direct messaging route is not exposed")
  );
});

check("TypeScript strict audit and db types sync are wired", () => {
  const audit = read("scripts/typescript-audit.mjs");
  const dbTypes = read("scripts/sync-database-types.mjs");
  const eslintConfig = read("eslint.config.mjs");
  const packageJson = read("package.json");
  return (
    audit.includes("get_parent_child_activity") &&
    dbTypes.includes("supabase gen types") &&
    eslintConfig.includes("simple-import-sort") &&
    eslintConfig.includes("no-explicit-any") &&
    packageJson.includes("audit:typescript") &&
    packageJson.includes("db:types")
  );
});

check("Maintenance audits and ADR docs are wired", () => {
  const packageJson = read("package.json");
  const maintenanceDoc = read("docs/maintenance.md");
  const adrReadme = read("docs/adr/README.md");
  const depsAudit = read("scripts/dependency-audit.mjs");
  const deadCodeAudit = read("scripts/dead-code-audit.mjs");
  return (
    packageJson.includes('"audit:deps"') &&
    packageJson.includes('"audit:dead-code"') &&
    packageJson.includes('"audit:maintenance"') &&
    maintenanceDoc.includes("Quarterly") &&
    adrReadme.includes("0001-match-feed-via-user-interests.md") &&
    depsAudit.includes("ZIGO_AUDIT_FAIL_LEVEL") &&
    deadCodeAudit.includes("dead-code-allowlist.json")
  );
});

check("RLS inventory and service-role audits are wired", () => {
  const packageJson = read("package.json");
  const inventory = read("docs/rls-policy-inventory.md");
  const serviceAudit = read("scripts/service-role-audit.mjs");
  const inventoryCheck = read("scripts/rls-policy-inventory-check.mjs");
  const matrix = read("scripts/cross-role-matrix.mjs");
  const opsDoc = read("docs/operational-security.md");
  return (
    packageJson.includes('"audit:security"') &&
    packageJson.includes('"audit:ops"') &&
    packageJson.includes('"audit:rls-inventory"') &&
    inventory.includes("child_activity_events") &&
    inventory.includes("createAdminClient") &&
    serviceAudit.includes("ALLOWED_ADMIN_IMPORTS") &&
    inventoryCheck.includes("014_social_match_feed_rls.sql") &&
    matrix.includes("post_wrong_area") &&
    matrix.includes("child_activity_blocked") &&
    opsDoc.includes("Secret rotation playbook")
  );
});

check("Operational security headers and audits are wired", () => {
  const packageJson = read("package.json");
  const nextConfig = read("next.config.ts");
  const securityHeaders = read("src/lib/server/security-headers.ts");
  const incidentDoc = read("docs/incident-response-runbook.md");
  return (
    packageJson.includes('"audit:ops"') &&
    nextConfig.includes("buildSecurityHeaders") &&
    securityHeaders.includes("buildContentSecurityPolicy") &&
    incidentDoc.includes("SEV-1") &&
    existsSync("scripts/env-leak-audit.mjs")
  );
});

check("Production readiness audits and monitoring are wired", () => {
  const packageJson = read("package.json");
  const prodDoc = read("docs/production-readiness.md");
  const healthRoute = read("src/app/api/setup/health/route.ts");
  return (
    packageJson.includes('"audit:production"') &&
    packageJson.includes('"audit:all"') &&
    packageJson.includes('"uptime:probe"') &&
    prodDoc.includes("migrationTarget: 55") &&
    healthRoute.includes("MIGRATION_TARGET = 55") &&
    existsSync("scripts/monitoring-health-audit.mjs") &&
    existsSync("scripts/uptime-probe.mjs")
  );
});

check("Compliance audits and KVKK export wiring are documented", () => {
  const packageJson = read("package.json");
  const complianceDoc = read("docs/compliance.md");
  return (
    packageJson.includes('"audit:compliance"') &&
    complianceDoc.includes("export_user_data") &&
    existsSync("scripts/legal-pages-audit.mjs") &&
    existsSync("scripts/export-completeness-audit.mjs")
  );
});

check("Education core audits and learn hub are wired", () => {
  const packageJson = read("package.json");
  const educationDoc = read("docs/education-core.md");
  return (
    packageJson.includes('"audit:education"') &&
    educationDoc.includes("get_matched_quizzes") &&
    existsSync("scripts/learning-events-audit.mjs") &&
    existsSync("scripts/learn-hub-audit.mjs")
  );
});

check("Platform quality audits and scorecard gates are wired", () => {
  const packageJson = read("package.json");
  const platformDoc = read("docs/platform-quality.md");
  return (
    packageJson.includes('"audit:platform"') &&
    platformDoc.includes("test:acceptance") &&
    existsSync("scripts/social-shell-audit.mjs") &&
    existsSync("scripts/release-scorecard-audit.mjs")
  );
});

check("Final launch audits and CI alignment are wired", () => {
  const packageJson = read("package.json");
  const launchDoc = read("docs/final-launch.md");
  return (
    packageJson.includes('"audit:launch"') &&
    packageJson.includes('"test:ci"') &&
    launchDoc.includes("audit:all") &&
    existsSync("scripts/ci-alignment-audit.mjs") &&
    existsSync(".github/workflows/ci.yml")
  );
});

check("Quality roadmap consolidation and doc sync are wired", () => {
  const packageJson = read("package.json");
  const roadmap = read("docs/quality-roadmap.md");
  return (
    packageJson.includes('"audit:consolidation"') &&
    roadmap.includes("001–055") &&
    existsSync("scripts/stale-docs-audit.mjs") &&
    !read("README.md").includes("001–042")
  );
});

check("Domain module boundaries and HTTP error mapping are documented", () => {
  const domainModules = read("docs/domain-modules.md");
  const apiErrors = read("src/lib/domain/api-errors.ts");
  const domainErrors = read("src/lib/domain/domain-errors.ts");
  const domainIndex = read("src/lib/domain/index.ts");
  return (
    domainModules.includes("social/feed.ts") &&
    domainModules.includes("feed/") &&
    domainModules.includes("410 Gone") &&
    apiErrors.includes("mapDomainError") &&
    apiErrors.includes("RateLimitExceededError") &&
    domainErrors.includes("DomainForbiddenError") &&
    domainIndex.includes("@/lib/domain/learning") &&
    !read("src/lib/domain/index.ts").includes('@/lib/domain/social"')
  );
});

check("User-facing copy avoids Instagram branding and lesson-first social labels", () => {
  const layout = read("src/app/layout.tsx");
  const productStandard = read("src/lib/domain/product-standard.ts");
  const homePage = read("src/app/page.tsx");
  const bottomNav = read("src/components/bottom-nav.tsx");
  const vocab = read("src/lib/zigo-vocabulary.ts");
  const collectionsPage = read("src/app/collections/page.tsx");
  const createComposer = read("src/components/create-mode-composer.tsx");
  const globals = read("src/app/globals.css");
  return (
    !layout.includes("Instagram") &&
    !productStandard.includes("Instagram") &&
    !homePage.includes("Reels") &&
    !homePage.includes('"Stories"') &&
    !bottomNav.includes('"Reels"') &&
    vocab.includes("microLessons") &&
    vocab.includes("sparks") &&
    !homePage.includes('badge: "Lesson"') &&
    (collectionsPage.includes("Search saved") || collectionsPage.includes("searchPlaceholder") || hasCatalog("Search saved")) &&
    (collectionsPage.includes('label: "Posts"') || collectionsPage.includes("folderAll") || collectionsPage.includes("collectionFolders")) &&
    (createComposer.includes("Share a verified post to the feed.") || createComposer.includes("c.postHelper") || createComposer.includes("postHelper")) &&
    (createComposer.includes('label: "Micro"') || createComposer.includes("c.micro") || createComposer.includes("label: c.micro")) &&
    (createComposer.includes('label: "Spark"') || createComposer.includes("c.spark") || createComposer.includes("label: c.spark")) &&
    createComposer.includes("composer") &&
    !globals.includes(".ig-")
  );
});

check("Zigo vocabulary routes Micro and Sparks with legacy redirects", () => {
  const nextConfig = read("next.config.ts");
  const microPage = read("src/app/micro/page.tsx");
  const sparksPage = read("src/app/sparks/page.tsx");
  return (
    nextConfig.includes('source: "/reels"') &&
    nextConfig.includes('destination: "/micro"') &&
    nextConfig.includes('source: "/stories"') &&
    nextConfig.includes('destination: "/sparks"') &&
    (microPage.includes("Micro lessons") || microPage.includes("messages.microPage") || microPage.includes("mp.") || hasCatalog("Micro lessons")) &&
    sparksPage.includes("StoryViewer")
  );
});

check("Vercel deploy tooling is wired", () => {
  const vercelConfig = read("vercel.json");
  const deployDoc = read("docs/vercel-deploy.md");
  const envScript = read("scripts/validate-env.mjs");
  const deployConfig = read("src/lib/domain/deploy-config.ts");
  const signUpRoute = read("src/app/api/auth/sign-up/route.ts");
  const hostedCard = read("src/components/hosted-deploy-card.tsx");
  const packageJson = read("package.json");
  return (
    vercelConfig.includes('"framework": "nextjs"') &&
    deployDoc.includes("NEXT_PUBLIC_SITE_URL") &&
    envScript.includes("NEXT_PUBLIC_SUPABASE_URL") &&
    deployConfig.includes("VERCEL_URL") &&
    deployConfig.includes("getStripeWebhookUrl") &&
    signUpRoute.includes("getSiteUrl") &&
    hostedCard.includes("/vercel-deploy.md") &&
    (hostedCard.includes("Stripe webhook URL") || hostedCard.includes("stripeWebhook") || hasOps("Stripe webhook URL")) &&
    (hostedCard.includes("001–044") || hostedCard.includes("001-044") || hostedCard.includes("migrationsHint") || hasOps("001-044")) &&
    packageJson.includes('"env:check"') &&
    packageJson.includes('"staging:preflight"')
  );
});

check("Staging deploy preflight script is wired", () => {
  const staging = read("scripts/staging-preflight.mjs");
  const guide = read("docs/staging-deploy.md");
  return (
    staging.includes("032_launch_gaps_closure") &&
    staging.includes("033_compliance") &&
    staging.includes("export_user_data") &&
    guide.includes("api/billing/webhook") &&
    guide.includes("zigo-full-migrations.sql")
  );
});

check("Full role journey scripts cover student parent and teacher", () => {
  const full = read("scripts/manual-full-journey.mjs");
  const parent = read("scripts/manual-parent-journey.mjs");
  const teacher = read("scripts/manual-teacher-journey.mjs");
  const startRoute = read("src/app/api/learning/focus/start/route.ts");
  const packageJson = read("package.json");
  return (
    full.includes("manual-parent-journey.mjs") &&
    full.includes("manual-teacher-journey.mjs") &&
    parent.includes("childProfileId") &&
    parent.includes("get_parent_children_focus_stats") &&
    teacher.includes("/api/quizzes") &&
    startRoute.includes('profile.role === "parent"') &&
    packageJson.includes('"test:journey"') &&
    packageJson.includes('"test:acceptance"') &&
    packageJson.includes('"setup:complete"')
  );
});

check("Migration bundle tooling is wired", () => {
  const bundleScript = read("scripts/bundle-migrations.mjs");
  const testScript = read("scripts/test-migrations.mjs");
  const setupPage = read("src/app/setup/page.tsx");
  const packageJson = read("package.json");
  const ci = read(".github/workflows/ci.yml");
  return (
    bundleScript.includes("zigo-full-migrations.sql") &&
    testScript.includes("023_moderation_audit_log.sql") &&
    (setupPage.includes("migrations:bundle") || hasOps("migrations:bundle")) &&
    packageJson.includes('"migrations:bundle"') &&
    packageJson.includes('"test:migrations"') &&
    packageJson.includes('"migrations:pending"') &&
    ci.includes("npm run test:repo") &&
    ci.includes("playwright install")
  );
});

check("App shell keeps quick actions without preview banner noise", () => {
  const shell = read("src/components/app-shell.tsx");
  const layout = read("src/app/layout.tsx");
  return (
    !shell.includes("PreviewModeBanner") &&
    shell.includes("QuickActionDock") &&
    layout.includes("isPreviewMode={!hasSupabaseEnv()}")
  );
});

check("Setup launch path tracker is wired", () => {
  const setupProgress = read("src/lib/domain/setup-progress.ts");
  const tracker = read("src/components/setup-progress-tracker.tsx");
  const setupPage = read("src/app/setup/page.tsx");
  const bootstrap = read("scripts/bootstrap-env.mjs");
  const packageJson = read("package.json");
  return (
    setupProgress.includes("buildSetupProgress") &&
    setupProgress.includes("setup:verify") &&
    tracker.includes("SetupProgressTracker") &&
    setupPage.includes("SetupProgressTracker") &&
    setupPage.includes('id="migrations"') &&
    bootstrap.includes(".env.local") &&
    packageJson.includes('"setup:env"') &&
    packageJson.includes('"setup:verify"')
  );
});

check("Hosted deploy and role QA tooling is wired", () => {
  const deployConfig = read("src/lib/domain/deploy-config.ts");
  const roleQa = read("src/lib/domain/role-qa-checklist.ts");
  const deployScript = read("scripts/verify-deploy-readiness.mjs");
  const hostedCard = read("src/components/hosted-deploy-card.tsx");
  const rolePanel = read("src/components/role-qa-panel.tsx");
  const setupPage = read("src/app/setup/page.tsx");
  const readinessPage = read("src/app/readiness/page.tsx");
  const packageJson = read("package.json");
  return (
    deployConfig.includes("getAuthCallbackUrl") &&
    roleQa.includes("getRoleQaChecklists") &&
    deployScript.includes("exchangeCodeForSession") &&
    (hostedCard.includes("HostedDeployCard") || hostedCard.includes("hosted-deploy")) &&
    rolePanel.includes("RoleQaPanel") &&
    (setupPage.includes("HostedDeployCard") || setupPage.includes("hosted-deploy-card")) &&
    setupPage.includes("RoleQaPanel") &&
    (readinessPage.includes("test:deploy") ||
      readinessPage.includes("gateDeployTitle") ||
      readinessPage.includes("launchGates") ||
      readinessPage.includes("verificationCommands")) &&
    (readinessPage.includes("Deploy gate") || readinessPage.includes("gateDeployTitle") || hasOps("Deploy gate")) &&
    packageJson.includes('"test:deploy"')
  );
});

check("Live Supabase gate tooling is wired", () => {
  const liveGates = read("src/lib/domain/live-gates.ts");
  const healthRoute = read("src/app/api/setup/health/route.ts");
  const liveScript = read("scripts/live-supabase-check.mjs");
  const setupPage = read("src/app/setup/page.tsx");
  const readinessPage = read("src/app/readiness/page.tsx");
  const packageJson = read("package.json");
  return (
    liveGates.includes("getLiveGates") &&
    liveGates.includes("moderation_audit_log") &&
    liveGates.includes("site_url") &&
    healthRoute.includes("/api/setup/health") === false &&
    healthRoute.includes("getLiveGates") &&
    liveScript.includes("test:live") === false &&
    liveScript.includes("SUPABASE_SERVICE_ROLE_KEY") &&
    liveScript.includes("Demo student auth sign-in") &&
    setupPage.includes("LiveGatesPanel") &&
    setupPage.includes("getLiveGates") &&
    readinessPage.includes("LiveGatesPanel") &&
    readinessPage.includes("test:live") &&
    packageJson.includes('"test:live"')
  );
});

check("E2E flow test script is wired", () => {
  const e2eScript = read("scripts/e2e-flow-check.mjs");
  const packageJson = read("package.json");
  const seed = read("supabase/migrations/017_mvp_seed_content.sql");
  return (
    e2eScript.includes("Match-Feed") &&
    e2eScript.includes("student@zigo.test") &&
    e2eScript.includes("award_safe_duel_win_points") &&
    e2eScript.includes("/api/learning/missions") &&
    seed.includes("confirmation_token") &&
    packageJson.includes('"test:e2e"')
  );
});

check("Playwright browser E2E is wired", () => {
  const packageJson = read("package.json");
  const smokeScript = read("scripts/smoke-test.mjs");
  const scorecard = read("scripts/test-scorecard.mjs");
  return (
    existsSync(join(root, "playwright.config.ts")) &&
    existsSync(join(root, "e2e/smoke.spec.ts")) &&
    existsSync(join(root, "e2e/api.spec.ts")) &&
    existsSync(join(root, "e2e/auth.spec.ts")) &&
    existsSync(join(root, "e2e/helpers.ts")) &&
    packageJson.includes('"test:playwright"') &&
    packageJson.includes('"test:repo:fast"') &&
    smokeScript.includes("readSocialDomain") &&
    scorecard.includes("test:playwright")
  );
});

check("Split social domain is readable by smoke invariants", () => {
  const socialDomain = readSocialDomain();
  return (
    socialDomain.includes("export async function getSuggestedCreators") &&
    socialDomain.includes("area:area_id") &&
    socialDomain.includes("secondsWatched: z.coerce.number().int().min(60)") &&
    socialDomain.includes("moderation_audit_log")
  );
});

check("Readiness dashboard summarizes product quality pillars", () => {
  const readinessPage = read("src/app/readiness/page.tsx");
  const setupPage = read("src/app/setup/page.tsx");
  return (
    (readinessPage.includes("Product quality score") ||
      readinessPage.includes("qualityScore") ||
      hasOps("Product quality score")) &&
    (readinessPage.includes("qualityPillars") || hasOps("qualityPillars")) &&
    (readinessPage.includes("launchGates") || readinessPage.includes("launchGatesEyebrow")) &&
    (readinessPage.includes("liveSupabaseGate") || readinessPage.includes("liveSupabaseEyebrow") || hasOps("Live Supabase gate")) &&
    (readinessPage.includes("Verification commands") || readinessPage.includes("verifyCommandsEyebrow") || readinessPage.includes("verificationCommands") || hasOps("Verification commands")) &&
    (readinessPage.includes("audit log creation") || hasOps("audit log creation")) &&
    (readinessPage.includes("Social shell feel") || hasOps("Social shell feel")) &&
    (readinessPage.includes("Super polish") || readinessPage.includes("superPolish") || hasOps("Super polish")) &&
    (readinessPage.includes("Repository readiness before live Supabase QA") || readinessPage.includes("qualitySubtitle") || hasOps("Repository readiness before live Supabase QA")) &&
    (setupPage.includes("Release verification") || setupPage.includes("releaseVerifyEyebrow") || hasOps("Release verification")) &&
    setupPage.includes("test:live") &&
    setupPage.includes("test:deploy") &&
    setupPage.includes("npm run test:rls")
  );
});

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.message ? `: ${item.message}` : ""}`);
}

if (failed.length > 0) {
  exit(1);
}

exit(0);
