import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type User360Core = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  is_premium: boolean;
  account_status: "active" | "suspended" | "limited" | "closed";
  social_safety_strike_count: number;
  social_interactions_blocked: boolean;
  social_interactions_blocked_at: string | null;
  bio: string | null;
  avatar_url: string | null;
  student_document_url: string | null;
  student_document_status: string | null;
  student_document_submitted_at: string | null;
  student_document_reviewed_at: string | null;
  organization_type: string | null;
  teacher_creator_plus: boolean;
  created_at: string;
  level: number;
  total_points: number;
  streak_days: number;
  last_active_date: string | null;
  website_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  classroom: string | null;
  school_name: string | null;
  district: string | null;
  grade_level: string | null;
};

export type User360Subscription = {
  plan_slug: string | null;
  status: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  is_active: boolean;
};

export type User360BillingGrant = {
  id: string;
  kind: string;
  duration_days: number;
  note: string | null;
  period_ends_at: string | null;
  created_at: string;
};

export type User360BankTransfer = {
  id: string;
  plan_slug: string;
  amount_krs: number;
  status: string;
  receipt_url: string | null;
  created_at: string;
  admin_note: string | null;
};

export type User360Violation = {
  id: string;
  violation_type: string;
  severity: string;
  notes: string | null;
  created_at: string;
};

export type User360Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
};

export type User360AdminMessage = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export type User360AdminNote = {
  id: string;
  admin_id: string;
  admin_name?: string;
  note: string;
  tags: string[];
  created_at: string;
};

export type User360Post = {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  is_hidden: boolean;
  created_at: string;
};

export type User360GameScore = {
  game_type: string;
  high_score: number;
  level: number;
  stars: number;
  updated_at: string;
};

export type User360QuizAttempt = {
  id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  created_at: string;
};

export type User360LessonRequest = {
  id: string;
  student_name: string;
  topic: string;
  status: string;
  hourly_rate_krs: number | null;
  created_at: string;
};

export type User360Child = {
  id: string;
  display_name: string;
  age_group: string | null;
  total_points: number;
  created_at: string;
};

export type User360ParentConsent = {
  id: string;
  parent_email: string;
  status: string;
  requested_at: string;
  decided_at: string | null;
};

export type User360Data = {
  user: User360Core;
  subscription: User360Subscription;
  trial: {
    isWithin7Days: boolean;
    remainingDays: number;
    discountPercent: number;
  };
  billingGrants: User360BillingGrant[];
  bankTransfers: User360BankTransfer[];
  violations: User360Violation[];
  reports: User360Report[];
  adminMessages: User360AdminMessage[];
  adminNotes: User360AdminNote[];
  posts: User360Post[];
  roleSpecific: {
    gameMinutesToday: number;
    gameLimitMinutes: number;
    isCurfewActive: boolean;
    gameScores: User360GameScore[];
    quizAttempts: User360QuizAttempt[];
    parentConsent: User360ParentConsent | null;
    lessonRequests: User360LessonRequest[];
    teacherAreas: string[];
    children: User360Child[];
  };
};

/**
 * Calculates 7-day trial and 50% discount window eligibility
 */
export function calculateTrialEligibility(createdAtStr: string) {
  const createdAt = new Date(createdAtStr);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return {
      isWithin7Days: true,
      remainingDays: Math.max(0, 7 - diffDays),
      discountPercent: 50,
    };
  }

  return {
    isWithin7Days: false,
    remainingDays: 0,
    discountPercent: 0,
  };
}

/**
 * Checks if Turkey curfew (22:00 - 08:00) is currently active
 */
export function isGameCurfewActive(now: Date = new Date()): boolean {
  const utcHours = now.getUTCHours();
  const turkeyHour = (utcHours + 3) % 24;
  return turkeyHour >= 22 || turkeyHour < 8;
}

/**
 * Loads the complete 360-degree profile dossier for a given user ID
 */
