export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          id: string
          reason: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          reason?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          reason?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      ad_watch_log: {
        Row: {
          ad_type: string
          expires_at: string
          hours_granted: number
          id: string
          user_id: string
          watched_at: string
        }
        Insert: {
          ad_type?: string
          expires_at: string
          hours_granted?: number
          id?: string
          user_id: string
          watched_at?: string
        }
        Update: {
          ad_type?: string
          expires_at?: string
          hours_granted?: number
          id?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_watch_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_watch_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_watch_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_watch_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "ad_watch_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      admin_billing_grants: {
        Row: {
          admin_id: string
          created_at: string
          duration_days: number
          id: string
          kind: string
          note: string | null
          period_ends_at: string | null
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          duration_days: number
          id?: string
          kind: string
          note?: string | null
          period_ends_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          duration_days?: number
          id?: string
          kind?: string
          note?: string | null
          period_ends_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_billing_grants_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_billing_grants_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_billing_grants_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_billing_grants_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "admin_billing_grants_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "admin_billing_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_billing_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_billing_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_billing_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "admin_billing_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "admin_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      ai_mentor_logs: {
        Row: {
          advice_text: string
          context_data: Json | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          advice_text: string
          context_data?: Json | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          advice_text?: string
          context_data?: Json | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_mentor_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_mentor_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_mentor_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_mentor_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "ai_mentor_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      answers: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved_by_parent: boolean
          question_id: string
          teacher_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved_by_parent?: boolean
          question_id: string
          teacher_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved_by_parent?: boolean
          question_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "answers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      bank_transfer_requests: {
        Row: {
          admin_note: string | null
          amount_try: number
          created_at: string
          id: string
          period_end: string | null
          plan_id: string
          receipt_storage_path: string | null
          reference_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["bank_transfer_request_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_try: number
          created_at?: string
          id?: string
          period_end?: string | null
          plan_id: string
          receipt_storage_path?: string | null
          reference_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["bank_transfer_request_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_try?: number
          created_at?: string
          id?: string
          period_end?: string | null
          plan_id?: string
          receipt_storage_path?: string | null
          reference_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["bank_transfer_request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfer_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      blocked_keywords: {
        Row: {
          category: string
          created_at: string
          id: number
          is_active: boolean
          keyword: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: number
          is_active?: boolean
          keyword: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: number
          is_active?: boolean
          keyword?: string
        }
        Relationships: []
      }
      child_activity_events: {
        Row: {
          activity_type: string
          child_profile_id: string
          created_at: string
          id: string
          metadata: Json
          points_awarded: number
          title: string
        }
        Insert: {
          activity_type: string
          child_profile_id: string
          created_at?: string
          id?: string
          metadata?: Json
          points_awarded?: number
          title: string
        }
        Update: {
          activity_type?: string
          child_profile_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          points_awarded?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_activity_events_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      child_profile_interests: {
        Row: {
          area_id: number
          child_profile_id: string
        }
        Insert: {
          area_id: number
          child_profile_id: string
        }
        Update: {
          area_id?: number
          child_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_profile_interests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_profile_interests_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      child_profiles: {
        Row: {
          age_group: string | null
          avatar_assets: Json
          city: string | null
          classroom: string | null
          created_at: string
          display_name: string
          district: string | null
          grade_level: string | null
          id: string
          parent_id: string
          school_name: string | null
          total_points: number
        }
        Insert: {
          age_group?: string | null
          avatar_assets?: Json
          city?: string | null
          classroom?: string | null
          created_at?: string
          display_name: string
          district?: string | null
          grade_level?: string | null
          id?: string
          parent_id: string
          school_name?: string | null
          total_points?: number
        }
        Update: {
          age_group?: string | null
          avatar_assets?: Json
          city?: string | null
          classroom?: string | null
          created_at?: string
          display_name?: string
          district?: string | null
          grade_level?: string | null
          id?: string
          parent_id?: string
          school_name?: string | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "child_profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "child_profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      class_group_members: {
        Row: {
          child_profile_id: string | null
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string | null
        }
        Insert: {
          child_profile_id?: string | null
          group_id: string
          id?: string
          joined_at?: string
          role: string
          user_id?: string | null
        }
        Update: {
          child_profile_id?: string | null
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_group_members_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "class_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      class_groups: {
        Row: {
          city: string
          classroom: string
          created_at: string
          district: string
          grade_level: string
          group_name: string
          id: string
          school_name: string
        }
        Insert: {
          city: string
          classroom?: string
          created_at?: string
          district: string
          grade_level: string
          group_name: string
          id?: string
          school_name: string
        }
        Update: {
          city?: string
          classroom?: string
          created_at?: string
          district?: string
          grade_level?: string
          group_name?: string
          id?: string
          school_name?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          post_id: string
          reason?: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      education_areas: {
        Row: {
          age_group: string | null
          area_name: string
          id: number
        }
        Insert: {
          age_group?: string | null
          area_name: string
          id?: number
        }
        Update: {
          age_group?: string | null
          area_name?: string
          id?: number
        }
        Relationships: []
      }
      education_platform_profile_extras: {
        Row: {
          availability_note: string | null
          availability_status:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          contact_summary: string | null
          content_count: number
          details: Json
          integration_docs_url: string | null
          response_time_minutes: number | null
          soft_skills: string[]
          subscription_model: string
          updated_at: string
          user_base_size: number
          user_id: string
          video_intro_url: string | null
        }
        Insert: {
          availability_note?: string | null
          availability_status?:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type?:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          contact_summary?: string | null
          content_count?: number
          details?: Json
          integration_docs_url?: string | null
          response_time_minutes?: number | null
          soft_skills?: string[]
          subscription_model?: string
          updated_at?: string
          user_base_size?: number
          user_id: string
          video_intro_url?: string | null
        }
        Update: {
          availability_note?: string | null
          availability_status?:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type?:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          contact_summary?: string | null
          content_count?: number
          details?: Json
          integration_docs_url?: string | null
          response_time_minutes?: number | null
          soft_skills?: string[]
          subscription_model?: string
          updated_at?: string
          user_base_size?: number
          user_id?: string
          video_intro_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_platform_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_platform_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_platform_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_platform_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "education_platform_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      family_link_invitations: {
        Row: {
          accepted_at: string | null
          accepted_student_id: string | null
          created_at: string
          expires_at: string
          guardian_id: string
          id: string
          status: string
          student_email: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_student_id?: string | null
          created_at?: string
          expires_at?: string
          guardian_id: string
          id?: string
          status?: string
          student_email: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_student_id?: string | null
          created_at?: string
          expires_at?: string
          guardian_id?: string
          id?: string
          status?: string
          student_email?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_link_invitations_accepted_student_id_fkey"
            columns: ["accepted_student_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_link_invitations_accepted_student_id_fkey"
            columns: ["accepted_student_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_link_invitations_accepted_student_id_fkey"
            columns: ["accepted_student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_link_invitations_accepted_student_id_fkey"
            columns: ["accepted_student_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "family_link_invitations_accepted_student_id_fkey"
            columns: ["accepted_student_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "family_link_invitations_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_link_invitations_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_link_invitations_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_link_invitations_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "family_link_invitations_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      family_student_links: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          relationship: string
          revoked_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          relationship?: string
          revoked_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          relationship?: string
          revoked_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_student_links_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_student_links_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_student_links_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_student_links_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "family_student_links_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "family_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "family_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          area_id: number | null
          child_profile_id: string | null
          completed_at: string | null
          id: string
          points_awarded: number
          started_at: string
          status: string
          target_seconds: number
          topic_label: string
          user_id: string
        }
        Insert: {
          area_id?: number | null
          child_profile_id?: string | null
          completed_at?: string | null
          id?: string
          points_awarded?: number
          started_at?: string
          status?: string
          target_seconds?: number
          topic_label: string
          user_id: string
        }
        Update: {
          area_id?: number | null
          child_profile_id?: string | null
          completed_at?: string | null
          id?: string
          points_awarded?: number
          started_at?: string
          status?: string
          target_seconds?: number
          topic_label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      game_daily_usage: {
        Row: {
          date: string
          id: string
          seconds_played: number
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          seconds_played?: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          seconds_played?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "game_daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      game_progress: {
        Row: {
          game_type: string
          high_score: number
          id: string
          last_level: number
          total_plays: number
          updated_at: string
          user_id: string
        }
        Insert: {
          game_type: string
          high_score?: number
          id?: string
          last_level?: number
          total_plays?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          game_type?: string
          high_score?: number
          id?: string
          last_level?: number
          total_plays?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      google_play_purchases: {
        Row: {
          created_at: string
          expiry_time: string | null
          id: string
          order_id: string | null
          package_name: string
          plan_id: string
          product_id: string
          purchase_token: string
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          expiry_time?: string | null
          id?: string
          order_id?: string | null
          package_name: string
          plan_id: string
          product_id: string
          purchase_token: string
          user_id: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          expiry_time?: string | null
          id?: string
          order_id?: string | null
          package_name?: string
          plan_id?: string
          product_id?: string
          purchase_token?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_play_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_play_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_play_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_play_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "google_play_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      institution_profile_extras: {
        Row: {
          accreditation: string[]
          availability_note: string | null
          availability_status:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          branch_count: number
          capacity: number
          contact_summary: string | null
          details: Json
          license_number: string
          response_time_minutes: number | null
          services: string[]
          soft_skills: string[]
          updated_at: string
          user_id: string
          video_intro_url: string | null
        }
        Insert: {
          accreditation?: string[]
          availability_note?: string | null
          availability_status?:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type?:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          branch_count?: number
          capacity?: number
          contact_summary?: string | null
          details?: Json
          license_number: string
          response_time_minutes?: number | null
          services?: string[]
          soft_skills?: string[]
          updated_at?: string
          user_id: string
          video_intro_url?: string | null
        }
        Update: {
          accreditation?: string[]
          availability_note?: string | null
          availability_status?:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type?:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          branch_count?: number
          capacity?: number
          contact_summary?: string | null
          details?: Json
          license_number?: string
          response_time_minutes?: number | null
          services?: string[]
          soft_skills?: string[]
          updated_at?: string
          user_id?: string
          video_intro_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "institution_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          max_uses: number
          owner_id: string
          role_hint: string | null
          use_count: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number
          owner_id: string
          role_hint?: string | null
          use_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number
          owner_id?: string
          role_hint?: string | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "invite_codes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      invite_redemptions: {
        Row: {
          created_at: string
          id: string
          invite_code_id: string
          redeemer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code_id: string
          redeemer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code_id?: string
          redeemer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_redemptions_redeemer_id_fkey"
            columns: ["redeemer_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_redemptions_redeemer_id_fkey"
            columns: ["redeemer_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_redemptions_redeemer_id_fkey"
            columns: ["redeemer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_redemptions_redeemer_id_fkey"
            columns: ["redeemer_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "invite_redemptions_redeemer_id_fkey"
            columns: ["redeemer_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      learning_events: {
        Row: {
          action_type: string
          created_at: string
          id: string
          points_awarded: number
          target_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          points_awarded: number
          target_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          points_awarded?: number
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "learning_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      lesson_bookings: {
        Row: {
          area_id: number | null
          availability_id: string
          child_profile_id: string | null
          created_at: string
          end_time: string
          id: string
          parent_id: string
          payment_status: Database["public"]["Enums"]["lesson_payment_status"]
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          teacher_id: string
          updated_at: string
        }
        Insert: {
          area_id?: number | null
          availability_id: string
          child_profile_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          parent_id: string
          payment_status?: Database["public"]["Enums"]["lesson_payment_status"]
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          teacher_id: string
          updated_at?: string
        }
        Update: {
          area_id?: number | null
          availability_id?: string
          child_profile_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          parent_id?: string
          payment_status?: Database["public"]["Enums"]["lesson_payment_status"]
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_bookings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_availability_id_fkey"
            columns: ["availability_id"]
            isOneToOne: true
            referencedRelation: "teacher_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "lesson_bookings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "lesson_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "lesson_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      lesson_package_subscriptions: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          lessons_included: number
          lessons_used: number
          plan_type: Database["public"]["Enums"]["lesson_package_plan_type"]
          starts_at: string
          status: Database["public"]["Enums"]["lesson_package_status"]
          stripe_checkout_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          lessons_included: number
          lessons_used?: number
          plan_type: Database["public"]["Enums"]["lesson_package_plan_type"]
          starts_at?: string
          status?: Database["public"]["Enums"]["lesson_package_status"]
          stripe_checkout_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          lessons_included?: number
          lessons_used?: number
          plan_type?: Database["public"]["Enums"]["lesson_package_plan_type"]
          starts_at?: string
          status?: Database["public"]["Enums"]["lesson_package_status"]
          stripe_checkout_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_package_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_package_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_package_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_package_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "lesson_package_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      lesson_reminder_log: {
        Row: {
          booking_id: string
          id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          booking_id: string
          id?: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          booking_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reminder_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "lesson_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_request_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          request_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          request_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "lesson_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "lesson_request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      lesson_requests: {
        Row: {
          area_id: number | null
          child_profile_id: string | null
          created_at: string
          id: string
          message_body: string
          priority: Database["public"]["Enums"]["lesson_request_priority"]
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["lesson_request_status"]
          updated_at: string
        }
        Insert: {
          area_id?: number | null
          child_profile_id?: string | null
          created_at?: string
          id?: string
          message_body: string
          priority?: Database["public"]["Enums"]["lesson_request_priority"]
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["lesson_request_status"]
          updated_at?: string
        }
        Update: {
          area_id?: number | null
          child_profile_id?: string | null
          created_at?: string
          id?: string
          message_body?: string
          priority?: Database["public"]["Enums"]["lesson_request_priority"]
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["lesson_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_requests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "lesson_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "lesson_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "lesson_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      lesson_reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          matched_track_slugs: string[]
          parent_id: string
          rating: number
          teacher_id: string
          topic_tags: string[]
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          matched_track_slugs?: string[]
          parent_id: string
          rating: number
          teacher_id: string
          topic_tags?: string[]
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          matched_track_slugs?: string[]
          parent_id?: string
          rating?: number
          teacher_id?: string
          topic_tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "lesson_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reviews_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reviews_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reviews_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reviews_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "lesson_reviews_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "lesson_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "lesson_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      live_lessons: {
        Row: {
          booking_id: string
          created_at: string
          duration_minutes: number
          end_time: string
          id: string
          meeting_url: string
          parent_id: string
          provider: string
          start_time: string
          status: Database["public"]["Enums"]["live_lesson_status"]
          teacher_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          duration_minutes?: number
          end_time: string
          id?: string
          meeting_url: string
          parent_id: string
          provider?: string
          start_time: string
          status?: Database["public"]["Enums"]["live_lesson_status"]
          teacher_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          meeting_url?: string
          parent_id?: string
          provider?: string
          start_time?: string
          status?: Database["public"]["Enums"]["live_lesson_status"]
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_lessons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "lesson_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "live_lessons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "live_lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "live_lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      media_uploads: {
        Row: {
          attached_at: string | null
          byte_size: number
          created_at: string
          deleted_at: string | null
          expires_at: string
          id: string
          media_type: string
          object_path: string
          owner_id: string
          post_id: string | null
          status: string
        }
        Insert: {
          attached_at?: string | null
          byte_size: number
          created_at?: string
          deleted_at?: string | null
          expires_at?: string
          id?: string
          media_type: string
          object_path: string
          owner_id: string
          post_id?: string | null
          status?: string
        }
        Update: {
          attached_at?: string | null
          byte_size?: number
          created_at?: string
          deleted_at?: string | null
          expires_at?: string
          id?: string
          media_type?: string
          object_path?: string
          owner_id?: string
          post_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_uploads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "media_uploads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "media_uploads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
        ]
      }
      moderation_admin_alerts: {
        Row: {
          created_at: string
          details: string
          id: string
          reason: string
          status: string
          user_id: string
          violation_id: string
        }
        Insert: {
          created_at?: string
          details: string
          id?: string
          reason: string
          status?: string
          user_id: string
          violation_id: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          reason?: string
          status?: string
          user_id?: string
          violation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_admin_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_admin_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_admin_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_admin_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "moderation_admin_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "moderation_admin_alerts_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: false
            referencedRelation: "moderation_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_audit_log: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_kind: string
          moderator_id: string
          next_status: string
          note: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_kind: string
          moderator_id: string
          next_status: string
          note?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_kind?: string
          moderator_id?: string
          next_status?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_audit_log_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_audit_log_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_audit_log_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_audit_log_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "moderation_audit_log_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      moderation_violations: {
        Row: {
          action_taken: string
          content_kind: string
          content_preview: string
          created_at: string
          id: string
          matched_term: string | null
          reason: string
          user_id: string
        }
        Insert: {
          action_taken: string
          content_kind: string
          content_preview: string
          created_at?: string
          id?: string
          matched_term?: string | null
          reason: string
          user_id: string
        }
        Update: {
          action_taken?: string
          content_kind?: string
          content_preview?: string
          created_at?: string
          id?: string
          matched_term?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "moderation_violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean
          kind: string
          lesson_booking_id: string | null
          lesson_request_id: string | null
          message: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind: string
          lesson_booking_id?: string | null
          lesson_request_id?: string | null
          message: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          lesson_booking_id?: string | null
          lesson_request_id?: string | null
          message?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "notifications_lesson_booking_id_fkey"
            columns: ["lesson_booking_id"]
            isOneToOne: false
            referencedRelation: "lesson_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_lesson_request_id_fkey"
            columns: ["lesson_request_id"]
            isOneToOne: false
            referencedRelation: "lesson_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      parent_game_settings: {
        Row: {
          child_profile_id: string
          daily_limit_minutes: number
          id: string
          night_ban_enabled: boolean
          night_ban_end: string
          night_ban_start: string
          parent_user_id: string
          updated_at: string | null
        }
        Insert: {
          child_profile_id: string
          daily_limit_minutes?: number
          id?: string
          night_ban_enabled?: boolean
          night_ban_end?: string
          night_ban_start?: string
          parent_user_id: string
          updated_at?: string | null
        }
        Update: {
          child_profile_id?: string
          daily_limit_minutes?: number
          id?: string
          night_ban_enabled?: boolean
          night_ban_end?: string
          night_ban_start?: string
          parent_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_game_settings_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_game_settings_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_game_settings_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_game_settings_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_game_settings_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "parent_game_settings_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      parental_consents: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          parent_email: string
          requested_at: string
          status: string
          student_user_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          parent_email: string
          requested_at?: string
          status?: string
          student_user_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          parent_email?: string
          requested_at?: string
          status?: string
          student_user_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "parental_consents_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_consents_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_consents_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_consents_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "parental_consents_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      payment_disputes: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          opened_by: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["payment_dispute_status"]
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          opened_by: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["payment_dispute_status"]
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          opened_by?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["payment_dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "lesson_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "payment_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "payment_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "payment_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          moderation_status: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          moderation_status?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          moderation_status?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "post_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      posts: {
        Row: {
          area_id: number
          content: string | null
          created_at: string
          id: string
          media_url: string | null
          teacher_id: string
          title: string | null
        }
        Insert: {
          area_id: number
          content?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          teacher_id: string
          title?: string | null
        }
        Update: {
          area_id?: number
          content?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          teacher_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "posts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      private_lesson_bids: {
        Row: {
          created_at: string
          id: string
          message: string
          post_id: string
          price_per_hour_try: number
          status: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          post_id: string
          price_per_hour_try: number
          status?: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          post_id?: string
          price_per_hour_try?: number
          status?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_lesson_bids_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "private_lesson_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_bids_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_bids_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_bids_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_bids_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "private_lesson_bids_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      private_lesson_posts: {
        Row: {
          area_id: number
          bids_count: number
          budget_try: number | null
          child_profile_id: string | null
          city: string | null
          created_at: string
          description: string
          district: string | null
          grade_level: string
          id: string
          mode: string
          moderation_note: string | null
          parent_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area_id: number
          bids_count?: number
          budget_try?: number | null
          child_profile_id?: string | null
          city?: string | null
          created_at?: string
          description: string
          district?: string | null
          grade_level: string
          id?: string
          mode: string
          moderation_note?: string | null
          parent_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area_id?: number
          bids_count?: number
          budget_try?: number | null
          child_profile_id?: string | null
          city?: string | null
          created_at?: string
          description?: string
          district?: string | null
          grade_level?: string
          id?: string
          mode?: string
          moderation_note?: string | null
          parent_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_lesson_posts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_posts_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "private_lesson_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "private_lesson_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "private_lesson_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      progress_reports: {
        Row: {
          area_id: number
          child_profile_id: string | null
          created_at: string
          feedback: string | null
          id: string
          report_date: string
          score: number
          student_user_id: string | null
        }
        Insert: {
          area_id: number
          child_profile_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          report_date?: string
          score: number
          student_user_id?: string | null
        }
        Update: {
          area_id?: number
          child_profile_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          report_date?: string
          score?: number
          student_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_reports_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "progress_reports_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      questions: {
        Row: {
          area_id: number
          author_id: string
          created_at: string
          description: string
          id: string
          is_resolved: boolean
          title: string
        }
        Insert: {
          area_id: number
          author_id: string
          created_at?: string
          description: string
          id?: string
          is_resolved?: boolean
          title: string
        }
        Update: {
          area_id?: number
          author_id?: string
          created_at?: string
          description?: string
          id?: string
          is_resolved?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: number
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option: number
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          child_profile_id: string | null
          completed_at: string | null
          correct_answers: number
          created_at: string
          id: string
          is_correct: boolean
          points_awarded: number
          quiz_id: string
          score_percent: number
          selected_option: number | null
          total_questions: number
          user_id: string | null
        }
        Insert: {
          child_profile_id?: string | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          id?: string
          is_correct: boolean
          points_awarded?: number
          quiz_id: string
          score_percent?: number
          selected_option?: number | null
          total_questions?: number
          user_id?: string | null
        }
        Update: {
          child_profile_id?: string | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          points_awarded?: number
          quiz_id?: string
          score_percent?: number
          selected_option?: number | null
          total_questions?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_option: number
          created_at: string
          id: string
          options: Json
          question_text: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_option: number
          created_at?: string
          id?: string
          options: Json
          question_text: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_option?: number
          created_at?: string
          id?: string
          options?: Json
          question_text?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          area_id: number
          correct_option: number
          created_at: string
          id: string
          is_active: boolean
          options: Json
          points_reward: number
          question_text: string
          teacher_id: string
          title: string
        }
        Insert: {
          area_id: number
          correct_option: number
          created_at?: string
          id?: string
          is_active?: boolean
          options: Json
          points_reward?: number
          question_text: string
          teacher_id: string
          title: string
        }
        Update: {
          area_id?: number
          correct_option?: number
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          points_reward?: number
          question_text?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      reputation_events: {
        Row: {
          actor_id: string | null
          created_at: string
          delta: number
          id: string
          kind: Database["public"]["Enums"]["reputation_event_kind"]
          note: string | null
          reference_id: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delta: number
          id?: string
          kind: Database["public"]["Enums"]["reputation_event_kind"]
          note?: string | null
          reference_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          kind?: Database["public"]["Enums"]["reputation_event_kind"]
          note?: string | null
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "reputation_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      review_items: {
        Row: {
          correct_index: number
          created_at: string
          due_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          options: Json
          question_text: string
          repetitions: number
          source: string
          source_ref: string
          user_id: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          due_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          options: Json
          question_text: string
          repetitions?: number
          source: string
          source_ref: string
          user_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          due_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          options?: Json
          question_text?: string
          repetitions?: number
          source?: string
          source_ref?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "review_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      role_change_requests: {
        Row: {
          created_at: string
          fee_amount: number
          fee_paid: boolean
          id: string
          old_role: string
          reason: string | null
          requested_organization_type: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fee_amount?: number
          fee_paid?: boolean
          id?: string
          old_role: string
          reason?: string | null
          requested_organization_type?: string | null
          requested_role: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          fee_paid?: boolean
          id?: string
          old_role?: string
          reason?: string | null
          requested_organization_type?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "role_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "role_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "role_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      social_posts: {
        Row: {
          area_id: number | null
          author_id: string
          caption: string
          city: string | null
          co_author_id: string | null
          comments_count: number
          content: string | null
          created_at: string
          district: string | null
          external_url: string | null
          follower_conversion_count: number
          followers_only: boolean
          followers_only_comments: boolean
          id: string
          is_discoverable: boolean
          is_reel: boolean
          legacy_post_id: string | null
          likes_count: number
          location_name: string | null
          media_type: string
          media_url: string | null
          post_type: Database["public"]["Enums"]["content_post_type"]
          premium_prep_label: string | null
          premium_prep_url: string | null
          quiz_id: string | null
          saves_count: number
          shares_count: number
          sponsored_click_count: number
          sponsored_disclosure: string | null
          sponsored_expires_at: string | null
          sponsored_label: string | null
          sponsored_status: string | null
          sponsored_target_url: string | null
          target_audience: string
          target_grade: string | null
          teaser_text: string | null
          title: string | null
        }
        Insert: {
          area_id?: number | null
          author_id: string
          caption: string
          city?: string | null
          co_author_id?: string | null
          comments_count?: number
          content?: string | null
          created_at?: string
          district?: string | null
          external_url?: string | null
          follower_conversion_count?: number
          followers_only?: boolean
          followers_only_comments?: boolean
          id?: string
          is_discoverable?: boolean
          is_reel?: boolean
          legacy_post_id?: string | null
          likes_count?: number
          location_name?: string | null
          media_type?: string
          media_url?: string | null
          post_type?: Database["public"]["Enums"]["content_post_type"]
          premium_prep_label?: string | null
          premium_prep_url?: string | null
          quiz_id?: string | null
          saves_count?: number
          shares_count?: number
          sponsored_click_count?: number
          sponsored_disclosure?: string | null
          sponsored_expires_at?: string | null
          sponsored_label?: string | null
          sponsored_status?: string | null
          sponsored_target_url?: string | null
          target_audience?: string
          target_grade?: string | null
          teaser_text?: string | null
          title?: string | null
        }
        Update: {
          area_id?: number | null
          author_id?: string
          caption?: string
          city?: string | null
          co_author_id?: string | null
          comments_count?: number
          content?: string | null
          created_at?: string
          district?: string | null
          external_url?: string | null
          follower_conversion_count?: number
          followers_only?: boolean
          followers_only_comments?: boolean
          id?: string
          is_discoverable?: boolean
          is_reel?: boolean
          legacy_post_id?: string | null
          likes_count?: number
          location_name?: string | null
          media_type?: string
          media_url?: string | null
          post_type?: Database["public"]["Enums"]["content_post_type"]
          premium_prep_label?: string | null
          premium_prep_url?: string | null
          quiz_id?: string | null
          saves_count?: number
          shares_count?: number
          sponsored_click_count?: number
          sponsored_disclosure?: string | null
          sponsored_expires_at?: string | null
          sponsored_label?: string | null
          sponsored_status?: string | null
          sponsored_target_url?: string | null
          target_audience?: string
          target_grade?: string | null
          teaser_text?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "social_posts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_ad_clicks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_ad_clicks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_ad_clicks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "sponsored_ad_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_ad_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_ad_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_ad_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "sponsored_ad_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      store_products: {
        Row: {
          category: Database["public"]["Enums"]["store_product_category"]
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_points: number
          requires_parent_approval: boolean
          stock_count: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["store_product_category"]
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_points: number
          requires_parent_approval?: boolean
          stock_count?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["store_product_category"]
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_points?: number
          requires_parent_approval?: boolean
          stock_count?: number | null
        }
        Relationships: []
      }
      store_redemptions: {
        Row: {
          child_profile_id: string | null
          created_at: string
          id: string
          note: string | null
          points_spent: number
          product_id: string
          status: Database["public"]["Enums"]["store_redemption_status"]
          user_id: string | null
        }
        Insert: {
          child_profile_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          points_spent: number
          product_id: string
          status?: Database["public"]["Enums"]["store_redemption_status"]
          user_id?: string | null
        }
        Update: {
          child_profile_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          points_spent?: number
          product_id?: string
          status?: Database["public"]["Enums"]["store_redemption_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_redemptions_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_redemptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "store_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      stories: {
        Row: {
          area_id: number | null
          author_id: string
          caption: string | null
          created_at: string
          expires_at: string
          followers_only: boolean
          id: string
          media_url: string | null
        }
        Insert: {
          area_id?: number | null
          author_id: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          followers_only?: boolean
          id?: string
          media_url?: string | null
        }
        Update: {
          area_id?: number | null
          author_id?: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          followers_only?: boolean
          id?: string
          media_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      story_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          moderation_status: string
          story_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          moderation_status?: string
          story_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          moderation_status?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_replies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "story_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      student_needs: {
        Row: {
          area_id: number
          child_profile_id: string | null
          created_at: string
          id: string
          student_user_id: string | null
          updated_at: string
          weakness_level: number
        }
        Insert: {
          area_id: number
          child_profile_id?: string | null
          created_at?: string
          id?: string
          student_user_id?: string | null
          updated_at?: string
          weakness_level: number
        }
        Update: {
          area_id?: number
          child_profile_id?: string | null
          created_at?: string
          id?: string
          student_user_id?: string | null
          updated_at?: string
          weakness_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_needs_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_needs_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_needs_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_needs_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_needs_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_needs_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "student_needs_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      student_subject_success: {
        Row: {
          area_id: number
          child_profile_id: string | null
          completed_lessons: number
          id: string
          student_user_id: string | null
          success_score: number
          updated_at: string
        }
        Insert: {
          area_id: number
          child_profile_id?: string | null
          completed_lessons?: number
          id?: string
          student_user_id?: string | null
          success_score?: number
          updated_at?: string
        }
        Update: {
          area_id?: number
          child_profile_id?: string | null
          completed_lessons?: number
          id?: string
          student_user_id?: string | null
          success_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_subject_success_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subject_success_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subject_success_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subject_success_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subject_success_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subject_success_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "student_subject_success_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_group_approvals: {
        Row: {
          created_at: string
          group_id: string
          id: string
          kind: Database["public"]["Enums"]["study_group_approval_kind"]
          note: string | null
          parent_user_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["study_group_approval_status"]
          student_user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          kind: Database["public"]["Enums"]["study_group_approval_kind"]
          note?: string | null
          parent_user_id: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["study_group_approval_status"]
          student_user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["study_group_approval_kind"]
          note?: string | null
          parent_user_id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["study_group_approval_status"]
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_approvals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_approvals_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_approvals_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_approvals_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_approvals_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_group_approvals_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "study_group_approvals_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_approvals_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_approvals_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_approvals_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_group_approvals_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_groups: {
        Row: {
          area_id: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_user_id: string
          status: Database["public"]["Enums"]["study_group_status"]
        }
        Insert: {
          area_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_user_id: string
          status?: Database["public"]["Enums"]["study_group_status"]
        }
        Update: {
          area_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          status?: Database["public"]["Enums"]["study_group_status"]
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_groups_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_moment_cheers: {
        Row: {
          created_at: string
          moment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          moment_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          moment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_moment_cheers_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "study_moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moment_cheers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moment_cheers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moment_cheers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moment_cheers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_moment_cheers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_moments: {
        Row: {
          area_id: number
          caption: string | null
          created_at: string
          duration_minutes: number
          id: string
          session_id: string
          topic_label: string
          user_id: string
        }
        Insert: {
          area_id: number
          caption?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          session_id: string
          topic_label: string
          user_id: string
        }
        Update: {
          area_id?: number
          caption?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          session_id?: string
          topic_label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_moments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_moments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_moments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_plans: {
        Row: {
          area_id: number | null
          id: string
          is_active: boolean
          primary_topic: string
          updated_at: string
          user_id: string
          weekly_pomodoro_goal: number
        }
        Insert: {
          area_id?: number | null
          id?: string
          is_active?: boolean
          primary_topic?: string
          updated_at?: string
          user_id: string
          weekly_pomodoro_goal?: number
        }
        Update: {
          area_id?: number | null
          id?: string
          is_active?: boolean
          primary_topic?: string
          updated_at?: string
          user_id?: string
          weekly_pomodoro_goal?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_room_participants: {
        Row: {
          joined_at: string
          left_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          left_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          left_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          closed_at: string | null
          created_at: string
          host_id: string
          id: string
          max_participants: number
          name: string
          room_type: Database["public"]["Enums"]["study_room_type"]
          status: Database["public"]["Enums"]["study_room_status"]
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          host_id: string
          id?: string
          max_participants?: number
          name: string
          room_type?: Database["public"]["Enums"]["study_room_type"]
          status?: Database["public"]["Enums"]["study_room_status"]
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          host_id?: string
          id?: string
          max_participants?: number
          name?: string
          room_type?: Database["public"]["Enums"]["study_room_type"]
          status?: Database["public"]["Enums"]["study_room_status"]
        }
        Relationships: [
          {
            foreignKeyName: "study_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "study_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      taboo_custom_cards: {
        Row: {
          ai_descriptions: Json
          created_at: string | null
          deck_id: string | null
          forbidden_words: Json
          id: string
          word: string
        }
        Insert: {
          ai_descriptions: Json
          created_at?: string | null
          deck_id?: string | null
          forbidden_words: Json
          id?: string
          word: string
        }
        Update: {
          ai_descriptions?: Json
          created_at?: string | null
          deck_id?: string | null
          forbidden_words?: Json
          id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "taboo_custom_cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "taboo_custom_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      taboo_custom_decks: {
        Row: {
          category: string
          code: string
          created_at: string | null
          id: string
          teacher_id: string | null
          title: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          id?: string
          teacher_id?: string | null
          title: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          id?: string
          teacher_id?: string | null
          title?: string
        }
        Relationships: []
      }
      taboo_duels: {
        Row: {
          category: string | null
          challenger_combo: number
          challenger_id: string | null
          challenger_score: number
          created_at: string | null
          id: string
          seed: string
        }
        Insert: {
          category?: string | null
          challenger_combo: number
          challenger_id?: string | null
          challenger_score: number
          created_at?: string | null
          id?: string
          seed: string
        }
        Update: {
          category?: string | null
          challenger_combo?: number
          challenger_id?: string | null
          challenger_score?: number
          created_at?: string | null
          id?: string
          seed?: string
        }
        Relationships: []
      }
      teacher_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_booked: boolean
          start_time: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean
          start_time: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      teacher_campaigns: {
        Row: {
          click_count: number
          cover_image_url: string | null
          created_at: string
          cta_label: string
          cta_url: string | null
          headline: string
          id: string
          is_published: boolean
          is_sponsored: boolean
          pitch: string | null
          sponsored_disclosure: string
          sponsored_expires_at: string | null
          sponsored_package_days: number | null
          sponsored_status: string | null
          sponsored_targeting: Json | null
          tagline: string | null
          teacher_id: string
          updated_at: string
          view_count: number
        }
        Insert: {
          click_count?: number
          cover_image_url?: string | null
          created_at?: string
          cta_label?: string
          cta_url?: string | null
          headline: string
          id?: string
          is_published?: boolean
          is_sponsored?: boolean
          pitch?: string | null
          sponsored_disclosure?: string
          sponsored_expires_at?: string | null
          sponsored_package_days?: number | null
          sponsored_status?: string | null
          sponsored_targeting?: Json | null
          tagline?: string | null
          teacher_id: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          click_count?: number
          cover_image_url?: string | null
          created_at?: string
          cta_label?: string
          cta_url?: string | null
          headline?: string
          id?: string
          is_published?: boolean
          is_sponsored?: boolean
          pitch?: string | null
          sponsored_disclosure?: string
          sponsored_expires_at?: string | null
          sponsored_package_days?: number | null
          sponsored_status?: string | null
          sponsored_targeting?: Json | null
          tagline?: string | null
          teacher_id?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_campaigns_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_campaigns_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_campaigns_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_campaigns_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "teacher_campaigns_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      teacher_credential_submissions: {
        Row: {
          admin_note: string | null
          created_at: string
          credential_type: Database["public"]["Enums"]["teacher_credential_type"]
          document_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["teacher_credential_status"]
          teacher_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          credential_type: Database["public"]["Enums"]["teacher_credential_type"]
          document_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["teacher_credential_status"]
          teacher_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          credential_type?: Database["public"]["Enums"]["teacher_credential_type"]
          document_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["teacher_credential_status"]
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_credential_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "teacher_credential_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      teacher_expertise_selections: {
        Row: {
          review_boost_score: number
          selected_at: string
          teacher_id: string
          track_slug: string
        }
        Insert: {
          review_boost_score?: number
          selected_at?: string
          teacher_id: string
          track_slug: string
        }
        Update: {
          review_boost_score?: number
          selected_at?: string
          teacher_id?: string
          track_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_expertise_selections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_expertise_selections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_expertise_selections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_expertise_selections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "teacher_expertise_selections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      teacher_profile_extras: {
        Row: {
          availability_note: string | null
          availability_status:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          contact_summary: string | null
          cv_url: string | null
          details: Json
          education_degree:
            | Database["public"]["Enums"]["education_degree_type"]
            | null
          hourly_rate: number | null
          lesson_acceptance_rate_percent: number | null
          response_time_minutes: number | null
          soft_skills: string[]
          teaching_style:
            | Database["public"]["Enums"]["teaching_style_type"]
            | null
          updated_at: string
          user_id: string
          video_intro_url: string | null
          years_of_experience: number
        }
        Insert: {
          availability_note?: string | null
          availability_status?:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type?:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          contact_summary?: string | null
          cv_url?: string | null
          details?: Json
          education_degree?:
            | Database["public"]["Enums"]["education_degree_type"]
            | null
          hourly_rate?: number | null
          lesson_acceptance_rate_percent?: number | null
          response_time_minutes?: number | null
          soft_skills?: string[]
          teaching_style?:
            | Database["public"]["Enums"]["teaching_style_type"]
            | null
          updated_at?: string
          user_id: string
          video_intro_url?: string | null
          years_of_experience?: number
        }
        Update: {
          availability_note?: string | null
          availability_status?:
            | Database["public"]["Enums"]["profile_availability_status"]
            | null
          badge_type?:
            | Database["public"]["Enums"]["professional_badge_type"]
            | null
          contact_summary?: string | null
          cv_url?: string | null
          details?: Json
          education_degree?:
            | Database["public"]["Enums"]["education_degree_type"]
            | null
          hourly_rate?: number | null
          lesson_acceptance_rate_percent?: number | null
          response_time_minutes?: number | null
          soft_skills?: string[]
          teaching_style?:
            | Database["public"]["Enums"]["teaching_style_type"]
            | null
          updated_at?: string
          user_id?: string
          video_intro_url?: string | null
          years_of_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "teacher_profile_extras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      teacher_stats: {
        Row: {
          avg_response_minutes: number
          stats_computed_at: string
          teacher_id: string
          total_lessons: number
          total_students: number
          updated_at: string
        }
        Insert: {
          avg_response_minutes?: number
          stats_computed_at?: string
          teacher_id: string
          total_lessons?: number
          total_students?: number
          updated_at?: string
        }
        Update: {
          avg_response_minutes?: number
          stats_computed_at?: string
          teacher_id?: string
          total_lessons?: number
          total_students?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_stats_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_stats_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_stats_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_stats_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "teacher_stats_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      user_interests: {
        Row: {
          area_id: number
          user_id: string
        }
        Insert: {
          area_id: number
          user_id: string
        }
        Update: {
          area_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      user_onboarding_intake: {
        Row: {
          completed_at: string
          goal_exam: Database["public"]["Enums"]["exam_goal_type"]
          grade_level: string | null
          struggle_area_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          goal_exam?: Database["public"]["Enums"]["exam_goal_type"]
          grade_level?: string | null
          struggle_area_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          goal_exam?: Database["public"]["Enums"]["exam_goal_type"]
          grade_level?: string | null
          struggle_area_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_intake_struggle_area_id_fkey"
            columns: ["struggle_area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_onboarding_intake_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_onboarding_intake_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_onboarding_intake_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_onboarding_intake_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "user_onboarding_intake_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      user_quizzes: {
        Row: {
          area_id: number | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          play_count: number
          questions: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          area_id?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          play_count?: number
          questions: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          area_id?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          play_count?: number
          questions?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quizzes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "user_quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      user_safety_settings: {
        Row: {
          allow_comments: boolean
          allow_follow_requests: boolean
          allow_story_replies: boolean
          profile_discoverable: boolean
          require_guardian_post_approval: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_comments?: boolean
          allow_follow_requests?: boolean
          allow_story_replies?: boolean
          profile_discoverable?: boolean
          require_guardian_post_approval?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_comments?: boolean
          allow_follow_requests?: boolean
          allow_story_replies?: boolean
          profile_discoverable?: boolean
          require_guardian_post_approval?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_safety_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_safety_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_safety_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_safety_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "user_safety_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          current_period_end: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          ad_free_until?: string | null
          avatar_assets?: Json
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          classroom?: string | null
          created_at?: string
          district?: string | null
          email: string
          full_name: string
          game_xp_day?: string | null
          game_xp_today?: number
          grade_level?: string | null
          id: string
          instagram_url?: string | null
          is_premium?: boolean | null
          is_verified?: boolean
          last_active_date?: string | null
          last_game_xp_at?: string | null
          level?: number
          organization_type?: string | null
          reputation_score?: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed?: boolean
          school_name?: string | null
          shortcut_preferences?: Json
          social_interactions_blocked?: boolean
          social_interactions_blocked_at?: string | null
          social_safety_strike_count?: number
          streak_days?: number
          student_document_reviewed_at?: string | null
          student_document_reviewed_by?: string | null
          student_document_status?:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at?: string | null
          student_document_url?: string | null
          total_points?: number
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          ad_free_until?: string | null
          avatar_assets?: Json
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          classroom?: string | null
          created_at?: string
          district?: string | null
          email?: string
          full_name?: string
          game_xp_day?: string | null
          game_xp_today?: number
          grade_level?: string | null
          id?: string
          instagram_url?: string | null
          is_premium?: boolean | null
          is_verified?: boolean
          last_active_date?: string | null
          last_game_xp_at?: string | null
          level?: number
          organization_type?: string | null
          reputation_score?: number
          role?: Database["public"]["Enums"]["user_role"]
          role_selection_completed?: boolean
          school_name?: string | null
          shortcut_preferences?: Json
          social_interactions_blocked?: boolean
          social_interactions_blocked_at?: string | null
          social_safety_strike_count?: number
          streak_days?: number
          student_document_reviewed_at?: string | null
          student_document_reviewed_by?: string | null
          student_document_status?:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at?: string | null
          student_document_url?: string | null
          total_points?: number
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_student_document_reviewed_by_fkey"
            columns: ["student_document_reviewed_by"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_student_document_reviewed_by_fkey"
            columns: ["student_document_reviewed_by"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_student_document_reviewed_by_fkey"
            columns: ["student_document_reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_student_document_reviewed_by_fkey"
            columns: ["student_document_reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "users_student_document_reviewed_by_fkey"
            columns: ["student_document_reviewed_by"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      user_admin_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          note: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          note: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          note?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_admin_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_admin_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_time_limits: {
        Row: {
          created_at: string
          day: string
          id: string
          limit_minutes: number
          used_seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          limit_minutes?: number
          used_seconds?: number
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          limit_minutes?: number
          used_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_time_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_completions: {
        Row: {
          child_profile_id: string | null
          created_at: string
          id: string
          points_awarded: number
          post_id: string | null
          seconds_watched: number
          social_post_id: string | null
          user_id: string | null
        }
        Insert: {
          child_profile_id?: string | null
          created_at?: string
          id?: string
          points_awarded?: number
          post_id?: string | null
          seconds_watched: number
          social_post_id?: string | null
          user_id?: string | null
        }
        Update: {
          child_profile_id?: string | null
          created_at?: string
          id?: string
          points_awarded?: number
          post_id?: string | null
          seconds_watched?: number
          social_post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_completions_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_completions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_completions_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_completions_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "video_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "video_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
      zigo_applied_migrations: {
        Row: {
          applied_at: string
          migration_id: string
        }
        Insert: {
          applied_at?: string
          migration_id: string
        }
        Update: {
          applied_at?: string
          migration_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      post_interactions: {
        Row: {
          created_at: string | null
          interaction_type: string | null
          post_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      student_leaderboard_mv: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          rank: number | null
          total_points: number | null
        }
        Relationships: []
      }
      teacher_leaderboard_mv: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          rank: number | null
          total_points: number | null
        }
        Relationships: []
      }
      vw_explore_social_posts: {
        Row: {
          area_id: number | null
          author_id: string | null
          caption: string | null
          co_author_id: string | null
          co_full_name: string | null
          co_id: string | null
          content: string | null
          created_at: string | null
          ea_area_name: string | null
          is_reel: boolean | null
          media_type: string | null
          media_url: string | null
          post_id: string | null
          post_type: Database["public"]["Enums"]["content_post_type"] | null
          title: string | null
          u_avatar_url: string | null
          u_full_name: string | null
          u_id: string | null
          u_is_verified: boolean | null
          u_organization_type: string | null
          u_role: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "education_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "teacher_leaderboard_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["co_id"]
          },
          {
            foreignKeyName: "social_posts_co_author_id_fkey"
            columns: ["co_author_id"]
            isOneToOne: false
            referencedRelation: "vw_explore_social_posts"
            referencedColumns: ["u_id"]
          },
        ]
      }
    }
    Functions: {
      _finalize_quiz_attempt: {
        Args: {
          p_answer_rows: Json
          p_child_profile_id: string
          p_correct_answers: number
          p_first_selected_option: number
          p_quiz: Database["public"]["Tables"]["quizzes"]["Row"]
          p_total_questions: number
          p_user_id: string
        }
        Returns: {
          child_profile_id: string | null
          completed_at: string | null
          correct_answers: number
          created_at: string
          id: string
          is_correct: boolean
          points_awarded: number
          quiz_id: string
          score_percent: number
          selected_option: number | null
          total_questions: number
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quiz_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_family_link_invitation: {
        Args: { raw_token: string }
        Returns: {
          created_at: string
          guardian_id: string
          id: string
          relationship: string
          revoked_at: string | null
          status: string
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "family_student_links"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      activate_lesson_package_subscription: {
        Args: {
          p_duration_days?: number
          p_plan_type: Database["public"]["Enums"]["lesson_package_plan_type"]
          p_stripe_checkout_session_id?: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          ends_at: string
          id: string
          lessons_included: number
          lessons_used: number
          plan_type: Database["public"]["Enums"]["lesson_package_plan_type"]
          starts_at: string
          status: Database["public"]["Enums"]["lesson_package_status"]
          stripe_checkout_session_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_package_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_send_user_message: {
        Args: { msg_body: string; msg_title: string; target_user_id: string }
        Returns: undefined
      }
      admin_set_teacher_areas: {
        Args: { area_ids: number[]; target_teacher_id: string }
        Returns: undefined
      }
      admin_update_user_status: {
        Args: {
          new_status: Database["public"]["Enums"]["account_status"]
          target_user_id: string
        }
        Returns: undefined
      }
      apply_teacher_stats_on_lesson_complete: {
        Args: { lesson_progress_score?: number; target_booking_id: string }
        Returns: {
          avg_response_minutes: number
          stats_computed_at: string
          teacher_id: string
          total_lessons: number
          total_students: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_answer: { Args: { answer_id: string }; Returns: undefined }
      approve_role_change_request: {
        Args: { request_id: string }
        Returns: undefined
      }
      assert_content_text_safe: {
        Args: { input_text: string }
        Returns: undefined
      }
      attach_bank_transfer_receipt: {
        Args: { p_receipt_storage_path: string; p_request_id: string }
        Returns: {
          admin_note: string | null
          amount_try: number
          created_at: string
          id: string
          period_end: string | null
          plan_id: string
          receipt_storage_path: string | null
          reference_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["bank_transfer_request_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bank_transfer_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auto_hide_social_post: { Args: { p_post_id: string }; Returns: undefined }
      award_child_learning_points: {
        Args: { action_kind: string; target_child_profile_id: string }
        Returns: {
          id: string
          total_points: number
        }[]
      }
      award_child_lesson_completion_reward: {
        Args: {
          points_to_add?: number
          target_booking_id: string
          target_child_profile_id: string
          teacher_id: string
        }
        Returns: undefined
      }
      award_learning_points: {
        Args: { action_kind: string; student_id: string }
        Returns: {
          id: string
          total_points: number
        }[]
      }
      award_safe_duel_win_points: {
        Args: {
          p_area_id?: number
          p_duel_id: string
          p_score: number
          p_target_user_id: string
          p_total_questions?: number
        }
        Returns: {
          already_awarded: boolean
          event_id: string
          points_awarded: number
          total_points: number
        }[]
      }
      award_social_reel_watch_points: {
        Args: {
          p_points: number
          p_target_id: string
          p_target_user_id: string
        }
        Returns: {
          already_awarded: boolean
          event_id: string
          points_awarded: number
          total_points: number
        }[]
      }
      book_availability_slot: {
        Args: {
          area_id?: number
          child_profile_id?: string
          parent_id: string
          slot_id: string
        }
        Returns: {
          area_id: number | null
          availability_id: string
          child_profile_id: string | null
          created_at: string
          end_time: string
          id: string
          parent_id: string
          payment_status: Database["public"]["Enums"]["lesson_payment_status"]
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          teacher_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      boost_teacher_expertise_from_review: {
        Args: {
          boost_amount?: number
          boost_slugs: string[]
          target_teacher_id: string
        }
        Returns: undefined
      }
      build_jitsi_meeting_url: {
        Args: { for_booking_id: string }
        Returns: string
      }
      campaign_targeting_has_placement: {
        Args: { placement_key: string; targeting: Json }
        Returns: boolean
      }
      campaign_targeting_targets_all_cities: {
        Args: { targeting: Json }
        Returns: boolean
      }
      can_view_social_media: { Args: { target_path: string }; Returns: boolean }
      cancel_lesson_booking: {
        Args: { actor_id: string; booking_id: string }
        Returns: {
          area_id: number | null
          availability_id: string
          child_profile_id: string | null
          created_at: string
          end_time: string
          id: string
          parent_id: string
          payment_status: Database["public"]["Enums"]["lesson_payment_status"]
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          teacher_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cheer_study_moment: {
        Args: { p_moment_id: string }
        Returns: {
          cheer_count: number
        }[]
      }
      complete_child_video_post: {
        Args: {
          seconds_watched?: number
          target_child_profile_id: string
          target_post_id: string
        }
        Returns: {
          child_profile_id: string | null
          created_at: string
          id: string
          points_awarded: number
          post_id: string | null
          seconds_watched: number
          social_post_id: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "video_completions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_focus_session: {
        Args: { p_session_id: string }
        Returns: {
          already_awarded: boolean
          event_id: string
          points_awarded: number
          session_id: string
          total_points: number
        }[]
      }
      complete_lesson_booking: {
        Args: {
          booking_id: string
          progress_feedback?: string
          progress_score?: number
          teacher_id: string
        }
        Returns: {
          area_id: number | null
          availability_id: string
          child_profile_id: string | null
          created_at: string
          end_time: string
          id: string
          parent_id: string
          payment_status: Database["public"]["Enums"]["lesson_payment_status"]
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          teacher_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_role_selection: {
        Args: {
          org_type?: string
          profile_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_video_post: {
        Args: { seconds_watched?: number; target_post_id: string }
        Returns: {
          child_profile_id: string | null
          created_at: string
          id: string
          points_awarded: number
          post_id: string | null
          seconds_watched: number
          social_post_id: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "video_completions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      compute_teacher_avg_response_minutes: {
        Args: { target_teacher_id: string }
        Returns: number
      }
      confirm_lesson_payment: {
        Args: { side: string; target_booking_id: string }
        Returns: {
          area_id: number | null
          availability_id: string
          child_profile_id: string | null
          created_at: string
          end_time: string
          id: string
          parent_id: string
          payment_status: Database["public"]["Enums"]["lesson_payment_status"]
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          teacher_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      consume_lesson_package_credit: {
        Args: { for_parent_id: string }
        Returns: undefined
      }
      content_contains_blocked_keyword: {
        Args: { input_text: string }
        Returns: boolean
      }
      content_contains_obscenity_pattern: {
        Args: { input_text: string }
        Returns: boolean
      }
      count_lesson_request_unread: {
        Args: { for_user_id: string }
        Returns: number
      }
      create_bank_transfer_request: {
        Args: { p_amount_try: number; p_plan_id: string }
        Returns: {
          admin_note: string | null
          amount_try: number
          created_at: string
          id: string
          period_end: string | null
          plan_id: string
          receipt_storage_path: string | null
          reference_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["bank_transfer_request_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bank_transfer_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_child_profile: {
        Args: { age_group: string; display_name: string }
        Returns: {
          age_group: string | null
          avatar_assets: Json
          city: string | null
          classroom: string | null
          created_at: string
          display_name: string
          district: string | null
          grade_level: string | null
          id: string
          parent_id: string
          school_name: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "child_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_family_link_invitation: {
        Args: { target_student_email: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_token: string
        }[]
      }
      create_lesson_request_notification: {
        Args: {
          actor_id: string
          kind: string
          message: string
          recipient_id: string
          request_id: string
        }
        Returns: undefined
      }
      create_live_lesson_for_booking: {
        Args: { target_booking_id: string }
        Returns: {
          booking_id: string
          created_at: string
          duration_minutes: number
          end_time: string
          id: string
          meeting_url: string
          parent_id: string
          provider: string
          start_time: string
          status: Database["public"]["Enums"]["live_lesson_status"]
          teacher_id: string
        }
        SetofOptions: {
          from: "*"
          to: "live_lessons"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_profile: {
        Args: {
          full_name: string
          profile_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_study_group: {
        Args: {
          p_area_id?: number
          p_description?: string
          p_name: string
          p_parent_email?: string
        }
        Returns: {
          area_id: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_user_id: string
          status: Database["public"]["Enums"]["study_group_status"]
        }
        SetofOptions: {
          from: "*"
          to: "study_groups"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_email_confirmed: { Args: never; Returns: boolean }
      current_user_has_active_zigo_plus: { Args: never; Returns: boolean }
      current_user_has_area: {
        Args: { target_area_id: number }
        Returns: boolean
      }
      current_user_is_parent_or_student: { Args: never; Returns: boolean }
      current_user_is_parent_or_teacher: { Args: never; Returns: boolean }
      current_user_is_platform_admin: { Args: never; Returns: boolean }
      current_user_is_verified_teacher: { Args: never; Returns: boolean }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_user_social_interactions_blocked: {
        Args: never
        Returns: boolean
      }
      current_user_student_document_approved: { Args: never; Returns: boolean }
      downgrade_from_premium: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      export_user_data: { Args: never; Returns: Json }
      find_best_teacher: {
        Args: {
          for_child_profile_id?: string
          for_student_user_id?: string
          limit_count?: number
        }
        Returns: {
          area_name: string
          full_name: string
          match_score: number
          matched_area_id: number
          reputation_score: number
          teacher_id: string
          weakness_level: number
        }[]
      }
      get_active_focus_session: {
        Args: never
        Returns: {
          area_id: number | null
          child_profile_id: string | null
          completed_at: string | null
          id: string
          points_awarded: number
          started_at: string
          status: string
          target_seconds: number
          topic_label: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "focus_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_area_leaderboard: {
        Args: { limit_count?: number; target_area_id: number }
        Returns: {
          full_name: string
          rank: number
          total_points: number
          user_id: string
        }[]
      }
      get_child_matched_quizzes: {
        Args: { target_child_profile_id: string }
        Returns: {
          area_id: number
          created_at: string
          id: string
          options: Json
          points_reward: number
          question_count: number
          question_text: string
          title: string
        }[]
      }
      get_matched_quizzes: {
        Args: never
        Returns: {
          area_id: number
          created_at: string
          id: string
          options: Json
          points_reward: number
          question_count: number
          question_text: string
          title: string
        }[]
      }
      get_matched_study_moments: {
        Args: never
        Returns: {
          area_id: number
          area_name: string
          caption: string
          cheer_count: number
          created_at: string
          duration_minutes: number
          full_name: string
          id: string
          topic_label: string
          user_id: string
        }[]
      }
      get_parent_child_activity: {
        Args: { result_limit?: number; target_child_profile_id: string }
        Returns: {
          activity_id: string
          activity_type: string
          created_at: string
          metadata: Json
          points_awarded: number
          title: string
        }[]
      }
      get_parent_child_quiz_activity: {
        Args: { result_limit?: number; target_child_profile_id: string }
        Returns: {
          attempt_id: string
          completed_at: string
          correct_answers: number
          points_awarded: number
          quiz_id: string
          quiz_title: string
          score_percent: number
          total_questions: number
        }[]
      }
      get_parent_children_focus_stats: {
        Args: never
        Returns: {
          child_profile_id: string
          completed_sessions: number
          display_name: string
          focus_minutes_week: number
          total_points: number
        }[]
      }
      get_parent_focus_overview: {
        Args: never
        Returns: {
          focus_minutes_in_areas: number
          latest_created_at: string
          latest_student_name: string
          latest_topic: string
          matched_study_moments: number
        }[]
      }
      get_parent_weekly_progress_summary: {
        Args: { for_child_profile_id?: string; for_parent_id: string }
        Returns: Json
      }
      get_premium_prep_url: {
        Args: { target_post_id: string }
        Returns: string
      }
      get_quiz_questions_for_play: {
        Args: { target_quiz_id: string }
        Returns: {
          id: string
          options: Json
          question_text: string
          sort_order: number
        }[]
      }
      get_sponsored_ad_url: {
        Args: { target_post_id: string }
        Returns: string
      }
      get_student_focus_analytics: {
        Args: never
        Returns: {
          active_session_id: string
          active_session_started_at: string
          active_session_target_seconds: number
          active_session_topic: string
          completed_sessions: number
          focus_minutes_week: number
          points_from_focus: number
          shared_moments: number
          weekly_completed: number
          weekly_goal: number
        }[]
      }
      get_teacher_campaign: {
        Args: { target_teacher_id: string }
        Returns: {
          click_count: number
          cover_image_url: string
          cta_label: string
          cta_url: string
          headline: string
          id: string
          is_published: boolean
          is_sponsored: boolean
          is_sponsored_active: boolean
          pitch: string
          sponsored_disclosure: string
          sponsored_expires_at: string
          sponsored_package_days: number
          sponsored_status: string
          sponsored_targeting: Json
          tagline: string
          teacher_id: string
          teacher_name: string
          teacher_verified: boolean
          updated_at: string
          view_count: number
        }[]
      }
      get_teacher_completed_lesson_count: {
        Args: { target_teacher_id: string }
        Returns: number
      }
      get_teacher_platform_activity_stats: {
        Args: { target_teacher_id: string }
        Returns: {
          avg_response_minutes: number
          completed_student_count: number
          total_completed_lessons: number
        }[]
      }
      get_weekly_focus_minutes: {
        Args: never
        Returns: {
          day: string
          focus_minutes: number
          sessions: number
        }[]
      }
      get_weekly_league: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
          weekly_points: number
        }[]
      }
      grant_ad_free_time: {
        Args: { hours_to_add?: number; target_user_id: string }
        Returns: undefined
      }
      grant_registration_trial: {
        Args: { p_user_id: string }
        Returns: {
          current_period_end: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      increment_follower_conversion: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_game_seconds: {
        Args: { p_date: string; p_seconds: number; p_user_id: string }
        Returns: undefined
      }
      increment_user_quiz_play_count: {
        Args: { p_quiz_id: string }
        Returns: undefined
      }
      is_active_guardian_of: {
        Args: { target_guardian_id?: string; target_student_id: string }
        Returns: boolean
      }
      is_sponsored_ad_active: {
        Args: {
          target_post: Database["public"]["Tables"]["social_posts"]["Row"]
        }
        Returns: boolean
      }
      is_teacher_campaign_sponsored_active: {
        Args: {
          target_campaign: Database["public"]["Tables"]["teacher_campaigns"]["Row"]
        }
        Returns: boolean
      }
      is_user_ad_free: { Args: { target_user_id: string }; Returns: boolean }
      is_user_subscriber: { Args: { target_user_id: string }; Returns: boolean }
      join_class_group:
        | {
            Args: {
              p_child_profile_id?: string
              p_city: string
              p_district: string
              p_grade_level: string
              p_school_name: string
            }
            Returns: {
              city: string
              classroom: string
              created_at: string
              district: string
              grade_level: string
              group_name: string
              id: string
              school_name: string
            }
            SetofOptions: {
              from: "*"
              to: "class_groups"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_child_profile_id?: string
              p_city: string
              p_classroom?: string
              p_district: string
              p_grade_level: string
              p_school_name: string
            }
            Returns: {
              city: string
              classroom: string
              created_at: string
              district: string
              grade_level: string
              group_name: string
              id: string
              school_name: string
            }
            SetofOptions: {
              from: "*"
              to: "class_groups"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      leave_class_group: {
        Args: { p_child_profile_id?: string; p_group_id: string }
        Returns: boolean
      }
      lesson_package_booking_gating_removed: { Args: never; Returns: boolean }
      lesson_package_lessons_for_plan: {
        Args: { plan: Database["public"]["Enums"]["lesson_package_plan_type"] }
        Returns: number
      }
      list_explore_social_posts: {
        Args: { p_limit?: number; p_query?: string }
        Returns: Json
      }
      list_sponsored_teacher_campaigns: {
        Args: { limit_count?: number; placement_key?: string }
        Returns: {
          click_count: number
          cover_image_url: string
          headline: string
          is_sponsored_active: boolean
          sponsored_expires_at: string
          sponsored_package_days: number
          sponsored_targeting: Json
          tagline: string
          teacher_id: string
          teacher_name: string
          teacher_verified: boolean
          updated_at: string
          view_count: number
        }[]
      }
      list_teacher_sponsored_ads: {
        Args: { limit_count?: number }
        Returns: {
          caption: string
          created_at: string
          post_id: string
          sponsored_click_count: number
          sponsored_expires_at: string
          sponsored_label: string
          sponsored_status: string
        }[]
      }
      mark_lesson_request_thread_read: {
        Args: { for_user_id?: string; target_request_id: string }
        Returns: number
      }
      moderate_private_lesson_post: {
        Args: { next_status: string; note?: string; target_post_id: string }
        Returns: undefined
      }
      normalize_moderation_text: {
        Args: { input_text: string }
        Returns: string
      }
      notify_lesson_booking_confirmed: {
        Args: { target_booking_id: string }
        Returns: undefined
      }
      open_payment_dispute: {
        Args: { dispute_reason: string; target_booking_id: string }
        Returns: {
          booking_id: string
          created_at: string
          id: string
          opened_by: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["payment_dispute_status"]
        }
        SetofOptions: {
          from: "*"
          to: "payment_disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      parent_has_active_lesson_package: {
        Args: { for_parent_id: string }
        Returns: boolean
      }
      parent_owns_child: {
        Args: { p_child_profile_id: string; p_parent_id: string }
        Returns: boolean
      }
      parent_review_study_group_approval: {
        Args: { p_approval_id: string; p_decision: string }
        Returns: {
          created_at: string
          group_id: string
          id: string
          kind: Database["public"]["Enums"]["study_group_approval_kind"]
          note: string | null
          parent_user_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["study_group_approval_status"]
          student_user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "study_group_approvals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      parent_update_store_redemption_status: {
        Args: {
          next_status: Database["public"]["Enums"]["store_redemption_status"]
          target_redemption_id: string
        }
        Returns: {
          child_profile_id: string | null
          created_at: string
          id: string
          note: string | null
          points_spent: number
          product_id: string
          status: Database["public"]["Enums"]["store_redemption_status"]
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "store_redemptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_lesson_reminders: {
        Args: { window_minutes?: number }
        Returns: number
      }
      recompute_teacher_stats: {
        Args: { target_teacher_id: string }
        Returns: {
          avg_response_minutes: number
          stats_computed_at: string
          teacher_id: string
          total_lessons: number
          total_students: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_google_play_purchase: {
        Args: {
          p_expiry_time?: string
          p_order_id?: string
          p_package_name?: string
          p_plan_id: string
          p_product_id: string
          p_purchase_token: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          expiry_time: string | null
          id: string
          order_id: string | null
          package_name: string
          plan_id: string
          product_id: string
          purchase_token: string
          user_id: string
          verified_at: string
        }
        SetofOptions: {
          from: "*"
          to: "google_play_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_moderation_violation: {
        Args: {
          p_content_kind: string
          p_content_preview: string
          p_matched_term?: string
          p_reason: string
        }
        Returns: Json
      }
      record_reputation_event: {
        Args: {
          event_actor_id?: string
          event_delta: number
          event_kind: Database["public"]["Enums"]["reputation_event_kind"]
          event_note?: string
          event_reference_id?: string
          target_user_id: string
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_store_visit_mission: {
        Args: never
        Returns: {
          already_recorded: boolean
          recorded: boolean
        }[]
      }
      record_student_subject_success: {
        Args: {
          lesson_progress_score: number
          target_area_id: number
          target_child_profile_id: string
          target_student_user_id: string
        }
        Returns: {
          area_id: number
          child_profile_id: string | null
          completed_lessons: number
          id: string
          student_user_id: string | null
          success_score: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "student_subject_success"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_teacher_campaign_click: {
        Args: { target_teacher_id: string }
        Returns: string
      }
      record_teacher_campaign_view: {
        Args: { target_teacher_id: string }
        Returns: undefined
      }
      redeem_child_store_product: {
        Args: {
          redemption_note?: string
          target_child_profile_id: string
          target_product_id: string
        }
        Returns: {
          child_profile_id: string | null
          created_at: string
          id: string
          note: string | null
          points_spent: number
          product_id: string
          status: Database["public"]["Enums"]["store_redemption_status"]
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "store_redemptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_invite_code: {
        Args: { raw_code: string; redeemer?: string }
        Returns: string
      }
      redeem_store_product: {
        Args: { redemption_note?: string; target_product_id: string }
        Returns: {
          child_profile_id: string | null
          created_at: string
          id: string
          note: string | null
          points_spent: number
          product_id: string
          status: Database["public"]["Enums"]["store_redemption_status"]
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "store_redemptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_student_leaderboard: { Args: never; Returns: undefined }
      refresh_teacher_leaderboard: { Args: never; Returns: undefined }
      reject_role_change_request: {
        Args: { note?: string; request_id: string }
        Returns: undefined
      }
      request_account_deletion: {
        Args: { p_reason?: string }
        Returns: {
          id: string
          reason: string | null
          requested_at: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "account_deletion_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_role_change: {
        Args: {
          next_organization_type?: string
          next_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          created_at: string
          fee_amount: number
          fee_paid: boolean
          id: string
          old_role: string
          reason: string | null
          requested_organization_type: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "role_change_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_study_group_join: {
        Args: { p_group_id: string; p_parent_email: string }
        Returns: {
          created_at: string
          group_id: string
          id: string
          kind: Database["public"]["Enums"]["study_group_approval_kind"]
          note: string | null
          parent_user_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["study_group_approval_status"]
          student_user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "study_group_approvals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_bank_transfer_request: {
        Args: {
          p_admin_note?: string
          p_period_end?: string
          p_request_id: string
          p_status: Database["public"]["Enums"]["bank_transfer_request_status"]
        }
        Returns: {
          admin_note: string | null
          amount_try: number
          created_at: string
          id: string
          period_end: string | null
          plan_id: string
          receipt_storage_path: string | null
          reference_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["bank_transfer_request_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bank_transfer_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_student_document: {
        Args: {
          next_status: Database["public"]["Enums"]["student_document_status"]
          target_student_id: string
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_family_student_link: {
        Args: { target_link_id: string }
        Returns: undefined
      }
      send_study_group_message: {
        Args: { p_content: string; p_group_id: string }
        Returns: {
          content: string
          created_at: string
          group_id: string
          id: string
          sender_id: string
        }
        SetofOptions: {
          from: "*"
          to: "study_group_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_child_profile_interests: {
        Args: { area_ids: number[]; target_child_profile_id: string }
        Returns: undefined
      }
      set_teacher_expertise_matrix: {
        Args: { track_slugs: string[] }
        Returns: {
          review_boost_score: number
          selected_at: string
          teacher_id: string
          track_slug: string
        }[]
        SetofOptions: {
          from: "*"
          to: "teacher_expertise_selections"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      set_user_interests: { Args: { area_ids: number[] }; Returns: undefined }
      set_user_organization_type: {
        Args: { target_type: string }
        Returns: undefined
      }
      set_user_subscription_tier: {
        Args: {
          p_current_period_end?: string
          p_stripe_customer_id?: string
          p_stripe_subscription_id?: string
          p_tier: Database["public"]["Enums"]["subscription_tier"]
          p_user_id: string
        }
        Returns: {
          current_period_end: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      share_study_moment: {
        Args: { p_caption?: string; p_session_id: string }
        Returns: {
          area_id: number
          caption: string | null
          created_at: string
          duration_minutes: number
          id: string
          session_id: string
          topic_label: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "study_moments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      social_post_matches_current_user: {
        Args: { p_post_id: string }
        Returns: boolean
      }
      social_post_requires_teacher_creator_plus: {
        Args: {
          target_post: Database["public"]["Tables"]["social_posts"]["Row"]
        }
        Returns: boolean
      }
      start_focus_session: {
        Args: {
          p_area_id?: number
          p_child_profile_id?: string
          p_target_seconds?: number
          p_topic_label?: string
        }
        Returns: {
          area_id: number | null
          child_profile_id: string | null
          completed_at: string | null
          id: string
          points_awarded: number
          started_at: string
          status: string
          target_seconds: number
          topic_label: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "focus_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      story_matches_current_user: {
        Args: { p_story_id: string }
        Returns: boolean
      }
      submit_child_quiz_attempt: {
        Args: {
          selected_option: number
          target_child_profile_id: string
          target_quiz_id: string
        }
        Returns: {
          child_profile_id: string | null
          completed_at: string | null
          correct_answers: number
          created_at: string
          id: string
          is_correct: boolean
          points_awarded: number
          quiz_id: string
          score_percent: number
          selected_option: number | null
          total_questions: number
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quiz_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_child_quiz_attempt_full: {
        Args: {
          answer_payload: Json
          target_child_profile_id: string
          target_quiz_id: string
        }
        Returns: {
          child_profile_id: string | null
          completed_at: string | null
          correct_answers: number
          created_at: string
          id: string
          is_correct: boolean
          points_awarded: number
          quiz_id: string
          score_percent: number
          selected_option: number | null
          total_questions: number
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quiz_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_quiz_attempt: {
        Args: { selected_option: number; target_quiz_id: string }
        Returns: {
          child_profile_id: string | null
          completed_at: string | null
          correct_answers: number
          created_at: string
          id: string
          is_correct: boolean
          points_awarded: number
          quiz_id: string
          score_percent: number
          selected_option: number | null
          total_questions: number
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quiz_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_quiz_attempt_full: {
        Args: { answer_payload: Json; target_quiz_id: string }
        Returns: {
          child_profile_id: string | null
          completed_at: string | null
          correct_answers: number
          created_at: string
          id: string
          is_correct: boolean
          points_awarded: number
          quiz_id: string
          score_percent: number
          selected_option: number | null
          total_questions: number
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quiz_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_student_document: {
        Args: { document_url: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sync_quiz_feed_post: {
        Args: { target_quiz_id: string }
        Returns: {
          area_id: number | null
          author_id: string
          caption: string
          city: string | null
          co_author_id: string | null
          comments_count: number
          content: string | null
          created_at: string
          district: string | null
          external_url: string | null
          follower_conversion_count: number
          followers_only: boolean
          followers_only_comments: boolean
          id: string
          is_discoverable: boolean
          is_reel: boolean
          legacy_post_id: string | null
          likes_count: number
          location_name: string | null
          media_type: string
          media_url: string | null
          post_type: Database["public"]["Enums"]["content_post_type"]
          premium_prep_label: string | null
          premium_prep_url: string | null
          quiz_id: string | null
          saves_count: number
          shares_count: number
          sponsored_click_count: number
          sponsored_disclosure: string | null
          sponsored_expires_at: string | null
          sponsored_label: string | null
          sponsored_status: string | null
          sponsored_target_url: string | null
          target_audience: string
          target_grade: string | null
          teaser_text: string | null
          title: string | null
        }
        SetofOptions: {
          from: "*"
          to: "social_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sync_quiz_questions_for_quiz: {
        Args: { target_quiz_id: string }
        Returns: undefined
      }
      teacher_campaign_matches_sponsored_targeting: {
        Args: {
          campaign: Database["public"]["Tables"]["teacher_campaigns"]["Row"]
          viewer_id: string
        }
        Returns: boolean
      }
      teacher_campaign_matches_viewer: {
        Args: { target_teacher_id: string }
        Returns: boolean
      }
      teacher_campaign_visible_for_viewer: {
        Args: { placement_key?: string; target_teacher_id: string }
        Returns: boolean
      }
      teacher_has_approved_credentials: {
        Args: { target_teacher_id: string }
        Returns: boolean
      }
      teacher_shares_area_with_parent: {
        Args: {
          parent_user_id: string
          target_area_id?: number
          teacher_user_id: string
        }
        Returns: boolean
      }
      update_avatar_assets: {
        Args: { assets: Json; student_id: string }
        Returns: {
          avatar_assets: Json
          id: string
        }[]
      }
      update_child_avatar_assets: {
        Args: { assets: Json; target_child_profile_id: string }
        Returns: {
          avatar_assets: Json
          id: string
        }[]
      }
      update_child_grade_level: {
        Args: { next_grade_level: string; target_child_profile_id: string }
        Returns: {
          age_group: string | null
          avatar_assets: Json
          city: string | null
          classroom: string | null
          created_at: string
          display_name: string
          district: string | null
          grade_level: string | null
          id: string
          parent_id: string
          school_name: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "child_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_own_account_kind: {
        Args: {
          next_organization_type?: string
          next_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_store_product_stock: {
        Args: { next_stock_count: number; target_product_id: string }
        Returns: {
          category: Database["public"]["Enums"]["store_product_category"]
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_points: number
          requires_parent_approval: boolean
          stock_count: number | null
        }
        SetofOptions: {
          from: "*"
          to: "store_products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_store_redemption_status: {
        Args: {
          next_status: Database["public"]["Enums"]["store_redemption_status"]
          target_redemption_id: string
        }
        Returns: {
          child_profile_id: string | null
          created_at: string
          id: string
          note: string | null
          points_spent: number
          product_id: string
          status: Database["public"]["Enums"]["store_redemption_status"]
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "store_redemptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_grade_level: {
        Args: { next_grade_level: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_profile: {
        Args: {
          next_avatar_url?: string
          next_bio?: string
          next_full_name?: string
          next_instagram_url?: string
          next_website_url?: string
          next_youtube_url?: string
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_shortcut_preferences: {
        Args: { next_preferences: Json }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_streak: { Args: never; Returns: Json }
      upgrade_to_premium: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      upsert_education_platform_profile_extras:
        | {
            Args: {
              next_contact_summary?: string
              next_content_count?: number
              next_integration_docs_url?: string
              next_response_time_minutes?: number
              next_subscription_model?: string
              next_user_base_size?: number
            }
            Returns: {
              availability_note: string | null
              availability_status:
                | Database["public"]["Enums"]["profile_availability_status"]
                | null
              badge_type:
                | Database["public"]["Enums"]["professional_badge_type"]
                | null
              contact_summary: string | null
              content_count: number
              details: Json
              integration_docs_url: string | null
              response_time_minutes: number | null
              soft_skills: string[]
              subscription_model: string
              updated_at: string
              user_base_size: number
              user_id: string
              video_intro_url: string | null
            }
            SetofOptions: {
              from: "*"
              to: "education_platform_profile_extras"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              next_availability_note?: string
              next_availability_status?: Database["public"]["Enums"]["profile_availability_status"]
              next_badge_type?: Database["public"]["Enums"]["professional_badge_type"]
              next_contact_summary?: string
              next_content_count?: number
              next_details?: Json
              next_integration_docs_url?: string
              next_response_time_minutes?: number
              next_soft_skills?: string[]
              next_subscription_model?: string
              next_user_base_size?: number
              next_video_intro_url?: string
            }
            Returns: {
              availability_note: string | null
              availability_status:
                | Database["public"]["Enums"]["profile_availability_status"]
                | null
              badge_type:
                | Database["public"]["Enums"]["professional_badge_type"]
                | null
              contact_summary: string | null
              content_count: number
              details: Json
              integration_docs_url: string | null
              response_time_minutes: number | null
              soft_skills: string[]
              subscription_model: string
              updated_at: string
              user_base_size: number
              user_id: string
              video_intro_url: string | null
            }
            SetofOptions: {
              from: "*"
              to: "education_platform_profile_extras"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      upsert_institution_profile_extras:
        | {
            Args: {
              next_accreditation?: string[]
              next_branch_count?: number
              next_capacity?: number
              next_contact_summary?: string
              next_license_number: string
              next_response_time_minutes?: number
              next_services?: string[]
            }
            Returns: {
              accreditation: string[]
              availability_note: string | null
              availability_status:
                | Database["public"]["Enums"]["profile_availability_status"]
                | null
              badge_type:
                | Database["public"]["Enums"]["professional_badge_type"]
                | null
              branch_count: number
              capacity: number
              contact_summary: string | null
              details: Json
              license_number: string
              response_time_minutes: number | null
              services: string[]
              soft_skills: string[]
              updated_at: string
              user_id: string
              video_intro_url: string | null
            }
            SetofOptions: {
              from: "*"
              to: "institution_profile_extras"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              next_accreditation?: string[]
              next_availability_note?: string
              next_availability_status?: Database["public"]["Enums"]["profile_availability_status"]
              next_badge_type?: Database["public"]["Enums"]["professional_badge_type"]
              next_branch_count?: number
              next_capacity?: number
              next_contact_summary?: string
              next_details?: Json
              next_license_number: string
              next_response_time_minutes?: number
              next_services?: string[]
              next_soft_skills?: string[]
              next_video_intro_url?: string
            }
            Returns: {
              accreditation: string[]
              availability_note: string | null
              availability_status:
                | Database["public"]["Enums"]["profile_availability_status"]
                | null
              badge_type:
                | Database["public"]["Enums"]["professional_badge_type"]
                | null
              branch_count: number
              capacity: number
              contact_summary: string | null
              details: Json
              license_number: string
              response_time_minutes: number | null
              services: string[]
              soft_skills: string[]
              updated_at: string
              user_id: string
              video_intro_url: string | null
            }
            SetofOptions: {
              from: "*"
              to: "institution_profile_extras"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      upsert_study_plan: {
        Args: {
          p_area_id?: number
          p_primary_topic?: string
          p_weekly_pomodoro_goal?: number
        }
        Returns: {
          area_id: number | null
          id: string
          is_active: boolean
          primary_topic: string
          updated_at: string
          user_id: string
          weekly_pomodoro_goal: number
        }
        SetofOptions: {
          from: "*"
          to: "study_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_teacher_campaign: {
        Args: {
          next_cover_image_url?: string
          next_cta_label?: string
          next_cta_url?: string
          next_headline: string
          next_is_published?: boolean
          next_is_sponsored?: boolean
          next_pitch?: string
          next_sponsored_package_days?: number
          next_sponsored_targeting?: Json
          next_tagline?: string
        }
        Returns: {
          click_count: number
          cover_image_url: string | null
          created_at: string
          cta_label: string
          cta_url: string | null
          headline: string
          id: string
          is_published: boolean
          is_sponsored: boolean
          pitch: string | null
          sponsored_disclosure: string
          sponsored_expires_at: string | null
          sponsored_package_days: number | null
          sponsored_status: string | null
          sponsored_targeting: Json | null
          tagline: string | null
          teacher_id: string
          updated_at: string
          view_count: number
        }
        SetofOptions: {
          from: "*"
          to: "teacher_campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_teacher_profile_extras:
        | {
            Args: {
              next_contact_summary?: string
              next_cv_url?: string
              next_education_degree?: Database["public"]["Enums"]["education_degree_type"]
              next_hourly_rate?: number
              next_lesson_acceptance_rate_percent?: number
              next_response_time_minutes?: number
              next_teaching_style?: Database["public"]["Enums"]["teaching_style_type"]
              next_years_of_experience?: number
            }
            Returns: {
              availability_note: string | null
              availability_status:
                | Database["public"]["Enums"]["profile_availability_status"]
                | null
              badge_type:
                | Database["public"]["Enums"]["professional_badge_type"]
                | null
              contact_summary: string | null
              cv_url: string | null
              details: Json
              education_degree:
                | Database["public"]["Enums"]["education_degree_type"]
                | null
              hourly_rate: number | null
              lesson_acceptance_rate_percent: number | null
              response_time_minutes: number | null
              soft_skills: string[]
              teaching_style:
                | Database["public"]["Enums"]["teaching_style_type"]
                | null
              updated_at: string
              user_id: string
              video_intro_url: string | null
              years_of_experience: number
            }
            SetofOptions: {
              from: "*"
              to: "teacher_profile_extras"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              next_availability_note?: string
              next_availability_status?: Database["public"]["Enums"]["profile_availability_status"]
              next_badge_type?: Database["public"]["Enums"]["professional_badge_type"]
              next_contact_summary?: string
              next_cv_url?: string
              next_details?: Json
              next_education_degree?: Database["public"]["Enums"]["education_degree_type"]
              next_hourly_rate?: number
              next_lesson_acceptance_rate_percent?: number
              next_response_time_minutes?: number
              next_soft_skills?: string[]
              next_teaching_style?: Database["public"]["Enums"]["teaching_style_type"]
              next_video_intro_url?: string
              next_years_of_experience?: number
            }
            Returns: {
              availability_note: string | null
              availability_status:
                | Database["public"]["Enums"]["profile_availability_status"]
                | null
              badge_type:
                | Database["public"]["Enums"]["professional_badge_type"]
                | null
              contact_summary: string | null
              cv_url: string | null
              details: Json
              education_degree:
                | Database["public"]["Enums"]["education_degree_type"]
                | null
              hourly_rate: number | null
              lesson_acceptance_rate_percent: number | null
              response_time_minutes: number | null
              soft_skills: string[]
              teaching_style:
                | Database["public"]["Enums"]["teaching_style_type"]
                | null
              updated_at: string
              user_id: string
              video_intro_url: string | null
              years_of_experience: number
            }
            SetofOptions: {
              from: "*"
              to: "teacher_profile_extras"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      user_has_active_entitlement: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      user_is_active_study_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      user_is_verified_teacher: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      user_participates_in_lesson_request: {
        Args: { target_request_id: string }
        Returns: boolean
      }
      users_are_blocked: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      verify_teacher: {
        Args: { target_teacher_id: string; verified: boolean }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_user: {
        Args: { target_user_id: string; verified: boolean }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          game_xp_day: string | null
          game_xp_today: number
          grade_level: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean
          last_active_date: string | null
          last_game_xp_at: string | null
          level: number
          organization_type: string | null
          reputation_score: number
          role: Database["public"]["Enums"]["user_role"]
          role_selection_completed: boolean
          school_name: string | null
          shortcut_preferences: Json
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          streak_days: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
          website_url: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      viewer_grade_bands_for_user: {
        Args: { target_user_id: string }
        Returns: string[]
      }
      watch_ad_for_reward: {
        Args: { hours_to_grant?: number; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "limited" | "closed"
      bank_transfer_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
      booking_status: "booked" | "completed" | "cancelled"
      content_post_type: "normal" | "quiz" | "micro"
      education_degree_type: "lisans" | "yuksek_lisans" | "doktora"
      exam_goal_type: "lgs" | "yks" | "general"
      lesson_package_plan_type: "basic" | "pro" | "premium"
      lesson_package_status: "pending" | "active" | "expired" | "canceled"
      lesson_payment_status:
        | "pending"
        | "parent_confirmed"
        | "teacher_confirmed"
        | "payment_confirmed"
        | "disputed"
      lesson_request_priority: "normal" | "urgent"
      lesson_request_status: "pending" | "accepted" | "rejected" | "closed"
      live_lesson_status: "scheduled" | "live" | "completed" | "canceled"
      payment_dispute_status:
        | "open"
        | "reviewing"
        | "resolved_parent"
        | "resolved_teacher"
        | "closed"
      professional_badge_type: "gold" | "platinum" | "verified"
      profile_availability_status: "available" | "busy" | "scheduled"
      reputation_event_kind:
        | "lesson_completed"
        | "positive_feedback"
        | "prompt_answer"
      store_product_category:
        | "stationery"
        | "book"
        | "question_bank"
        | "digital_avatar"
        | "experience"
      store_redemption_status:
        | "pending_parent_approval"
        | "approved"
        | "fulfilled"
        | "cancelled"
      student_document_status: "pending" | "approved" | "rejected"
      study_group_approval_kind: "create_group" | "join_group"
      study_group_approval_status: "pending" | "approved" | "rejected"
      study_group_status: "pending_parent" | "active" | "closed"
      study_room_status: "active" | "closed"
      study_room_type: "voice" | "silent"
      subscription_tier: "free" | "zigo_plus"
      teacher_credential_status: "pending" | "approved" | "rejected"
      teacher_credential_type: "diploma" | "e_devlet"
      teaching_style_type: "visual" | "practical" | "theory"
      user_role: "teacher" | "parent" | "student" | "platform" | "education_institution" | "education_platform" | "publisher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended", "limited", "closed"],
      bank_transfer_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
      ],
      booking_status: ["booked", "completed", "cancelled"],
      content_post_type: ["normal", "quiz", "micro"],
      education_degree_type: ["lisans", "yuksek_lisans", "doktora"],
      exam_goal_type: ["lgs", "yks", "general"],
      lesson_package_plan_type: ["basic", "pro", "premium"],
      lesson_package_status: ["pending", "active", "expired", "canceled"],
      lesson_payment_status: [
        "pending",
        "parent_confirmed",
        "teacher_confirmed",
        "payment_confirmed",
        "disputed",
      ],
      lesson_request_priority: ["normal", "urgent"],
      lesson_request_status: ["pending", "accepted", "rejected", "closed"],
      live_lesson_status: ["scheduled", "live", "completed", "canceled"],
      payment_dispute_status: [
        "open",
        "reviewing",
        "resolved_parent",
        "resolved_teacher",
        "closed",
      ],
      professional_badge_type: ["gold", "platinum", "verified"],
      profile_availability_status: ["available", "busy", "scheduled"],
      reputation_event_kind: [
        "lesson_completed",
        "positive_feedback",
        "prompt_answer",
      ],
      store_product_category: [
        "stationery",
        "book",
        "question_bank",
        "digital_avatar",
        "experience",
      ],
      store_redemption_status: [
        "pending_parent_approval",
        "approved",
        "fulfilled",
        "cancelled",
      ],
      student_document_status: ["pending", "approved", "rejected"],
      study_group_approval_kind: ["create_group", "join_group"],
      study_group_approval_status: ["pending", "approved", "rejected"],
      study_group_status: ["pending_parent", "active", "closed"],
      study_room_status: ["active", "closed"],
      study_room_type: ["voice", "silent"],
      subscription_tier: ["free", "zigo_plus"],
      teacher_credential_status: ["pending", "approved", "rejected"],
      teacher_credential_type: ["diploma", "e_devlet"],
      teaching_style_type: ["visual", "practical", "theory"],
      user_role: ["teacher", "parent", "student", "platform", "education_institution", "education_platform", "publisher"],
    },
  },
} as const


// =============================================================================
// Custom helper type aliases (derived from generated Database types)
// These are convenience exports used throughout the codebase.
// =============================================================================

export type UserRole = Database["public"]["Enums"]["user_role"];
export type AccountStatus = Database["public"]["Enums"]["account_status"];
export type SubscriptionTier = Database["public"]["Enums"]["subscription_tier"];
export type ContentReportStatus = string; // content_reports has no enum; status is text
export type ContentPostType = Database["public"]["Enums"]["content_post_type"];
export type StoreRedemptionStatus = Database["public"]["Enums"]["store_redemption_status"];
export type BankTransferRequestStatus = Database["public"]["Enums"]["bank_transfer_request_status"];

// Row type shortcuts
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type SocialPostRow = Database["public"]["Tables"]["social_posts"]["Row"] & {
  /** Runtime-only client-side field; not stored in DB (use is_discoverable for visibility control). */
  is_hidden?: boolean;
};

// View row types (generated as Tables but are actually Views)
export type TeacherCampaignRow = Database["public"]["Tables"]["teacher_campaigns"]["Row"] & {
  teacher_name?: string | null;
  full_name?: string | null;
  teacher_verified?: boolean | null;
};
export type TeacherCampaignView = TeacherCampaignRow;
export type SponsoredTeacherCampaignSummary = TeacherCampaignRow;

// Additional Row type shortcuts (auto-generated from DB tables)
export type ClassGroupRow = Database["public"]["Tables"]["class_groups"]["Row"];
export type LearningEventRow = Database["public"]["Tables"]["learning_events"]["Row"];
export type EducationAreaRow = Database["public"]["Tables"]["education_areas"]["Row"];
export type ContentReportRow = Database["public"]["Tables"]["content_reports"]["Row"];
export type StudentDocumentStatus = Database["public"]["Enums"]["student_document_status"];
export type PostCommentRow = Database["public"]["Tables"]["post_comments"]["Row"];
export type StoryReplyRow = Database["public"]["Tables"]["story_replies"]["Row"];
export type BankTransferRequestRow = Database["public"]["Tables"]["bank_transfer_requests"]["Row"];
export type ChildProfileRow = Database["public"]["Tables"]["child_profiles"]["Row"];
export type StoreProductRow = Database["public"]["Tables"]["store_products"]["Row"];
export type PublicQuizRow = Omit<Database["public"]["Tables"]["quizzes"]["Row"], "correct_option" | "is_active" | "teacher_id"> & {
  correct_option?: number;
  is_active?: boolean;
  teacher_id?: string;
  question_count?: number;
};

export type QuizQuestionForPlay = {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index?: number;
  sort_order?: number;
  explanation?: string | null;
};

export type AvatarAssets = {
  avatar?: string;
  badge?: string;
  frame?: string;
  banner?: string;
  background?: string;
  title?: string;
  [key: string]: unknown;
};

export type ModerationAdminAlertRow = {
  id: string;
  target_id: string;
  target_type: string;
  reason: string;
  reporter_id?: string | null;
  created_at: string;
  status: string;
  [key: string]: unknown;
};

export type SocialMediaType = "image" | "video" | "carousel" | "audio" | "document";
