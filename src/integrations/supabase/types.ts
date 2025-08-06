export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      apify_runs: {
        Row: {
          actor_id: string | null
          cost_usd: number | null
          created_at: string
          dataset_id: string | null
          finished_at: string | null
          id: string
          input_data: Json | null
          items_count: number | null
          run_id: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          cost_usd?: number | null
          created_at?: string
          dataset_id?: string | null
          finished_at?: string | null
          id?: string
          input_data?: Json | null
          items_count?: number | null
          run_id: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          cost_usd?: number | null
          created_at?: string
          dataset_id?: string | null
          finished_at?: string | null
          id?: string
          input_data?: Json | null
          items_count?: number | null
          run_id?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_scripts: {
        Row: {
          brand_voice: string | null
          call_to_action: string
          created_at: string
          format_type: string | null
          hook: string
          hook_style: string | null
          id: string
          is_favorite: boolean | null
          main_content: string
          niche: string | null
          optimal_posting_time: string | null
          performance_score: number | null
          reel_id: string | null
          suggested_hashtags: string[] | null
          target_audience: string | null
          title: string
          tone_of_voice: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_voice?: string | null
          call_to_action: string
          created_at?: string
          format_type?: string | null
          hook: string
          hook_style?: string | null
          id?: string
          is_favorite?: boolean | null
          main_content: string
          niche?: string | null
          optimal_posting_time?: string | null
          performance_score?: number | null
          reel_id?: string | null
          suggested_hashtags?: string[] | null
          target_audience?: string | null
          title: string
          tone_of_voice?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_voice?: string | null
          call_to_action?: string
          created_at?: string
          format_type?: string | null
          hook?: string
          hook_style?: string | null
          id?: string
          is_favorite?: boolean | null
          main_content?: string
          niche?: string | null
          optimal_posting_time?: string | null
          performance_score?: number | null
          reel_id?: string | null
          suggested_hashtags?: string[] | null
          target_audience?: string | null
          title?: string
          tone_of_voice?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_scripts_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "instagram_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_reels: {
        Row: {
          apify_run_id: string | null
          caption: string | null
          comments: number | null
          created_at: string
          dataset_id: string | null
          display_name: string | null
          engagement_rate: number | null
          followers: number | null
          hashtags: string[] | null
          id: string
          is_video: boolean | null
          likes: number | null
          mentions: string[] | null
          post_id: string
          processing_time_seconds: number | null
          product_type: string | null
          scraped_at: string | null
          search_id: string | null
          search_requested_at: string | null
          search_status: string | null
          search_username: string | null
          shortcode: string | null
          thumbnail_url: string | null
          timestamp: string | null
          url: string
          username: string | null
          verified: boolean | null
          video_duration: number | null
          video_play_count: number | null
          video_url: string | null
          video_view_count: number | null
          viral_score: number | null
        }
        Insert: {
          apify_run_id?: string | null
          caption?: string | null
          comments?: number | null
          created_at?: string
          dataset_id?: string | null
          display_name?: string | null
          engagement_rate?: number | null
          followers?: number | null
          hashtags?: string[] | null
          id?: string
          is_video?: boolean | null
          likes?: number | null
          mentions?: string[] | null
          post_id: string
          processing_time_seconds?: number | null
          product_type?: string | null
          scraped_at?: string | null
          search_id?: string | null
          search_requested_at?: string | null
          search_status?: string | null
          search_username?: string | null
          shortcode?: string | null
          thumbnail_url?: string | null
          timestamp?: string | null
          url: string
          username?: string | null
          verified?: boolean | null
          video_duration?: number | null
          video_play_count?: number | null
          video_url?: string | null
          video_view_count?: number | null
          viral_score?: number | null
        }
        Update: {
          apify_run_id?: string | null
          caption?: string | null
          comments?: number | null
          created_at?: string
          dataset_id?: string | null
          display_name?: string | null
          engagement_rate?: number | null
          followers?: number | null
          hashtags?: string[] | null
          id?: string
          is_video?: boolean | null
          likes?: number | null
          mentions?: string[] | null
          post_id?: string
          processing_time_seconds?: number | null
          product_type?: string | null
          scraped_at?: string | null
          search_id?: string | null
          search_requested_at?: string | null
          search_status?: string | null
          search_username?: string | null
          shortcode?: string | null
          thumbnail_url?: string | null
          timestamp?: string | null
          url?: string
          username?: string | null
          verified?: boolean | null
          video_duration?: number | null
          video_play_count?: number | null
          video_url?: string | null
          video_view_count?: number | null
          viral_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_reels_apify_run_id_fkey"
            columns: ["apify_run_id"]
            isOneToOne: false
            referencedRelation: "apify_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          instagram_username: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          instagram_username?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          instagram_username?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      search_queue: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          processing_time_seconds: number | null
          requested_at: string
          status: string
          total_results: number | null
          user_id: string | null
          username: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          processing_time_seconds?: number | null
          requested_at?: string
          status?: string
          total_results?: number | null
          user_id?: string | null
          username: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          processing_time_seconds?: number | null
          requested_at?: string
          status?: string
          total_results?: number | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          created_at: string
          date: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
