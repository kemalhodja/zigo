import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

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

export type User360Feedback = {
  id: string;
  category: "request" | "complaint" | string;
  subject: string;
  content: string;
  status: "open" | "in_progress" | "resolved" | "closed" | string;
  admin_note: string | null;
  created_at: string;
};

export type User360RelatedUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  reason: string;
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
  feedback: User360Feedback[];
  relatedUsers: User360RelatedUser[];
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
  const client: SupabaseClient<Database> = createAdminClient() ?? supabase;

  // 1. Core user query
  const { data: rawUser, error: userError } = await client
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
    teacher_creator_plus: Boolean((rawUser as Record<string, unknown>).teacher_creator_plus),
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

  // Parallel resilient queries – split into two batches to avoid TS deep instantiation
  type AnyResult = { data: unknown; error: unknown };
  type SettledResult = PromiseSettledResult<AnyResult>;

  // Cast client to any to prevent TypeScript from recursing into Supabase's
  // deeply nested generic types (especially on tables with many columns).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;

  const batch1: Promise<SettledResult[]> = Promise.allSettled([
    // 0: Subscription
    c.from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as Promise<AnyResult>,

    // 1: Admin billing grants
    c.from("admin_billing_grants")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<AnyResult>,

    // 2: Bank transfer requests
    c.from("bank_transfer_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<AnyResult>,

    // 3: Moderation violations
    c.from("moderation_violations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<AnyResult>,

    // 4: Content reports
    c.from("content_reports")
      .select("*")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<AnyResult>,

    // 5: Admin messages
    c.from("admin_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<AnyResult>,

    // 6: User admin notes
    c.from("user_admin_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20) as Promise<AnyResult>,

    // 7: User feedback & support tickets
    c.from("user_feedback")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<AnyResult>,

    // 8: Related users (same school)
    rawUser.school_name
      ? (c.from("users")
          .select("id, full_name, email, role, classroom, school_name")
          .eq("school_name", rawUser.school_name)
          .neq("id", userId)
          .limit(5) as Promise<AnyResult>)
      : Promise.resolve({ data: [], error: null } as AnyResult),
  ]);

  const batch2: Promise<SettledResult[]> = Promise.allSettled([
    // 0: Social posts
    c.from("social_posts")
      .select("id, content, media_url, media_type, likes_count, comments_count, is_discoverable, created_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(12) as Promise<AnyResult>,

    // 1: Game limits for today
    c.from("game_time_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("day", new Date().toISOString().split("T")[0])
      .maybeSingle() as Promise<AnyResult>,

    // 2: Game progress (high scores)
    c.from("game_progress")
      .select("*")
      .eq("user_id", userId)
      .order("high_score", { ascending: false }) as Promise<AnyResult>,

    // 3: Quiz attempts
    c.from("quiz_attempts")
      .select("id, correct_answers, total_questions, created_at, quiz:quizzes(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<AnyResult>,

    // 4: Parental consent
    c.from("parental_consents")
      .select("*")
      .eq("student_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as Promise<AnyResult>,

    // 5: Lesson requests
    c.from("lesson_requests")
      .select("id, subject_area, status, hourly_rate_krs, created_at, student:users!lesson_requests_student_id_fkey(full_name)")
      .or(`teacher_id.eq.${userId},student_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<AnyResult>,

    // 6: Teacher interests
    c.from("user_interests")
      .select("education_areas(area_name)")
      .eq("user_id", userId) as Promise<AnyResult>,

    // 7: Child profiles
    c.from("child_profiles")
      .select("id, display_name, age_group, total_points, created_at")
      .eq("parent_id", userId) as Promise<AnyResult>,
  ]);

  const [b1, b2] = await Promise.all([batch1, batch2]);




  const [subRes, grantsRes, transfersRes, violationsRes, reportsRes, messagesRes, notesRes, feedbackRes, relatedUsersRes] = b1;
  const [postsRes, gameLimitsRes, gameProgressRes, quizAttemptsRes, consentRes, lessonReqsRes, interestsRes, childrenRes] = b2;


  const getRows = (r: SettledResult): Record<string, unknown>[] =>
    r.status === "fulfilled" && Array.isArray((r.value as AnyResult).data)
      ? ((r.value as AnyResult).data as Record<string, unknown>[])
      : [];
  const getSingle = (r: SettledResult): Record<string, unknown> | null =>
    r.status === "fulfilled" ? ((r.value as AnyResult).data as Record<string, unknown> | null) : null;

  // Parse results safely
  const subData = getSingle(subRes);
  const subscription: User360Subscription = {
    plan_slug: String(subData?.plan_slug ?? (user.is_premium ? "zigo_plus" : "free")),
    status: String(subData?.status ?? (user.is_premium ? "active" : "inactive")),
    current_period_end: subData?.current_period_end ? String(subData.current_period_end) : null,
    trial_end: subData?.trial_ends_at ? String(subData.trial_ends_at) : null,
    is_active: user.is_premium || String(subData?.status) === "active",
  };

  const billingGrants: User360BillingGrant[] = getRows(grantsRes).map((g) => ({
    id: String(g.id),
    kind: String(g.kind || "plus"),
    duration_days: Number(g.duration_days || 30),
    note: g.note ? String(g.note) : null,
    period_ends_at: g.period_ends_at ? String(g.period_ends_at) : null,
    created_at: String(g.created_at),
  }));

  const bankTransfers: User360BankTransfer[] = getRows(transfersRes).map((t) => ({
    id: String(t.id),
    plan_slug: String(t.plan_slug || "zigo_plus_yearly"),
    amount_krs: Number(t.amount_krs || 0),
    status: String(t.status || "pending"),
    receipt_url: t.receipt_url ? String(t.receipt_url) : null,
    created_at: String(t.created_at),
    admin_note: t.admin_note ? String(t.admin_note) : null,
  }));

  const violations: User360Violation[] = getRows(violationsRes).map((v) => ({
    id: String(v.id),
    violation_type: String(v.violation_type || "policy_violation"),
    severity: String(v.severity || "warning"),
    notes: v.notes ? String(v.notes) : null,
    created_at: String(v.created_at),
  }));

  const reports: User360Report[] = getRows(reportsRes).map((r) => ({
    id: String(r.id),
    reason: String(r.reason || "Uygunsuz içerik"),
    details: r.details ? String(r.details) : null,
    status: String(r.status || "open"),
    created_at: String(r.created_at),
  }));

  const adminMessages: User360AdminMessage[] = getRows(messagesRes).map((m) => ({
    id: String(m.id),
    title: String(m.title || "Bildirim"),
    body: String(m.body || ""),
    is_read: Boolean(m.is_read),
    created_at: String(m.created_at),
  }));

  const adminNotes: User360AdminNote[] = getRows(notesRes).map((n) => ({
    id: String(n.id),
    admin_id: String(n.admin_id),
    note: String(n.note || ""),
    tags: Array.isArray(n.tags) ? n.tags.map(String) : [],
    created_at: String(n.created_at),
  }));

  const feedback: User360Feedback[] = getRows(feedbackRes).map((f) => ({
    id: String(f.id),
    category: String(f.category || "request"),
    subject: String(f.subject || "Destek Talebi"),
    content: String(f.content || ""),
    status: String(f.status || "open"),
    admin_note: f.admin_note ? String(f.admin_note) : null,
    created_at: String(f.created_at),
  }));

  const relatedUsers: User360RelatedUser[] = getRows(relatedUsersRes).map((ru) => ({
    id: String(ru.id),
    full_name: String(ru.full_name || "Kullanıcı"),
    email: String(ru.email || ""),
    role: String(ru.role || "student"),
    reason: ru.classroom
      ? `Aynı Okul & Sınıf (${ru.classroom})`
      : `Aynı Okul (${ru.school_name || "Kayıtlı"})`,
  }));

  const posts: User360Post[] = getRows(postsRes).map((p) => ({
    id: String(p.id),
    content: p.content ? String(p.content) : null,
    media_url: p.media_url ? String(p.media_url) : null,
    media_type: p.media_type ? String(p.media_type) : null,
    likes_count: Number(p.likes_count || 0),
    comments_count: Number(p.comments_count || 0),
    // is_discoverable: false means hidden; map to is_hidden for UI
    is_hidden: p.is_discoverable === false,
    created_at: String(p.created_at),
  }));

  // Game stats
  const gameLimitRow = getSingle(gameLimitsRes);
  const gameMinutesToday = gameLimitRow?.used_seconds
    ? Math.round(Number(gameLimitRow.used_seconds) / 60)
    : 0;
  const gameLimitMinutes = 120; // Strict AGENTS.md rule: 120 minutes daily max

  const gameScores: User360GameScore[] = getRows(gameProgressRes).map((g) => ({
    game_type: String(g.game_type || "2048"),
    high_score: Number(g.high_score || 0),
    level: Number(g.current_level || 1),
    stars: Number(g.stars || 0),
    updated_at: String(g.updated_at || g.created_at || new Date().toISOString()),
  }));

  const quizAttempts: User360QuizAttempt[] = getRows(quizAttemptsRes).map((q) => {
    const quizObj = q.quiz as Record<string, unknown> | null;
    return {
      id: String(q.id),
      quiz_title: quizObj?.title ? String(quizObj.title) : "Zigo Deneme Sınavı",
      score: Number(q.correct_answers ?? q.score ?? 0),
      total_questions: Number(q.total_questions || 10),
      created_at: String(q.created_at),
    };
  });

  const consentData = getSingle(consentRes);
  const parentConsent: User360ParentConsent | null = consentData
    ? {
        id: String(consentData.id),
        parent_email: String(consentData.parent_email),
        status: String(consentData.status || "pending"),
        requested_at: String(consentData.requested_at),
        decided_at: consentData.decided_at ? String(consentData.decided_at) : null,
      }
    : null;

  const lessonRequests: User360LessonRequest[] = getRows(lessonReqsRes).map((l) => {
    const studentObj = l.student as Record<string, unknown> | null;
    return {
      id: String(l.id),
      student_name: studentObj?.full_name ? String(studentObj.full_name) : "Öğrenci",
      topic: String(l.subject_area ?? l.topic ?? "Özel Ders"),
      status: String(l.status || "pending"),
      hourly_rate_krs: l.hourly_rate_krs ? Number(l.hourly_rate_krs) : null,
      created_at: String(l.created_at),
    };
  });

  const teacherAreas: string[] = getRows(interestsRes)
    .map((i) => (i.education_areas as Record<string, unknown> | null)?.area_name)
    .filter((a): a is string => typeof a === "string");

  const children: User360Child[] = getRows(childrenRes).map((c) => ({
    id: String(c.id),
    display_name: String(c.display_name || "Öğrenci"),
    age_group: c.age_group ? String(c.age_group) : null,
    total_points: Number(c.total_points || 0),
    created_at: String(c.created_at),
  }));

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
    feedback,
    relatedUsers,
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
