import type { SupabaseClient } from "@supabase/supabase-js";

import { contentReportStatusSchema, moderationActionSchema } from "@/lib/domain/social/schemas";
import type {
  ActiveStory,
  CreatorSafetyQueueItem,
  SafetyQueueItem,
} from "@/lib/domain/social/types";
import type {
  ContentReportRow,
  Database,
  ModerationAdminAlertRow,
  PostCommentRow,
  SocialPostRow,
  StoryReplyRow,
  UserRow,
} from "@/lib/supabase/database.types";

export async function getUserSafetyQueue(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SafetyQueueItem[]> {
  const [commentsResult, repliesResult] = await Promise.all([
    supabase
      .from("post_comments")
      .select("id, content, moderation_status, created_at")
      .eq("user_id", userId)
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("story_replies")
      .select("id, content, moderation_status, created_at")
      .eq("user_id", userId)
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (commentsResult.error) throw commentsResult.error;
  if (repliesResult.error) throw repliesResult.error;

  const comments = ((commentsResult.data ?? []) as Pick<
    PostCommentRow,
    "id" | "content" | "moderation_status" | "created_at"
  >[]).map((comment) => ({
    ...comment,
    kind: "comment" as const,
  }));
  const replies = ((repliesResult.data ?? []) as Pick<
    StoryReplyRow,
    "id" | "content" | "moderation_status" | "created_at"
  >[]).map((reply) => ({
    ...reply,
    kind: "story_reply" as const,
  }));

  return [...comments, ...replies].sort(
    (first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
  );
}

export async function getCreatorSafetyQueue(
  supabase: SupabaseClient<Database>,
  creatorId: string,
): Promise<CreatorSafetyQueueItem[]> {
  const [{ data: posts, error: postsError }, { data: stories, error: storiesError }] = await Promise.all([
    supabase.from("social_posts").select("id, caption").eq("author_id", creatorId).limit(100),
    supabase.from("stories").select("id, caption").eq("author_id", creatorId).limit(100),
  ]);

  if (postsError) throw postsError;
  if (storiesError) throw storiesError;

  const postRows = (posts ?? []) as Pick<SocialPostRow, "id" | "caption">[];
  const storyRows = (stories ?? []) as Pick<ActiveStory, "id" | "caption">[];
  const postIds = postRows.map((post) => post.id);
  const storyIds = storyRows.map((story) => story.id);

  const [commentsResult, repliesResult] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from("post_comments")
          .select("id, post_id, content, moderation_status, created_at")
          .in("post_id", postIds)
          .eq("moderation_status", "pending")
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    storyIds.length > 0
      ? supabase
          .from("story_replies")
          .select("id, story_id, content, moderation_status, created_at")
          .in("story_id", storyIds)
          .eq("moderation_status", "pending")
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (commentsResult.error) throw commentsResult.error;
  if (repliesResult.error) throw repliesResult.error;

  const postTitleById = new Map(postRows.map((post) => [post.id, post.caption.slice(0, 48) || "Post"]));
  const storyTitleById = new Map(storyRows.map((story) => [story.id, story.caption?.slice(0, 48) || "Spark"]));
  const comments = (
    (commentsResult.data ?? []) as Array<
      Pick<PostCommentRow, "id" | "post_id" | "content" | "moderation_status" | "created_at">
    >
  ).map((comment) => ({
    id: comment.id,
    kind: "comment" as const,
    content: comment.content,
    moderation_status: comment.moderation_status,
    created_at: comment.created_at,
    sourceTitle: postTitleById.get(comment.post_id) ?? "Post",
  }));
  const replies = (
    (repliesResult.data ?? []) as Array<
      Pick<StoryReplyRow, "id" | "story_id" | "content" | "moderation_status" | "created_at">
    >
  ).map((reply) => ({
    id: reply.id,
    kind: "story_reply" as const,
    content: reply.content,
    moderation_status: reply.moderation_status,
    created_at: reply.created_at,
    sourceTitle: storyTitleById.get(reply.story_id) ?? "Spark",
  }));

  return [...comments, ...replies].sort(
    (first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
  );
}

export async function moderateSafetyQueueItem(
  supabase: SupabaseClient<Database>,
  input: { itemId: string; kind: "comment" | "story_reply"; moderatorId?: string; note?: string; status: "approved" | "rejected" },
) {
  const parsed = moderationActionSchema.parse(input);
  const table = parsed.kind === "comment" ? "post_comments" : "story_replies";
  const { data, error } = await supabase
    .from(table)
    .update({ moderation_status: parsed.status })
    .eq("id", parsed.itemId)
    .select("*")
    .single();

  if (error) throw error;

  if (input.moderatorId) {
    const { error: auditError } = await supabase.from("moderation_audit_log").insert({
      item_id: parsed.itemId,
      item_kind: parsed.kind,
      moderator_id: input.moderatorId,
      next_status: parsed.status,
      note: input.note ?? null,
    });

    if (auditError) throw auditError;
  }

  return data;
}

export async function updateContentReportStatus(
  supabase: SupabaseClient<Database>,
  input: {
    reportId: string;
    status: ContentReportRow["status"];
    moderatorId: string;
    isPlatformAdmin: boolean;
  },
) {
  const parsed = contentReportStatusSchema.parse(input);

  const { data: report, error: readError } = await supabase
    .from("content_reports")
    .select(
      `
      id,
      post_id,
      status,
      post:post_id (
        author_id
      )
    `,
    )
    .eq("id", parsed.reportId)
    .maybeSingle();

  if (readError) throw readError;
  if (!report) {
    throw new Error("Report not found.");
  }

  const postAuthorId =
    report.post && typeof report.post === "object" && "author_id" in report.post
      ? String(report.post.author_id)
      : null;

  if (!input.isPlatformAdmin && postAuthorId !== input.moderatorId) {
    throw new Error("Only post authors or platform admins can update report status.");
  }

  const { data, error } = await supabase
    .from("content_reports")
    .update({ status: parsed.status })
    .eq("id", parsed.reportId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export type ModerationAdminAlert = ModerationAdminAlertRow & {
  user?: Pick<UserRow, "full_name" | "email" | "role"> | null;
};

export async function getModerationAdminAlerts(
  supabase: SupabaseClient<Database>,
  limit = 20,
): Promise<ModerationAdminAlert[]> {
  const { data, error } = await supabase
    .from("moderation_admin_alerts")
    .select(
      `
      *,
      user:user_id (
        full_name,
        email,
        role
      )
    `,
    )
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ModerationAdminAlert[];
}
