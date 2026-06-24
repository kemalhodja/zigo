export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "teacher" | "parent" | "student";
export type StudentDocumentStatus = "pending" | "approved" | "rejected";
export type StoreProductCategory =
  | "stationery"
  | "book"
  | "question_bank"
  | "digital_avatar"
  | "experience";
export type StoreRedemptionStatus =
  | "pending_parent_approval"
  | "approved"
  | "fulfilled"
  | "cancelled";

export type AvatarAssets = {
  hat: string | null;
  suit: string | null;
  pet: string | null;
  cape?: string | null;
  frame?: string | null;
};

export type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_verified: boolean;
  avatar_assets: AvatarAssets;
  total_points: number;
  bio: string | null;
  avatar_url: string | null;
  level: number;
  student_document_url: string | null;
  student_document_status: StudentDocumentStatus | null;
  student_document_submitted_at: string | null;
  student_document_reviewed_at: string | null;
  student_document_reviewed_by: string | null;
  grade_level: string | null;
  organization_type: string | null;
  social_safety_strike_count: number;
  social_interactions_blocked: boolean;
  social_interactions_blocked_at: string | null;
  created_at: string;
};

export type EducationAreaRow = {
  id: number;
  area_name: string;
  age_group: string | null;
};

export type ChildProfileRow = {
  id: string;
  parent_id: string;
  display_name: string;
  age_group: string | null;
  grade_level: string | null;
  avatar_assets: AvatarAssets;
  total_points: number;
  created_at: string;
};

export type StoreProductRow = {
  id: string;
  name: string;
  description: string;
  category: StoreProductCategory;
  price_points: number;
  image_url: string | null;
  stock_count: number | null;
  requires_parent_approval: boolean;
  is_active: boolean;
  created_at: string;
};

export type StoreRedemptionRow = {
  id: string;
  product_id: string;
  user_id: string | null;
  child_profile_id: string | null;
  points_spent: number;
  status: StoreRedemptionStatus;
  note: string | null;
  created_at: string;
};

export type QuizRow = {
  id: string;
  teacher_id: string;
  area_id: number;
  title: string;
  question_text: string;
  options: Json;
  correct_option: number;
  points_reward: number;
  is_active: boolean;
  created_at: string;
};

export type PublicQuizRow = Omit<QuizRow, "teacher_id" | "correct_option" | "is_active"> & {
  question_count?: number;
};

export type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  question_text: string;
  options: Json;
  correct_option: number;
  sort_order: number;
  created_at: string;
};

export type QuizQuestionForPlay = {
  id: string;
  question_text: string;
  options: Json;
  sort_order: number;
};

export type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  user_id: string | null;
  child_profile_id: string | null;
  selected_option: number | null;
  is_correct: boolean;
  points_awarded: number;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  completed_at: string | null;
  created_at: string;
};

export type VideoCompletionRow = {
  id: string;
  post_id: string | null;
  social_post_id: string | null;
  user_id: string | null;
  child_profile_id: string | null;
  seconds_watched: number;
  points_awarded: number;
  created_at: string;
};

export type SocialMediaType = "image" | "video" | "carousel";
export type ContentPostType = "normal" | "quiz" | "micro";
export type CommentModerationStatus = "pending" | "approved" | "rejected";
export type NotificationKind = "like" | "comment" | "follow" | "save" | "story" | "system";
export type LearningActionType = "reel_watch" | "quiz_complete" | "duel_win" | "focus_session" | "store_visit";

export type SubscriptionTier = "free" | "zigo_plus";
export type ContentReportReason =
  | "safety_review"
  | "misinformation"
  | "bullying"
  | "inappropriate"
  | "other";
export type ContentReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type SocialPostRow = {
  id: string;
  author_id: string;
  area_id: number | null;
  caption: string;
  media_url: string | null;
  media_type: SocialMediaType;
  is_reel: boolean;
  post_type: ContentPostType;
  title: string | null;
  content: string | null;
  quiz_id: string | null;
  legacy_post_id: string | null;
  premium_prep_label: string | null;
  premium_prep_url: string | null;
  sponsored_label: string | null;
  sponsored_target_url: string | null;
  sponsored_status: "active" | "paused" | "expired" | null;
  sponsored_expires_at: string | null;
  sponsored_disclosure: string | null;
  sponsored_click_count: number;
  created_at: string;
};

