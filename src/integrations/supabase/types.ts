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
      ai_usage_logs: {
        Row: {
          cost_usd: number
          created_at: string
          endpoint: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          endpoint: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          cost_usd?: number
          created_at?: string
          endpoint?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          feature_key: string | null
          id: string
          metadata: Json
          path: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          feature_key?: string | null
          id?: string
          metadata?: Json
          path?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          feature_key?: string | null
          id?: string
          metadata?: Json
          path?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          anon_id: string
          country: string | null
          created_at: string
          duration_seconds: number
          entry_path: string | null
          event_count: number
          id: string
          last_seen_at: string
          page_views: number
          referrer: string | null
          started_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anon_id: string
          country?: string | null
          created_at?: string
          duration_seconds?: number
          entry_path?: string | null
          event_count?: number
          id?: string
          last_seen_at?: string
          page_views?: number
          referrer?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string
          country?: string | null
          created_at?: string
          duration_seconds?: number
          entry_path?: string | null
          event_count?: number
          id?: string
          last_seen_at?: string
          page_views?: number
          referrer?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string
          created_at: string
          id: string
          name: string
          section: string | null
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_code?: string
          created_at?: string
          id?: string
          name: string
          section?: string | null
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_code?: string
          created_at?: string
          id?: string
          name?: string
          section?: string | null
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      cq_grades: {
        Row: {
          ai_similarity_score: number | null
          attempt_id: string
          created_at: string
          graded_by: string | null
          id: string
          marks_awarded: number
          part: string
          question_id: string
          teacher_note: string | null
          updated_at: string
        }
        Insert: {
          ai_similarity_score?: number | null
          attempt_id: string
          created_at?: string
          graded_by?: string | null
          id?: string
          marks_awarded?: number
          part: string
          question_id: string
          teacher_note?: string | null
          updated_at?: string
        }
        Update: {
          ai_similarity_score?: number | null
          attempt_id?: string
          created_at?: string
          graded_by?: string | null
          id?: string
          marks_awarded?: number
          part?: string
          question_id?: string
          teacher_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cq_grades_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cq_grades_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          chapter: string | null
          chunk_index: number | null
          class: string
          content: string
          created_at: string
          embedding: string
          id: string
          metadata: Json
          page: number | null
          source: string
          subject: string
        }
        Insert: {
          chapter?: string | null
          chunk_index?: number | null
          class?: string
          content: string
          created_at?: string
          embedding: string
          id?: string
          metadata?: Json
          page?: number | null
          source?: string
          subject?: string
        }
        Update: {
          chapter?: string | null
          chunk_index?: number | null
          class?: string
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          metadata?: Json
          page?: number | null
          source?: string
          subject?: string
        }
        Relationships: []
      }
      lab_attempts: {
        Row: {
          accuracy: number
          created_at: string
          duration_sec: number
          experiment_id: string
          grade: string
          id: string
          mistakes_count: number
          mode: string
          report: Json
          steps_completed: number
          steps_total: number
          student_id: string
        }
        Insert: {
          accuracy?: number
          created_at?: string
          duration_sec?: number
          experiment_id: string
          grade?: string
          id?: string
          mistakes_count?: number
          mode?: string
          report?: Json
          steps_completed?: number
          steps_total?: number
          student_id: string
        }
        Update: {
          accuracy?: number
          created_at?: string
          duration_sec?: number
          experiment_id?: string
          grade?: string
          id?: string
          mistakes_count?: number
          mode?: string
          report?: Json
          steps_completed?: number
          steps_total?: number
          student_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          chapter_number: number
          content: string
          created_at: string
          id: string
          is_premium: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number: number
          content?: string
          created_at?: string
          id?: string
          is_premium?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          content?: string
          created_at?: string
          id?: string
          is_premium?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount_bdt: number
          created_at: string
          id: string
          method: string
          note: string | null
          plan_code: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_phone: string
          status: string
          trx_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_bdt: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          plan_code: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_phone: string
          status?: string
          trx_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_bdt?: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          plan_code?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_phone?: string
          status?: string
          trx_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          phone_verified_at: string | null
          role_selected: boolean
          school: string | null
          trial_used: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          class?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_verified_at?: string | null
          role_selected?: boolean
          school?: string | null
          trial_used?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          class?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_verified_at?: string | null
          role_selected?: boolean
          school?: string | null
          trial_used?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_sets: {
        Row: {
          chapter: string
          class_id: string | null
          created_at: string
          difficulty: string
          due_at: string | null
          id: string
          published_at: string | null
          question_type: string
          source_experiment: string | null
          status: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          chapter: string
          class_id?: string | null
          created_at?: string
          difficulty?: string
          due_at?: string | null
          id?: string
          published_at?: string | null
          question_type: string
          source_experiment?: string | null
          status?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          chapter?: string
          class_id?: string | null
          created_at?: string
          difficulty?: string
          due_at?: string | null
          id?: string
          published_at?: string | null
          question_type?: string
          source_experiment?: string | null
          status?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_sets_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_index: number | null
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number
          parts: Json | null
          question_text: string | null
          set_id: string
          stem: string | null
          type: string
          updated_at: string
        }
        Insert: {
          correct_index?: number | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          parts?: Json | null
          question_text?: string | null
          set_id: string
          stem?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          correct_index?: number | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          parts?: Json | null
          question_text?: string | null
          set_id?: string
          stem?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_days: number
          last_check_date: string | null
          longest_days: number
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_days?: number
          last_check_date?: string | null
          longest_days?: number
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_days?: number
          last_check_date?: string | null
          longest_days?: number
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_cycle: string
          code: string
          created_at: string
          duration_days: number
          features: Json
          is_active: boolean
          name_bn: string
          name_en: string
          price_bdt: number
          tier: string
        }
        Insert: {
          billing_cycle: string
          code: string
          created_at?: string
          duration_days?: number
          features?: Json
          is_active?: boolean
          name_bn: string
          name_en: string
          price_bdt?: number
          tier: string
        }
        Update: {
          billing_cycle?: string
          code?: string
          created_at?: string
          duration_days?: number
          features?: Json
          is_active?: boolean
          name_bn?: string
          name_en?: string
          price_bdt?: number
          tier?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          id: string
          plan_code: string
          started_at: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          id?: string
          plan_code: string
          started_at?: string
          status: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          id?: string
          plan_code?: string
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
        ]
      }
      test_attempts: {
        Row: {
          answers: Json
          cq_graded_at: string | null
          cq_graded_by: string | null
          cq_score: number | null
          created_at: string
          id: string
          mcq_score: number
          mcq_total: number
          set_id: string
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          answers?: Json
          cq_graded_at?: string | null
          cq_graded_by?: string | null
          cq_score?: number | null
          created_at?: string
          id?: string
          mcq_score?: number
          mcq_total?: number
          set_id: string
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          cq_graded_at?: string | null
          cq_graded_by?: string | null
          cq_score?: number | null
          created_at?: string
          id?: string
          mcq_score?: number
          mcq_total?: number
          set_id?: string
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          ai_messages_used: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          ai_messages_used?: number
          updated_at?: string
          usage_date: string
          user_id: string
        }
        Update: {
          ai_messages_used?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          chapter_number: number
          created_at: string
          id: string
          is_premium: boolean
          sort_order: number
          title: string
          video_id: string
          video_platform: string
        }
        Insert: {
          chapter_number: number
          created_at?: string
          id?: string
          is_premium?: boolean
          sort_order?: number
          title: string
          video_id: string
          video_platform?: string
        }
        Update: {
          chapter_number?: number
          created_at?: string
          id?: string
          is_premium?: boolean
          sort_order?: number
          title?: string
          video_id?: string
          video_platform?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_grant_subscription: {
        Args: { _plan_code: string; _user_id: string }
        Returns: undefined
      }
      generate_class_code: { Args: never; Returns: string }
      get_auth_email_by_phone: { Args: { _phone: string }; Returns: string }
      has_active_pro: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_usage: { Args: { _usage_date: string }; Returns: number }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      join_class: { Args: { _code: string }; Returns: string }
      match_kb_documents: {
        Args: {
          filter_source?: string
          filter_subject?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          chapter: string
          class: string
          content: string
          id: string
          metadata: Json
          page: number
          similarity: number
          source: string
          subject: string
        }[]
      }
      regenerate_class_code: { Args: { _class_id: string }; Returns: string }
      streak_checkin: {
        Args: never
        Returns: {
          current_days: number
          last_check_date: string | null
          longest_days: number
          start_date: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
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
  public: {
    Enums: {
      app_role: ["student", "teacher", "admin"],
    },
  },
} as const
