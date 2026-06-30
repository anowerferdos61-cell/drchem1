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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_usage: { Args: { _usage_date: string }; Returns: number }
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