export type PostCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  moderation_status: CommentModerationStatus;
  created_at: string;
};

export type FollowRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type StoryRow = {
  id: string;
  author_id: string;
  area_id: number | null;
  media_url: string | null;
  caption: string | null;
  expires_at: string;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: NotificationKind;
  post_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type ModerationAuditRow = {
  id: string;
  moderator_id: string;
  item_id: string;
  item_kind: "comment" | "story_reply";
  next_status: "approved" | "rejected";
  note: string | null;
  created_at: string;
};

export type ModerationViolationRow = {
  id: string;
  user_id: string;
  reason: "profanity" | "obscenity" | "bullying";
  content_kind: string;
  content_preview: string;
  matched_term: string | null;
  action_taken: "warned" | "restricted";
  created_at: string;
};

export type ModerationAdminAlertRow = {
  id: string;
  user_id: string;
  violation_id: string;
  reason: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  details: string;
  created_at: string;
};

export type StoryReplyRow = {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  moderation_status: CommentModerationStatus;
  created_at: string;
};

export type LearningEventRow = {
  id: string;
  user_id: string;
  action_type: LearningActionType;
  target_id: string;
  points_awarded: number;
  created_at: string;
};

export type ContentReportRow = {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: ContentReportReason;
  status: ContentReportStatus;
  details: string | null;
  created_at: string;
};

export type AwardLearningPointsResult = {
  event_id: string | null;
  points_awarded: number;
  already_awarded: boolean;
  total_points: number;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          is_verified?: boolean;
          avatar_assets?: AvatarAssets;
          total_points?: number;
          bio?: string | null;
          avatar_url?: string | null;
          level?: number;
          student_document_url?: string | null;
          student_document_status?: StudentDocumentStatus | null;
          student_document_submitted_at?: string | null;
          student_document_reviewed_at?: string | null;
          student_document_reviewed_by?: string | null;
          organization_type?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: UserRole;
          is_verified?: boolean;
          avatar_assets?: AvatarAssets;
          total_points?: number;
          bio?: string | null;
          avatar_url?: string | null;
          level?: number;
          student_document_url?: string | null;
          student_document_status?: StudentDocumentStatus | null;
          student_document_submitted_at?: string | null;
          student_document_reviewed_at?: string | null;
          student_document_reviewed_by?: string | null;
          organization_type?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      education_areas: {
        Row: {
          id: number;
          area_name: string;
          age_group: string | null;
        };
        Insert: {
          id?: number;
          area_name: string;
          age_group?: string | null;
        };
        Update: {
          area_name?: string;
          age_group?: string | null;
        };
        Relationships: [];
      };
      user_interests: {
        Row: {
          user_id: string;
          area_id: number;
        };
        Insert: {
          user_id: string;
          area_id: number;
        };
        Update: {
          user_id?: string;
          area_id?: number;
        };
        Relationships: [];
      };
      child_profiles: {
        Row: ChildProfileRow;
        Insert: {
          id?: string;
          parent_id: string;
          display_name: string;
          age_group?: string | null;
          avatar_assets?: AvatarAssets;
          total_points?: number;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          age_group?: string | null;
          avatar_assets?: AvatarAssets;
          total_points?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "child_profiles_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      child_profile_interests: {
        Row: {
          child_profile_id: string;
          area_id: number;
        };
        Insert: {
          child_profile_id: string;
          area_id: number;
        };
        Update: {
          child_profile_id?: string;
          area_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "child_profile_interests_child_profile_id_fkey";
            columns: ["child_profile_id"];
            isOneToOne: false;
            referencedRelation: "child_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "child_profile_interests_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "education_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      store_products: {
        Row: StoreProductRow;
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: StoreProductCategory;
          price_points: number;
          image_url?: string | null;
          stock_count?: number | null;
          requires_parent_approval?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          category?: StoreProductCategory;
          price_points?: number;
          image_url?: string | null;
          stock_count?: number | null;
          requires_parent_approval?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      store_redemptions: {
        Row: StoreRedemptionRow;
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          child_profile_id?: string | null;
          points_spent: number;
          status?: StoreRedemptionStatus;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          status?: StoreRedemptionStatus;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_redemptions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "store_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_redemptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_redemptions_child_profile_id_fkey";
            columns: ["child_profile_id"];
            isOneToOne: false;
            referencedRelation: "child_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      quizzes: {
        Row: QuizRow;
        Insert: {
          id?: string;
          teacher_id: string;
          area_id: number;
          title: string;
          question_text: string;
          options: Json;
          correct_option: number;
          points_reward?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          area_id?: number;
          title?: string;
          question_text?: string;
          options?: Json;
          correct_option?: number;
          points_reward?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quizzes_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "education_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_attempts: {
        Row: QuizAttemptRow;
        Insert: {
          id?: string;
          quiz_id: string;
          user_id?: string | null;
          child_profile_id?: string | null;
          selected_option?: number | null;
          is_correct: boolean;
          points_awarded?: number;
          total_questions?: number;
          correct_answers?: number;
          score_percent?: number;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          selected_option?: number | null;
          is_correct?: boolean;
          points_awarded?: number;
          total_questions?: number;
          correct_answers?: number;
          score_percent?: number;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_child_profile_id_fkey";
            columns: ["child_profile_id"];
            isOneToOne: false;
            referencedRelation: "child_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: QuizQuestionRow;
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          options: Json;
          correct_option: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          question_text?: string;
          options?: Json;
          correct_option?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      video_completions: {
        Row: VideoCompletionRow;
        Insert: {
          id?: string;
          post_id?: string | null;
          social_post_id?: string | null;
          user_id?: string | null;
          child_profile_id?: string | null;
          seconds_watched: number;
          points_awarded?: number;
          created_at?: string;
        };
        Update: {
          seconds_watched?: number;
          points_awarded?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "video_completions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "video_completions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "video_completions_child_profile_id_fkey";
            columns: ["child_profile_id"];
            isOneToOne: false;
            referencedRelation: "child_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      social_posts: {
        Row: SocialPostRow;
        Insert: {
          id?: string;
          author_id: string;
          area_id?: number | null;
          caption: string;
          media_url?: string | null;
          media_type?: SocialMediaType;
          is_reel?: boolean;
          post_type?: ContentPostType;
          title?: string | null;
          content?: string | null;
          quiz_id?: string | null;
          legacy_post_id?: string | null;
          premium_prep_label?: string | null;
          premium_prep_url?: string | null;
          sponsored_label?: string | null;
          sponsored_target_url?: string | null;
          sponsored_status?: "active" | "paused" | "expired" | null;
          sponsored_expires_at?: string | null;
          sponsored_disclosure?: string | null;
          sponsored_click_count?: number;
          created_at?: string;
        };
        Update: {
          area_id?: number | null;
          caption?: string;
          media_url?: string | null;
          media_type?: SocialMediaType;
          is_reel?: boolean;
          post_type?: ContentPostType;
          title?: string | null;
          content?: string | null;
          quiz_id?: string | null;
          legacy_post_id?: string | null;
          premium_prep_label?: string | null;
          premium_prep_url?: string | null;
          sponsored_label?: string | null;
          sponsored_target_url?: string | null;
          sponsored_status?: "active" | "paused" | "expired" | null;
          sponsored_expires_at?: string | null;
          sponsored_disclosure?: string | null;
          sponsored_click_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_posts_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "education_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_posts: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      post_comments: {
        Row: PostCommentRow;
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          moderation_status?: CommentModerationStatus;
          created_at?: string;
        };
        Update: {
          content?: string;
          moderation_status?: CommentModerationStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: FollowRow;
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      stories: {
        Row: StoryRow;
        Insert: {
          id?: string;
          author_id: string;
          area_id?: number | null;
          media_url?: string | null;
          caption?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          area_id?: number | null;
          media_url?: string | null;
          caption?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stories_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "education_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: NotificationRow;
        Insert: {
          id?: string;
          user_id: string;
          actor_id?: string | null;
          kind: NotificationKind;
          post_id?: string | null;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_audit_log: {
        Row: ModerationAuditRow;
        Insert: {
          id?: string;
          moderator_id: string;
          item_id: string;
          item_kind: "comment" | "story_reply";
          next_status: "approved" | "rejected";
          note?: string | null;
          created_at?: string;
        };
        Update: {
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_audit_log_moderator_id_fkey";
            columns: ["moderator_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_violations: {
        Row: ModerationViolationRow;
        Insert: {
          id?: string;
          user_id: string;
          reason: "profanity" | "obscenity" | "bullying";
          content_kind: string;
          content_preview: string;
          matched_term?: string | null;
          action_taken: "warned" | "restricted";
          created_at?: string;
        };
        Update: {
          action_taken?: "warned" | "restricted";
        };
        Relationships: [
          {
            foreignKeyName: "moderation_violations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_admin_alerts: {
        Row: ModerationAdminAlertRow;
        Insert: {
          id?: string;
          user_id: string;
          violation_id: string;
          reason: string;
          status?: "open" | "reviewing" | "resolved" | "dismissed";
          details: string;
          created_at?: string;
        };
        Update: {
          status?: "open" | "reviewing" | "resolved" | "dismissed";
        };
        Relationships: [
          {
            foreignKeyName: "moderation_admin_alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_admin_alerts_violation_id_fkey";
            columns: ["violation_id"];
            isOneToOne: false;
            referencedRelation: "moderation_violations";
            referencedColumns: ["id"];
          },
        ];
      };
      story_replies: {
        Row: StoryReplyRow;
        Insert: {
          id?: string;
          story_id: string;
          user_id: string;
          content: string;
          moderation_status?: CommentModerationStatus;
          created_at?: string;
        };
        Update: {
          content?: string;
          moderation_status?: CommentModerationStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_replies_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_replies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_events: {
        Row: LearningEventRow;
        Insert: {
          id?: string;
          user_id: string;
          action_type: LearningActionType;
          target_id: string;
          points_awarded: number;
          created_at?: string;
        };
        Update: {
          action_type?: LearningActionType;
          target_id?: string;
          points_awarded?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_subscriptions: {
        Row: {
          user_id: string;
          tier: SubscriptionTier;
          updated_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
        };
        Insert: {
          user_id: string;
          tier?: SubscriptionTier;
          updated_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          tier?: SubscriptionTier;
          updated_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          area_id: number | null;
          topic_label: string;
          target_seconds: number;
          started_at: string;
          completed_at: string | null;
          status: "in_progress" | "completed" | "cancelled";
          points_awarded: number;
          child_profile_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          area_id?: number | null;
          topic_label: string;
          target_seconds?: number;
          started_at?: string;
          completed_at?: string | null;
          status?: "in_progress" | "completed" | "cancelled";
          points_awarded?: number;
          child_profile_id?: string | null;
        };
        Update: {
          area_id?: number | null;
          topic_label?: string;
          target_seconds?: number;
          started_at?: string;
          completed_at?: string | null;
          status?: "in_progress" | "completed" | "cancelled";
          points_awarded?: number;
          child_profile_id?: string | null;
        };
        Relationships: [];
      };
      study_plans: {
        Row: {
          id: string;
          user_id: string;
          area_id: number | null;
          weekly_pomodoro_goal: number;
          primary_topic: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          area_id?: number | null;
          weekly_pomodoro_goal?: number;
          primary_topic?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          area_id?: number | null;
          weekly_pomodoro_goal?: number;
          primary_topic?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      study_moments: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          area_id: number;
          topic_label: string;
          duration_minutes: number;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          area_id: number;
          topic_label: string;
          duration_minutes?: number;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          topic_label?: string;
          duration_minutes?: number;
          caption?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      study_moment_cheers: {
        Row: {
          moment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          moment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [];
      };
      account_deletion_requests: {
        Row: {
          id: string;
          user_id: string;
          reason: string | null;
          status: "pending" | "processing" | "completed" | "cancelled";
          requested_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reason?: string | null;
          status?: "pending" | "processing" | "completed" | "cancelled";
          requested_at?: string;
        };
        Update: {
          reason?: string | null;
          status?: "pending" | "processing" | "completed" | "cancelled";
          requested_at?: string;
        };
        Relationships: [];
      };
      content_reports: {
        Row: ContentReportRow;
        Insert: {
          id?: string;
          post_id: string;
          reporter_id: string;
          reason?: ContentReportReason;
          status?: ContentReportStatus;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          reason?: ContentReportReason;
          status?: ContentReportStatus;
          details?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_reports_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          id: string;
          teacher_id: string;
          title: string | null;
          content: string | null;
          media_url: string | null;
          area_id: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          title?: string | null;
          content?: string | null;
          media_url?: string | null;
          area_id: number;
          created_at?: string;
        };
        Update: {
          title?: string | null;
          content?: string | null;
          media_url?: string | null;
          area_id?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "education_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          author_id: string;
          area_id: number;
          title: string;
          description: string;
          is_resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          area_id: number;
          title: string;
          description: string;
          is_resolved?: boolean;
          created_at?: string;
        };
        Update: {
          area_id?: number;
          title?: string;
          description?: string;
          is_resolved?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "education_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          teacher_id: string;
          content: string;
          is_approved_by_parent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          teacher_id: string;
          content: string;
          is_approved_by_parent?: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          is_approved_by_parent?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      approve_answer: {
        Args: { answer_id: string };
        Returns: void;
      };
      award_learning_points: {
        Args: {
          student_id: string;
          action_kind: "micro_video_watched" | "mini_quiz_completed" | "duel_won";
        };
        Returns: {
          id: string;
          total_points: number;
        }[];
      };
      update_avatar_assets: {
        Args: {
          student_id: string;
          assets: Partial<AvatarAssets>;
        };
        Returns: {
          id: string;
          avatar_assets: AvatarAssets;
        }[];
      };
      create_profile: {
        Args: {
          full_name: string;
          profile_role: UserRole;
        };
        Returns: UserRow;
      };
      set_user_interests: {
        Args: {
          area_ids: number[];
        };
        Returns: void;
      };
      create_child_profile: {
        Args: {
          display_name: string;
          age_group: string;
        };
        Returns: ChildProfileRow;
      };
      set_child_profile_interests: {
        Args: {
          target_child_profile_id: string;
          area_ids: number[];
        };
        Returns: void;
      };
      award_child_learning_points: {
        Args: {
          target_child_profile_id: string;
          action_kind: "micro_video_watched" | "mini_quiz_completed" | "duel_won";
        };
        Returns: {
          id: string;
          total_points: number;
        }[];
      };
      update_child_avatar_assets: {
        Args: {
          target_child_profile_id: string;
          assets: Partial<AvatarAssets>;
        };
        Returns: {
          id: string;
          avatar_assets: AvatarAssets;
        }[];
      };
      redeem_store_product: {
        Args: {
          target_product_id: string;
          redemption_note?: string | null;
        };
        Returns: StoreRedemptionRow;
      };
      redeem_child_store_product: {
        Args: {
          target_child_profile_id: string;
          target_product_id: string;
          redemption_note?: string | null;
        };
        Returns: StoreRedemptionRow;
      };
      current_user_is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_user_social_interactions_blocked: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      record_moderation_violation: {
        Args: {
          p_reason: string;
          p_content_kind: string;
          p_content_preview: string;
          p_matched_term?: string | null;
        };
        Returns: Json;
      };
      verify_teacher: {
        Args: {
          target_teacher_id: string;
          verified: boolean;
        };
        Returns: UserRow;
      };
      update_user_profile: {
        Args: {
          next_bio?: string | null;
          next_avatar_url?: string | null;
        };
        Returns: UserRow;
      };
      submit_student_document: {
        Args: {
          document_url: string;
        };
        Returns: UserRow;
      };
      review_student_document: {
        Args: {
          target_student_id: string;
          next_status: StudentDocumentStatus;
        };
        Returns: UserRow;
      };
      current_user_student_document_approved: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_user_email_confirmed: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      sync_quiz_feed_post: {
        Args: {
          target_quiz_id: string;
        };
        Returns: SocialPostRow;
      };
      parent_update_store_redemption_status: {
        Args: {
          target_redemption_id: string;
          next_status: StoreRedemptionStatus;
        };
        Returns: StoreRedemptionRow;
      };
      update_store_redemption_status: {
        Args: {
          target_redemption_id: string;
          next_status: StoreRedemptionStatus;
        };
        Returns: StoreRedemptionRow;
      };
      update_store_product_stock: {
        Args: {
          target_product_id: string;
          next_stock_count: number;
        };
        Returns: StoreProductRow;
      };
      admin_set_teacher_areas: {
        Args: {
          target_teacher_id: string;
          area_ids: number[];
        };
        Returns: void;
      };
      get_matched_quizzes: {
        Args: Record<string, never>;
        Returns: PublicQuizRow[];
      };
      get_child_matched_quizzes: {
        Args: {
          target_child_profile_id: string;
        };
        Returns: PublicQuizRow[];
      };
      submit_quiz_attempt: {
        Args: {
          target_quiz_id: string;
          selected_option: number;
        };
        Returns: QuizAttemptRow;
      };
      submit_child_quiz_attempt: {
        Args: {
          target_child_profile_id: string;
          target_quiz_id: string;
          selected_option: number;
        };
        Returns: QuizAttemptRow;
      };
      submit_quiz_attempt_full: {
        Args: {
          target_quiz_id: string;
          answer_payload: Json;
        };
        Returns: QuizAttemptRow;
      };
      submit_child_quiz_attempt_full: {
        Args: {
          target_child_profile_id: string;
          target_quiz_id: string;
          answer_payload: Json;
        };
        Returns: QuizAttemptRow;
      };
      get_quiz_questions_for_play: {
        Args: {
          target_quiz_id: string;
        };
        Returns: QuizQuestionForPlay[];
      };
      get_parent_child_quiz_activity: {
        Args: {
          target_child_profile_id: string;
          result_limit?: number;
        };
        Returns: {
          attempt_id: string;
          quiz_id: string;
          quiz_title: string;
          total_questions: number;
          correct_answers: number;
          score_percent: number;
          points_awarded: number;
          completed_at: string;
        }[];
      };
      get_parent_child_activity: {
        Args: {
          target_child_profile_id: string;
          result_limit?: number;
        };
        Returns: {
          activity_id: string;
          activity_type: string;
          title: string;
          points_awarded: number;
          metadata: Record<string, unknown>;
          created_at: string;
        }[];
      };
      sync_quiz_questions_for_quiz: {
        Args: {
          target_quiz_id: string;
        };
        Returns: void;
      };
      complete_video_post: {
        Args: {
          target_post_id: string;
          seconds_watched?: number;
        };
        Returns: VideoCompletionRow;
      };
      complete_child_video_post: {
        Args: {
          target_child_profile_id: string;
          target_post_id: string;
          seconds_watched?: number;
        };
        Returns: VideoCompletionRow;
      };
      award_social_reel_watch_points: {
        Args: {
          p_target_user_id: string;
          p_target_id: string;
          p_points: number;
        };
        Returns: AwardLearningPointsResult[];
      };
      award_safe_duel_win_points: {
        Args: {
          p_target_user_id: string;
          p_duel_id: string;
          p_score: number;
          p_total_questions?: number;
          p_area_id?: number;
        };
        Returns: AwardLearningPointsResult[];
      };
      start_focus_session: {
        Args: {
          p_area_id?: number;
          p_topic_label?: string;
          p_target_seconds?: number;
          p_child_profile_id?: string;
        };
        Returns: Database["public"]["Tables"]["focus_sessions"]["Row"];
      };
      complete_focus_session: {
        Args: {
          p_session_id: string;
        };
        Returns: (AwardLearningPointsResult & { session_id: string })[];
      };
      share_study_moment: {
        Args: {
          p_session_id: string;
          p_caption?: string;
        };
        Returns: Database["public"]["Tables"]["study_moments"]["Row"];
      };
      get_matched_study_moments: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          user_id: string;
          full_name: string;
          area_id: number;
          area_name: string;
          topic_label: string;
          duration_minutes: number;
          caption: string | null;
          created_at: string;
          cheer_count: number;
        }[];
      };
      get_active_focus_session: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["focus_sessions"]["Row"];
      };
      get_student_focus_analytics: {
        Args: Record<string, never>;
        Returns: {
          completed_sessions: number;
          focus_minutes_week: number;
          shared_moments: number;
          weekly_goal: number;
          weekly_completed: number;
          points_from_focus: number;
          active_session_id: string | null;
          active_session_started_at: string | null;
          active_session_target_seconds: number | null;
          active_session_topic: string | null;
        }[];
      };
      upsert_study_plan: {
        Args: {
          p_area_id?: number;
          p_weekly_pomodoro_goal?: number;
          p_primary_topic?: string;
        };
        Returns: Database["public"]["Tables"]["study_plans"]["Row"];
      };
      get_parent_focus_overview: {
        Args: Record<string, never>;
        Returns: {
          matched_study_moments: number;
          focus_minutes_in_areas: number;
          latest_topic: string | null;
          latest_student_name: string | null;
          latest_created_at: string | null;
        }[];
      };
      get_parent_children_focus_stats: {
        Args: Record<string, never>;
        Returns: {
          child_profile_id: string;
          display_name: string;
          completed_sessions: number;
          focus_minutes_week: number;
          total_points: number;
        }[];
      };
      record_store_visit_mission: {
        Args: Record<string, never>;
        Returns: {
          recorded: boolean;
          already_recorded: boolean;
        }[];
      };
      cheer_study_moment: {
        Args: {
          p_moment_id: string;
        };
        Returns: {
          cheer_count: number;
        }[];
      };
      set_user_subscription_tier: {
        Args: {
          p_user_id: string;
          p_tier: SubscriptionTier;
          p_stripe_customer_id?: string | null;
          p_stripe_subscription_id?: string | null;
          p_current_period_end?: string | null;
        };
        Returns: Database["public"]["Tables"]["user_subscriptions"]["Row"];
      };
      request_account_deletion: {
        Args: {
          p_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["account_deletion_requests"]["Row"];
      };
      export_user_data: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_premium_prep_url: {
        Args: {
          target_post_id: string;
        };
        Returns: string;
      };
      update_user_grade_level: {
        Args: {
          next_grade_level: string;
        };
        Returns: UserRow;
      };
      update_child_grade_level: {
        Args: {
          target_child_profile_id: string;
          next_grade_level: string;
        };
        Returns: ChildProfileRow;
      };
      current_user_has_active_zigo_plus: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      set_user_organization_type: {
        Args: {
          target_type: string | null;
        };
        Returns: UserRow;
      };
      get_sponsored_ad_url: {
        Args: {
          target_post_id: string;
        };
        Returns: string;
      };
      list_teacher_sponsored_ads: {
        Args: {
          limit_count?: number;
        };
        Returns: {
          post_id: string;
          caption: string;
          sponsored_label: string | null;
          sponsored_status: string | null;
          sponsored_expires_at: string | null;
          sponsored_click_count: number;
          created_at: string;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      store_product_category: StoreProductCategory;
      store_redemption_status: StoreRedemptionStatus;
      subscription_tier: SubscriptionTier;
    };
    CompositeTypes: Record<string, never>;
  };
};