export async function getUser360Details(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<User360Data | null> {
  const client = createAdminClient() ?? supabase;

  // 1. Core user query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawUser, error: userError } = await (client as any)
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !rawUser) {
    return null;
  }

  const user: User360Core = {
    id: rawUser.id,
    email: rawUser.email ?? "",
    full_name: rawUser.full_name ?? "",
    role: rawUser.role ?? "student",
    is_verified: Boolean(rawUser.is_verified),
    is_premium: Boolean(rawUser.is_premium),
    account_status: rawUser.account_status ?? "active",
    social_safety_strike_count: rawUser.social_safety_strike_count ?? 0,
    social_interactions_blocked: Boolean(rawUser.social_interactions_blocked),
    social_interactions_blocked_at: rawUser.social_interactions_blocked_at ?? null,
    bio: rawUser.bio ?? null,
    avatar_url: rawUser.avatar_url ?? null,
    student_document_url: rawUser.student_document_url ?? null,
    student_document_status: rawUser.student_document_status ?? null,
    student_document_submitted_at: rawUser.student_document_submitted_at ?? null,
    student_document_reviewed_at: rawUser.student_document_reviewed_at ?? null,
    organization_type: rawUser.organization_type ?? null,
    teacher_creator_plus: Boolean(rawUser.teacher_creator_plus),
    created_at: rawUser.created_at,
    level: rawUser.level ?? 1,
    total_points: rawUser.total_points ?? 0,
    streak_days: rawUser.streak_days ?? 0,
    last_active_date: rawUser.last_active_date ?? null,
    website_url: rawUser.website_url ?? null,
    youtube_url: rawUser.youtube_url ?? null,
    instagram_url: rawUser.instagram_url ?? null,
    classroom: rawUser.classroom ?? null,
    school_name: rawUser.school_name ?? null,
    district: rawUser.district ?? null,
    grade_level: rawUser.grade_level ?? null,
  };

  const trial = calculateTrialEligibility(user.created_at);

  // Parallel resilient queries
  const [
    subRes,
    grantsRes,
    transfersRes,
    violationsRes,
    reportsRes,
    messagesRes,
    notesRes,
    postsRes,
    gameLimitsRes,
    gameProgressRes,
    quizAttemptsRes,
    consentRes,
    lessonReqsRes,
    interestsRes,
    childrenRes,
  ] = await Promise.allSettled([
    // Subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Admin billing grants
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("admin_billing_grants")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Bank transfer requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("bank_transfer_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Moderation violations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("moderation_violations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Content reports against this author
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("content_reports")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Admin messages sent to user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("admin_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),

    // User admin notes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("user_admin_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),

    // Social posts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("social_posts")
      .select("id, content, media_url, media_type, likes_count, comments_count, is_hidden, created_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),

    // Game limits for today
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("game_time_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("day", new Date().toISOString().split("T")[0])
      .maybeSingle(),

    // Game progress (high scores)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("game_progress")
      .select("*")
      .eq("user_id", userId)
      .order("high_score", { ascending: false }),

    // Quiz attempts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("quiz_attempts")
      .select("id, score, total_questions, created_at, quiz:quizzes(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Parental consent (if student)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("parental_consents")
      .select("*")
      .eq("student_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Lesson requests (if teacher or parent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("lesson_requests")
      .select("id, topic, status, hourly_rate_krs, created_at, student:users!lesson_requests_student_id_fkey(full_name)")
      .or(`teacher_id.eq.${userId},student_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(10),

    // Teacher interests / expertise areas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("user_interests")
      .select("education_areas(area_name)")
      .eq("user_id", userId),

    // Child profiles (if parent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("child_profiles")
      .select("id, display_name, age_group, total_points, created_at")
      .eq("parent_id", userId),
  ]);

  // Parse results safely
  const subData = subRes.status === "fulfilled" ? subRes.value.data : null;
  const subscription: User360Subscription = {
    plan_slug: subData?.plan_slug ?? (user.is_premium ? "zigo_plus" : "free"),
    status: subData?.status ?? (user.is_premium ? "active" : "inactive"),
    current_period_end: subData?.current_period_end ?? null,
    trial_end: subData?.trial_end ?? null,
    is_active: user.is_premium || subData?.status === "active",
  };

  const billingGrants: User360BillingGrant[] =
    grantsRes.status === "fulfilled" && grantsRes.value.data
      ? grantsRes.value.data.map((g: Record<string, unknown>) => ({
          id: String(g.id),
          kind: String(g.kind || "plus"),
          duration_days: Number(g.duration_days || 30),
          note: g.note ? String(g.note) : null,
          period_ends_at: g.period_ends_at ? String(g.period_ends_at) : null,
          created_at: String(g.created_at),
        }))
      : [];

  const bankTransfers: User360BankTransfer[] =
    transfersRes.status === "fulfilled" && transfersRes.value.data
      ? transfersRes.value.data.map((t: Record<string, unknown>) => ({
          id: String(t.id),
          plan_slug: String(t.plan_slug || "zigo_plus_yearly"),
          amount_krs: Number(t.amount_krs || 0),
          status: String(t.status || "pending"),
          receipt_url: t.receipt_url ? String(t.receipt_url) : null,
          created_at: String(t.created_at),
          admin_note: t.admin_note ? String(t.admin_note) : null,
        }))
      : [];

  const violations: User360Violation[] =
    violationsRes.status === "fulfilled" && violationsRes.value.data
      ? violationsRes.value.data.map((v: Record<string, unknown>) => ({
          id: String(v.id),
          violation_type: String(v.violation_type || "policy_violation"),
          severity: String(v.severity || "warning"),
          notes: v.notes ? String(v.notes) : null,
          created_at: String(v.created_at),
        }))
      : [];

  const reports: User360Report[] =
    reportsRes.status === "fulfilled" && reportsRes.value.data
      ? reportsRes.value.data.map((r: Record<string, unknown>) => ({
          id: String(r.id),
          reason: String(r.reason || "Uygunsuz içerik"),
          details: r.details ? String(r.details) : null,
          status: String(r.status || "open"),
          created_at: String(r.created_at),
        }))
      : [];

  const adminMessages: User360AdminMessage[] =
    messagesRes.status === "fulfilled" && messagesRes.value.data
      ? messagesRes.value.data.map((m: Record<string, unknown>) => ({
          id: String(m.id),
          title: String(m.title || "Bildirim"),
          body: String(m.body || ""),
          is_read: Boolean(m.is_read),
          created_at: String(m.created_at),
        }))
      : [];

  const adminNotes: User360AdminNote[] =
    notesRes.status === "fulfilled" && notesRes.value.data
      ? notesRes.value.data.map((n: Record<string, unknown>) => ({
          id: String(n.id),
          admin_id: String(n.admin_id),
          note: String(n.note || ""),
          tags: Array.isArray(n.tags) ? n.tags.map(String) : [],
          created_at: String(n.created_at),
        }))
      : [];

  const posts: User360Post[] =
    postsRes.status === "fulfilled" && postsRes.value.data
      ? postsRes.value.data.map((p: Record<string, unknown>) => ({
          id: String(p.id),
          content: p.content ? String(p.content) : null,
          media_url: p.media_url ? String(p.media_url) : null,
          media_type: p.media_type ? String(p.media_type) : null,
          likes_count: Number(p.likes_count || 0),
          comments_count: Number(p.comments_count || 0),
          is_hidden: Boolean(p.is_hidden),
          created_at: String(p.created_at),
        }))
      : [];

  // Game stats
  const gameLimitRow = gameLimitsRes.status === "fulfilled" ? gameLimitsRes.value.data : null;
  const gameMinutesToday = gameLimitRow?.used_seconds
    ? Math.round(Number(gameLimitRow.used_seconds) / 60)
    : 0;
  const gameLimitMinutes = 120; // Strict AGENTS.md rule: 120 minutes daily max

  const gameScores: User360GameScore[] =
    gameProgressRes.status === "fulfilled" && gameProgressRes.value.data
      ? gameProgressRes.value.data.map((g: Record<string, unknown>) => ({
          game_type: String(g.game_type || "2048"),
          high_score: Number(g.high_score || 0),
          level: Number(g.current_level || 1),
          stars: Number(g.stars || 0),
          updated_at: String(g.updated_at || g.created_at || new Date().toISOString()),
        }))
      : [];

  const quizAttempts: User360QuizAttempt[] =
    quizAttemptsRes.status === "fulfilled" && quizAttemptsRes.value.data
      ? quizAttemptsRes.value.data.map((q: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const quizObj = q.quiz as any;
          return {
            id: String(q.id),
            quiz_title: quizObj?.title ? String(quizObj.title) : "Zigo Deneme Sınavı",
            score: Number(q.score || 0),
            total_questions: Number(q.total_questions || 10),
            created_at: String(q.created_at),
          };
        })
      : [];

  const consentData = consentRes.status === "fulfilled" ? consentRes.value.data : null;
  const parentConsent: User360ParentConsent | null = consentData
    ? {
        id: String(consentData.id),
        parent_email: String(consentData.parent_email),
        status: String(consentData.status || "pending"),
        requested_at: String(consentData.requested_at),
        decided_at: consentData.decided_at ? String(consentData.decided_at) : null,
      }
    : null;

  const lessonRequests: User360LessonRequest[] =
    lessonReqsRes.status === "fulfilled" && lessonReqsRes.value.data
      ? lessonReqsRes.value.data.map((l: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const studentObj = l.student as any;
          return {
            id: String(l.id),
            student_name: studentObj?.full_name ? String(studentObj.full_name) : "Öğrenci",
            topic: String(l.topic || "Özel Ders"),
            status: String(l.status || "pending"),
            hourly_rate_krs: l.hourly_rate_krs ? Number(l.hourly_rate_krs) : null,
            created_at: String(l.created_at),
          };
        })
      : [];

  const teacherAreas: string[] =
    interestsRes.status === "fulfilled" && interestsRes.value.data
      ? interestsRes.value.data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((i: any) => i.education_areas?.area_name)
          .filter(Boolean)
      : [];

  const children: User360Child[] =
    childrenRes.status === "fulfilled" && childrenRes.value.data
      ? childrenRes.value.data.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          display_name: String(c.display_name || "Öğrenci"),
          age_group: c.age_group ? String(c.age_group) : null,
          total_points: Number(c.total_points || 0),
          created_at: String(c.created_at),
        }))
      : [];

  return {
    user,
    subscription,
    trial,
    billingGrants,
    bankTransfers,
    violations,
    reports,
    adminMessages,
    adminNotes,
    posts,
    roleSpecific: {
      gameMinutesToday,
      gameLimitMinutes,
      isCurfewActive: isGameCurfewActive(),
      gameScores,
      quizAttempts,
      parentConsent,
      lessonRequests,
      teacherAreas,
      children,
    },
  };
}
