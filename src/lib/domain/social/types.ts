import type {
  ContentReportRow,
  EducationAreaRow,
  SocialPostRow,
  UserRow,
} from "@/lib/supabase/database.types";

export type SocialFeedPost = Omit<SocialPostRow, "premium_prep_url" | "sponsored_target_url"> & {
  author: Pick<UserRow, "id" | "full_name" | "role" | "is_verified"> | null;
  area: Pick<EducationAreaRow, "area_name"> | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  ranking_score: number;
  is_liked: boolean;
  is_saved: boolean;
  has_premium_prep: boolean;
  has_sponsored: boolean;
  is_sponsored_active: boolean;
  can_open_premium_prep: boolean;
  can_open_sponsored: boolean;
};

export type ActiveStory = {
  id: string;
  area_id: number | null;
  media_url: string | null;
  caption: string | null;
  created_at: string;
  author: Pick<UserRow, "id" | "full_name" | "role" | "is_verified"> | null;
};

export type SocialNotification = {
  id: string;
  kind: string;
  message: string;
  post_id: string | null;
  lesson_request_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: Pick<UserRow, "id" | "full_name" | "role" | "is_verified"> | null;
};

export type SocialComment = {
  id: string;
  content: string;
  moderation_status: string;
  created_at: string;
  author: Pick<UserRow, "id" | "full_name" | "role" | "is_verified"> | null;
};

export type ProfileSocialStats = {
  posts: number;
  followers: number;
  following: number;
};

export type CreatorSearchResult = Pick<UserRow, "id" | "full_name" | "role" | "is_verified">;

export type SuggestedCreator = {
  id: string;
  full_name: string;
  area_name: string;
  is_following: boolean;
};

export type UserContentReport = ContentReportRow & {
  post: Pick<SocialPostRow, "id" | "caption" | "media_type"> | null;
};

export type SafetyQueueItem = {
  id: string;
  kind: "comment" | "story_reply";
  content: string;
  moderation_status: string;
  created_at: string;
};

export type CreatorSafetyQueueItem = SafetyQueueItem & {
  sourceTitle: string;
};

export type LearningAwardResult = {
  event_id: string | null;
  points_awarded: number;
  already_awarded: boolean;
  total_points: number;
};
