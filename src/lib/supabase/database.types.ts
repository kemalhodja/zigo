export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_billing_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
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
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          area_id: number | null
          author_id: string
          caption: string
          co_author_id: string | null
          content: string | null
          created_at: string
          external_url: string | null
          id: string
          is_reel: boolean
          legacy_post_id: string | null
          media_type: string
          media_url: string | null
          post_type: Database["public"]["Enums"]["content_post_type"]
          premium_prep_label: string | null
          premium_prep_url: string | null
          quiz_id: string | null
          sponsored_click_count: number
          sponsored_disclosure: string | null
          sponsored_expires_at: string | null
          sponsored_label: string | null
          sponsored_status: string | null
          sponsored_target_url: string | null
          target_audience: string
          target_grade: string | null
          title: string | null
        }
        Insert: {
          area_id?: number | null
          author_id: string
          caption: string
          co_author_id?: string | null
          content?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          is_reel?: boolean
          legacy_post_id?: string | null
          media_type?: string
          media_url?: string | null
          post_type?: Database["public"]["Enums"]["content_post_type"]
          premium_prep_label?: string | null
          premium_prep_url?: string | null
          quiz_id?: string | null
          sponsored_click_count?: number
          sponsored_disclosure?: string | null
          sponsored_expires_at?: string | null
          sponsored_label?: string | null
          sponsored_status?: string | null
          sponsored_target_url?: string | null
          target_audience?: string
          target_grade?: string | null
          title?: string | null
        }
        Update: {
          area_id?: number | null
          author_id?: string
          caption?: string
          co_author_id?: string | null
          content?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          is_reel?: boolean
          legacy_post_id?: string | null
          media_type?: string
          media_url?: string | null
          post_type?: Database["public"]["Enums"]["content_post_type"]
          premium_prep_label?: string | null
          premium_prep_url?: string | null
          quiz_id?: string | null
          sponsored_click_count?: number
          sponsored_disclosure?: string | null
          sponsored_expires_at?: string | null
          sponsored_label?: string | null
          sponsored_status?: string | null
          sponsored_target_url?: string | null
          target_audience?: string
          target_grade?: string | null
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
            referencedRelation: "users"
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
            foreignKeyName: "sponsored_ad_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          id: string
          media_url: string | null
        }
        Insert: {
          area_id?: number | null
          author_id: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_url?: string | null
        }
        Update: {
          area_id?: number | null
          author_id?: string
          caption?: string | null
          created_at?: string
          expires_at?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: []
      }
      teacher_campaigns: {
        Row: {
          id: string
          teacher_id: string
          headline: string | null
          tagline: string | null
          pitch: string | null
          cta_label: string | null
          cta_url: string | null
          cover_image_url: string | null
          is_published: boolean
          is_sponsored: boolean
          sponsored_status: string
          sponsored_package_days: number | null
          sponsored_expires_at: string | null
          package_duration_days: number
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          headline?: string | null
          tagline?: string | null
          pitch?: string | null
          cta_label?: string | null
          cta_url?: string | null
          cover_image_url?: string | null
          is_published?: boolean
          is_sponsored?: boolean
          sponsored_status?: string
          sponsored_package_days?: number | null
          sponsored_expires_at?: string | null
          package_duration_days?: number
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          headline?: string | null
          tagline?: string | null
          pitch?: string | null
          cta_label?: string | null
          cta_url?: string | null
          cover_image_url?: string | null
          is_published?: boolean
          is_sponsored?: boolean
          sponsored_status?: string
          sponsored_package_days?: number | null
          sponsored_expires_at?: string | null
          package_duration_days?: number
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          current_period_end: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          ad_free_until?: string | null
          avatar_assets?: Json
          avatar_url?: string | null
          bio?: string | null
          classroom?: string | null
          created_at?: string
          district?: string | null
          email: string
          full_name: string
          grade_level?: string | null
          id: string
          is_premium?: boolean | null
          is_verified?: boolean
          level?: number
          organization_type?: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name?: string | null
          social_interactions_blocked?: boolean
          social_interactions_blocked_at?: string | null
          social_safety_strike_count?: number
          student_document_reviewed_at?: string | null
          student_document_reviewed_by?: string | null
          student_document_status?:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at?: string | null
          student_document_url?: string | null
          total_points?: number
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          ad_free_until?: string | null
          avatar_assets?: Json
          avatar_url?: string | null
          bio?: string | null
          classroom?: string | null
          created_at?: string
          district?: string | null
          email?: string
          full_name?: string
          grade_level?: string | null
          id?: string
          is_premium?: boolean | null
          is_verified?: boolean
          level?: number
          organization_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_name?: string | null
          social_interactions_blocked?: boolean
          social_interactions_blocked_at?: string | null
          social_safety_strike_count?: number
          student_document_reviewed_at?: string | null
          student_document_reviewed_by?: string | null
          student_document_status?:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at?: string | null
          student_document_url?: string | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "users_student_document_reviewed_by_fkey"
            columns: ["student_document_reviewed_by"]
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
            foreignKeyName: "video_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Functions: {
      list_explore_social_posts: {
        Args: {
          p_limit?: number
          p_query?: string
        }
        Returns: Json
      }
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
      approve_answer: { Args: { answer_id: string }; Returns: undefined }
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
      award_child_learning_points: {
        Args: { action_kind: string; target_child_profile_id: string }
        Returns: {
          id: string
          total_points: number
        }[]
      }
      award_learning_points: {
        Args: { action_kind: string; student_id: string }
        Returns: {
          id: string
          total_points: number
        }[]
      }
      award_safe_duel_win_points:
        | {
        Args: {
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
        | {
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
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "users"
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
      export_user_data: { Args: never; Returns: Json }
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
      is_sponsored_ad_active: {
        Args: {
          target_post: Database["public"]["Tables"]["social_posts"]["Row"]
        }
        Returns: boolean
      }
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
      normalize_moderation_text: {
        Args: { input_text: string }
        Returns: string
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
      record_store_visit_mission: {
        Args: never
        Returns: {
          already_recorded: boolean
          recorded: boolean
        }[]
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
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_child_profile_interests: {
        Args: { area_ids: number[]; target_child_profile_id: string }
        Returns: undefined
      }
      set_user_interests: { Args: { area_ids: number[] }; Returns: undefined }
      set_user_organization_type: {
        Args: { target_type: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
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
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
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
          co_author_id: string | null
          content: string | null
          created_at: string
          external_url: string | null
          id: string
          is_reel: boolean
          legacy_post_id: string | null
          media_type: string
          media_url: string | null
          post_type: Database["public"]["Enums"]["content_post_type"]
          premium_prep_label: string | null
          premium_prep_url: string | null
          quiz_id: string | null
          sponsored_click_count: number
          sponsored_disclosure: string | null
          sponsored_expires_at: string | null
          sponsored_label: string | null
          sponsored_status: string | null
          sponsored_target_url: string | null
          target_audience: string
          target_grade: string | null
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
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
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
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
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
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          ad_free_until: string | null
          avatar_assets: Json
          avatar_url: string | null
          bio: string | null
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "users"
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
      user_is_verified_teacher: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      user_participates_in_lesson_request: {
        Args: { target_request_id: string }
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
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
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
          classroom: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          grade_level: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean
          level: number
          organization_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          social_interactions_blocked: boolean
          social_interactions_blocked_at: string | null
          social_safety_strike_count: number
          student_document_reviewed_at: string | null
          student_document_reviewed_by: string | null
          student_document_status:
            | Database["public"]["Enums"]["student_document_status"]
            | null
          student_document_submitted_at: string | null
          student_document_url: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "limited" | "closed"
      bank_transfer_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
      content_post_type: "normal" | "quiz" | "micro"
      lesson_request_status: "pending" | "accepted" | "rejected" | "closed"
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
      study_room_status: "active" | "closed"
      study_room_type: "voice" | "silent"
      subscription_tier: "free" | "zigo_plus"
      user_role: "teacher" | "parent" | "student"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "suspended", "limited", "closed"],
      bank_transfer_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
      ],
      content_post_type: ["normal", "quiz", "micro"],
      lesson_request_status: ["pending", "accepted", "rejected", "closed"],
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
      study_room_status: ["active", "closed"],
      study_room_type: ["voice", "silent"],
      subscription_tier: ["free", "zigo_plus"],
      user_role: ["teacher", "parent", "student"],
    },
  },
} as const;

export type UserRole =
  | "student"
  | "teacher"
  | "parent"
  | "education_institution"
  | "education_platform"
  | "publisher";

export type SubscriptionTier = "free" | "zigo_plus";
export type BankTransferRequestStatus = "pending" | "approved" | "rejected";
export type StoreRedemptionStatus = "pending" | "approved" | "fulfilled" | "rejected" | "cancelled" | "pending_parent_approval";
export type AccountStatus = "active" | "suspended" | "limited" | "closed";
export type StudentDocumentStatus = "none" | "pending" | "approved" | "rejected";
export type ContentReportStatus = "pending" | "reviewed" | "dismissed" | "action_taken" | "resolved" | "open" | "reviewing";
export type AvatarAssets = Record<string, unknown>;
export type BankTransferRequestRow = Record<string, unknown>;
export type PublicQuizRow = {
  id: string;
  title: string;
  question_count?: number | null;
  [key: string]: unknown;
};
export type QuizQuestionForPlay = Record<string, unknown>;

export type SocialPostRow = Database["public"]["Tables"]["social_posts"]["Row"];
export type StoryReplyRow = Database["public"]["Tables"]["story_replies"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type ContentReportRow = Database["public"]["Tables"]["content_reports"]["Row"];
export type EducationAreaRow = Database["public"]["Tables"]["education_areas"]["Row"];
export type ChildProfileRow = Database["public"]["Tables"]["child_profiles"]["Row"];
export type StoreProductRow = Database["public"]["Tables"]["store_products"]["Row"];
export type ClassGroupRow = Database["public"]["Tables"]["class_groups"]["Row"];
export type LearningEventRow = Database["public"]["Tables"]["learning_events"]["Row"];

export type ContentPostType = "normal" | "quiz" | "micro";
export type SocialMediaType = "image" | "video" | "audio" | "document" | "link" | "carousel";

export type ModerationAdminAlertRow = {
  id: string;
  post_id: string;
  reason: string;
  created_at: string;
};
export type PostCommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  moderation_status?: string | null;
};

export type TeacherCampaignRow = {
  id: string;
  teacher_id: string;
  headline?: string | null;
  tagline?: string | null;
  pitch?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean;
  is_sponsored?: boolean;
  sponsored_status?: string;
  sponsored_package_days?: number | null;
  sponsored_expires_at?: string | null;
  package_duration_days?: number;
  expires_at?: string | null;
  created_at?: string;
};
export type TeacherCampaignView = TeacherCampaignRow;
export type SponsoredTeacherCampaignSummary = {
  teacher_id: string;
  full_name?: string | null;
  teacher_name?: string | null;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  headline?: string | null;
  tagline?: string | null;
  pitch?: string | null;
  click_count?: number;
  view_count?: number;
  expires_at?: string | null;
  [key: string]: unknown;
};

