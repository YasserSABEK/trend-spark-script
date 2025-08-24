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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agency_usage_tracking: {
        Row: {
          actions_count: number
          created_at: string
          credits_used: number
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions_count?: number
          created_at?: string
          credits_used?: number
          date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions_count?: number
          created_at?: string
          credits_used?: number
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      billing_plans: {
        Row: {
          created_at: string | null
          has_advanced_analytics: boolean | null
          id: string
          is_default: boolean | null
          max_profiles: number | null
          monthly_credits: number
          name: string
          price_usd: number
          slug: string
        }
        Insert: {
          created_at?: string | null
          has_advanced_analytics?: boolean | null
          id?: string
          is_default?: boolean | null
          max_profiles?: number | null
          monthly_credits: number
          name: string
          price_usd: number
          slug: string
        }
        Update: {
          created_at?: string | null
          has_advanced_analytics?: boolean | null
          id?: string
          is_default?: boolean | null
          max_profiles?: number | null
          monthly_credits?: number
          name?: string
          price_usd?: number
          slug?: string
        }
        Relationships: []
      }
      content_analysis: {
        Row: {
          analysis_result: Json | null
          completed_at: string | null
          content_item_id: string
          created_at: string
          credits_used: number | null
          deeper_analysis: boolean | null
          error_message: string | null
          hook_text: string | null
          id: string
          insights: Json | null
          sections: Json | null
          status: string
          transcript: string | null
          updated_at: string
          user_id: string
          video_duration: number | null
          video_url: string | null
        }
        Insert: {
          analysis_result?: Json | null
          completed_at?: string | null
          content_item_id: string
          created_at?: string
          credits_used?: number | null
          deeper_analysis?: boolean | null
          error_message?: string | null
          hook_text?: string | null
          id?: string
          insights?: Json | null
          sections?: Json | null
          status?: string
          transcript?: string | null
          updated_at?: string
          user_id: string
          video_duration?: number | null
          video_url?: string | null
        }
        Update: {
          analysis_result?: Json | null
          completed_at?: string | null
          content_item_id?: string
          created_at?: string
          credits_used?: number | null
          deeper_analysis?: boolean | null
          error_message?: string | null
          hook_text?: string | null
          id?: string
          insights?: Json | null
          sections?: Json | null
          status?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
          video_duration?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_analysis_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          analysis_id: string | null
          caption: string | null
          color: string | null
          created_at: string
          id: string
          notes: string | null
          planned_publish_date: string | null
          platform: string
          scheduled_at: string | null
          script_id: string | null
          source_post_id: string | null
          source_url: string
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          caption?: string | null
          color?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_publish_date?: string | null
          platform: string
          scheduled_at?: string | null
          script_id?: string | null
          source_post_id?: string | null
          source_url: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          caption?: string | null
          color?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_publish_date?: string | null
          platform?: string
          scheduled_at?: string | null
          script_id?: string | null
          source_post_id?: string | null
          source_url?: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "content_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          avatar_url: string | null
          brand_name: string
          content_format: string | null
          content_goals: string[] | null
          created_at: string | null
          description: string | null
          id: string
          instagram_handle: string | null
          niche: string
          on_camera: boolean | null
          personality_traits: string[] | null
          profile_status: string | null
          sample_count: number | null
          target_audience: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          brand_name: string
          content_format?: string | null
          content_goals?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          niche: string
          on_camera?: boolean | null
          personality_traits?: string[] | null
          profile_status?: string | null
          sample_count?: number | null
          target_audience: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          brand_name?: string
          content_format?: string | null
          content_goals?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          niche?: string
          on_camera?: boolean | null
          personality_traits?: string[] | null
          profile_status?: string | null
          sample_count?: number | null
          target_audience?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_balances: {
        Row: {
          balance: number
          created_at: string | null
          last_reset: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          last_reset?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          last_reset?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          created_at: string | null
          delta: number
          id: string
          metadata: Json | null
          reason: string | null
          ref_id: string | null
          ref_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delta: number
          id?: string
          metadata?: Json | null
          reason?: string | null
          ref_id?: string | null
          ref_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delta?: number
          id?: string
          metadata?: Json | null
          reason?: string | null
          ref_id?: string | null
          ref_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      credit_topups: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          price_usd: number
          provider: string | null
          provider_ref: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          id?: string
          price_usd: number
          provider?: string | null
          provider_ref?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          price_usd?: number
          provider?: string | null
          provider_ref?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_topups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_credit_usage: {
        Row: {
          created_at: string
          credits_used: number
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_scripts: {
        Row: {
          brand_voice: string | null
          call_to_action: string
          conditioning_data: Json | null
          created_at: string
          format_type: string | null
          generation_goal: string | null
          hook: string
          hook_style: string | null
          id: string
          is_favorite: boolean | null
          main_content: string
          niche: string | null
          optimal_posting_time: string | null
          performance_metrics: Json | null
          performance_score: number | null
          platform_optimized: string | null
          profile_id: string | null
          quality_score: number | null
          reel_id: string | null
          script_format: string | null
          shots: Json | null
          style_profile_id: string | null
          suggested_hashtags: string[] | null
          target_audience: string | null
          title: string
          tone_of_voice: string | null
          total_duration: string | null
          updated_at: string
          user_id: string
          viral_tactics: Json | null
        }
        Insert: {
          brand_voice?: string | null
          call_to_action: string
          conditioning_data?: Json | null
          created_at?: string
          format_type?: string | null
          generation_goal?: string | null
          hook: string
          hook_style?: string | null
          id?: string
          is_favorite?: boolean | null
          main_content: string
          niche?: string | null
          optimal_posting_time?: string | null
          performance_metrics?: Json | null
          performance_score?: number | null
          platform_optimized?: string | null
          profile_id?: string | null
          quality_score?: number | null
          reel_id?: string | null
          script_format?: string | null
          shots?: Json | null
          style_profile_id?: string | null
          suggested_hashtags?: string[] | null
          target_audience?: string | null
          title: string
          tone_of_voice?: string | null
          total_duration?: string | null
          updated_at?: string
          user_id: string
          viral_tactics?: Json | null
        }
        Update: {
          brand_voice?: string | null
          call_to_action?: string
          conditioning_data?: Json | null
          created_at?: string
          format_type?: string | null
          generation_goal?: string | null
          hook?: string
          hook_style?: string | null
          id?: string
          is_favorite?: boolean | null
          main_content?: string
          niche?: string | null
          optimal_posting_time?: string | null
          performance_metrics?: Json | null
          performance_score?: number | null
          platform_optimized?: string | null
          profile_id?: string | null
          quality_score?: number | null
          reel_id?: string | null
          script_format?: string | null
          shots?: Json | null
          style_profile_id?: string | null
          suggested_hashtags?: string[] | null
          target_audience?: string | null
          title?: string
          tone_of_voice?: string | null
          total_duration?: string | null
          updated_at?: string
          user_id?: string
          viral_tactics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_scripts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_scripts_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "instagram_reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_scripts_style_profile_id_fkey"
            columns: ["style_profile_id"]
            isOneToOne: false
            referencedRelation: "user_style_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_reels: {
        Row: {
          apify_run_id: string | null
          caption: string | null
          comments: number | null
          content_type: string | null
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
          profile_photo_url: string | null
          scraped_at: string | null
          search_hashtag: string | null
          search_id: string | null
          search_requested_at: string | null
          search_status: string | null
          search_username: string | null
          shortcode: string | null
          thumbnail_url: string | null
          timestamp: string | null
          url: string
          user_id: string | null
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
          content_type?: string | null
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
          profile_photo_url?: string | null
          scraped_at?: string | null
          search_hashtag?: string | null
          search_id?: string | null
          search_requested_at?: string | null
          search_status?: string | null
          search_username?: string | null
          shortcode?: string | null
          thumbnail_url?: string | null
          timestamp?: string | null
          url: string
          user_id?: string | null
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
          content_type?: string | null
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
          profile_photo_url?: string | null
          scraped_at?: string | null
          search_hashtag?: string | null
          search_id?: string | null
          search_requested_at?: string | null
          search_status?: string | null
          search_username?: string | null
          shortcode?: string | null
          thumbnail_url?: string | null
          timestamp?: string | null
          url?: string
          user_id?: string | null
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
          billing_cycle_start: string | null
          bio: string | null
          created_at: string
          credits_used_this_month: number | null
          current_credits: number | null
          full_name: string | null
          id: string
          instagram_username: string | null
          monthly_credit_limit: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle_start?: string | null
          bio?: string | null
          created_at?: string
          credits_used_this_month?: number | null
          current_credits?: number | null
          full_name?: string | null
          id?: string
          instagram_username?: string | null
          monthly_credit_limit?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_cycle_start?: string | null
          bio?: string | null
          created_at?: string
          credits_used_this_month?: number | null
          current_credits?: number | null
          full_name?: string | null
          id?: string
          instagram_username?: string | null
          monthly_credit_limit?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_creators: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          follower_count: number | null
          id: string
          platform: string
          profile_url: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          id?: string
          platform?: string
          profile_url?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          id?: string
          platform?: string
          profile_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      search_cache: {
        Row: {
          cache_key: string
          chunk_size: number
          created_at: string | null
          fetched_at: string
          items: Json
          source_run_id: string | null
          total_count: number | null
          user_id: string | null
        }
        Insert: {
          cache_key: string
          chunk_size?: number
          created_at?: string | null
          fetched_at: string
          items: Json
          source_run_id?: string | null
          total_count?: number | null
          user_id?: string | null
        }
        Update: {
          cache_key?: string
          chunk_size?: number
          created_at?: string | null
          fetched_at?: string
          items?: Json
          source_run_id?: string | null
          total_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_queue: {
        Row: {
          completed_at: string | null
          error_message: string | null
          hashtag: string | null
          id: string
          platform: string | null
          processing_time_seconds: number | null
          profile_photo_url: string | null
          requested_at: string
          search_type: string | null
          status: string
          total_results: number | null
          user_id: string
          username: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          hashtag?: string | null
          id?: string
          platform?: string | null
          processing_time_seconds?: number | null
          profile_photo_url?: string | null
          requested_at?: string
          search_type?: string | null
          status?: string
          total_results?: number | null
          user_id: string
          username?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          hashtag?: string | null
          id?: string
          platform?: string | null
          processing_time_seconds?: number | null
          profile_photo_url?: string | null
          requested_at?: string
          search_type?: string | null
          status?: string
          total_results?: number | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tiktok_oembed_cache: {
        Row: {
          fetched_at: string
          height: number | null
          html: string | null
          id: string
          requested_by_user_id: string | null
          thumbnail_url: string | null
          url: string
          video_id: string
          width: number | null
        }
        Insert: {
          fetched_at?: string
          height?: number | null
          html?: string | null
          id?: string
          requested_by_user_id?: string | null
          thumbnail_url?: string | null
          url: string
          video_id: string
          width?: number | null
        }
        Update: {
          fetched_at?: string
          height?: number | null
          html?: string | null
          id?: string
          requested_by_user_id?: string | null
          thumbnail_url?: string | null
          url?: string
          video_id?: string
          width?: number | null
        }
        Relationships: []
      }
      tiktok_videos: {
        Row: {
          apify_run_id: string | null
          author_avatar: string | null
          caption: string | null
          collect_count: number | null
          comment_count: number | null
          created_at: string
          dataset_id: string | null
          digg_count: number | null
          display_name: string | null
          engagement_rate: number | null
          followers: number | null
          hashtags: string[] | null
          id: string
          is_video: boolean | null
          mentions: string[] | null
          music_author: string | null
          music_name: string | null
          music_original: boolean | null
          platform: string | null
          play_count: number | null
          post_id: string
          processing_time_seconds: number | null
          scraped_at: string | null
          search_hashtag: string | null
          search_id: string | null
          search_requested_at: string | null
          search_status: string | null
          search_username: string | null
          share_count: number | null
          shortcode: string | null
          thumbnail_url: string | null
          timestamp: string | null
          url: string
          user_id: string | null
          username: string | null
          verified: boolean | null
          video_duration: number | null
          video_url: string | null
          viral_score: number | null
          web_video_url: string | null
        }
        Insert: {
          apify_run_id?: string | null
          author_avatar?: string | null
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          created_at?: string
          dataset_id?: string | null
          digg_count?: number | null
          display_name?: string | null
          engagement_rate?: number | null
          followers?: number | null
          hashtags?: string[] | null
          id?: string
          is_video?: boolean | null
          mentions?: string[] | null
          music_author?: string | null
          music_name?: string | null
          music_original?: boolean | null
          platform?: string | null
          play_count?: number | null
          post_id: string
          processing_time_seconds?: number | null
          scraped_at?: string | null
          search_hashtag?: string | null
          search_id?: string | null
          search_requested_at?: string | null
          search_status?: string | null
          search_username?: string | null
          share_count?: number | null
          shortcode?: string | null
          thumbnail_url?: string | null
          timestamp?: string | null
          url: string
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          video_duration?: number | null
          video_url?: string | null
          viral_score?: number | null
          web_video_url?: string | null
        }
        Update: {
          apify_run_id?: string | null
          author_avatar?: string | null
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          created_at?: string
          dataset_id?: string | null
          digg_count?: number | null
          display_name?: string | null
          engagement_rate?: number | null
          followers?: number | null
          hashtags?: string[] | null
          id?: string
          is_video?: boolean | null
          mentions?: string[] | null
          music_author?: string | null
          music_name?: string | null
          music_original?: boolean | null
          platform?: string | null
          play_count?: number | null
          post_id?: string
          processing_time_seconds?: number | null
          scraped_at?: string | null
          search_hashtag?: string | null
          search_id?: string | null
          search_requested_at?: string | null
          search_status?: string | null
          search_username?: string | null
          share_count?: number | null
          shortcode?: string | null
          thumbnail_url?: string | null
          timestamp?: string | null
          url?: string
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          video_duration?: number | null
          video_url?: string | null
          viral_score?: number | null
          web_video_url?: string | null
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
      user_content_samples: {
        Row: {
          analysis_id: string
          content_item_id: string
          created_at: string | null
          id: string
          is_style_reference: boolean | null
          profile_id: string
          style_tags: string[] | null
          user_id: string
        }
        Insert: {
          analysis_id: string
          content_item_id: string
          created_at?: string | null
          id?: string
          is_style_reference?: boolean | null
          profile_id: string
          style_tags?: string[] | null
          user_id: string
        }
        Update: {
          analysis_id?: string
          content_item_id?: string
          created_at?: string | null
          id?: string
          is_style_reference?: boolean | null
          profile_id?: string
          style_tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_samples_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "content_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_content_samples_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_content_samples_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          message: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          message: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_save_scripts: boolean | null
          created_at: string
          credit_alerts: Json | null
          dashboard_layout: string | null
          data_sharing: boolean | null
          date_format: string | null
          default_analysis_depth: string | null
          email_notifications: Json | null
          id: string
          in_app_notifications: boolean | null
          language: string | null
          preferred_platforms: string[] | null
          profile_visibility: string | null
          push_notifications: boolean | null
          sidebar_collapsed: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save_scripts?: boolean | null
          created_at?: string
          credit_alerts?: Json | null
          dashboard_layout?: string | null
          data_sharing?: boolean | null
          date_format?: string | null
          default_analysis_depth?: string | null
          email_notifications?: Json | null
          id?: string
          in_app_notifications?: boolean | null
          language?: string | null
          preferred_platforms?: string[] | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save_scripts?: boolean | null
          created_at?: string
          credit_alerts?: Json | null
          dashboard_layout?: string | null
          data_sharing?: boolean | null
          date_format?: string | null
          default_analysis_depth?: string | null
          email_notifications?: Json | null
          id?: string
          in_app_notifications?: boolean | null
          language?: string | null
          preferred_platforms?: string[] | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_style_profiles: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          last_updated: string | null
          profile_id: string
          sample_count: number
          style_traits: Json
          summary_text: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          profile_id: string
          sample_count: number
          style_traits: Json
          summary_text: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          profile_id?: string
          sample_count?: number
          style_traits?: Json
          summary_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_style_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          plan_slug: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          plan_slug?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          plan_slug?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: { credits_to_add: number; user_id_param: string }
        Returns: undefined
      }
      check_profile_limit: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      deduct_credits: {
        Args: { credits_to_deduct: number; user_id_param: string }
        Returns: boolean
      }
      get_analysis_by_id: {
        Args: { analysis_id_param: string }
        Returns: {
          analysis_result: Json
          completed_at: string
          content_item_id: string
          created_at: string
          credits_used: number
          deeper_analysis: boolean
          error_message: string
          hook_text: string
          id: string
          insights: Json
          sections: Json
          status: string
          transcript: string
          updated_at: string
          user_id: string
          video_duration: number
          video_url: string
        }[]
      }
      get_content_analysis: {
        Args: { content_item_id_param: string }
        Returns: {
          analysis_result: Json
          completed_at: string
          content_item_id: string
          created_at: string
          credits_used: number
          deeper_analysis: boolean
          error_message: string
          hook_text: string
          id: string
          insights: Json
          sections: Json
          status: string
          transcript: string
          updated_at: string
          user_id: string
          video_duration: number
          video_url: string
        }[]
      }
      get_monthly_credit_usage: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_credits: {
        Args: { user_id_param: string }
        Returns: {
          billing_cycle_start: string
          credits_used: number
          current_credits: number
          monthly_limit: number
          subscription_plan: string
        }[]
      }
      grant_monthly_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      grant_subscription_credits: {
        Args: { plan_slug_param: string; user_id_param: string }
        Returns: Json
      }
      log_security_event: {
        Args: {
          action_type_param: string
          metadata_param?: Json
          resource_id_param?: string
          resource_type_param: string
        }
        Returns: undefined
      }
      safe_deduct_credits: {
        Args: { credits_to_deduct: number; user_id_param: string }
        Returns: Json
      }
      spend_credits: {
        Args: {
          amount_param: number
          idempotency_key_param?: string
          reason_param: string
          ref_id_param?: string
          ref_type_param?: string
          user_id_param: string
        }
        Returns: Json
      }
      submit_user_feedback: {
        Args: {
          feedback_type_param: string
          message_param: string
          subject_param?: string
        }
        Returns: undefined
      }
      update_subscription_plan: {
        Args: {
          credit_limit: number
          plan_name: string
          stripe_customer_id_param?: string
          stripe_subscription_id_param?: string
          user_id_param: string
        }
        Returns: undefined
      }
      user_owns_content: {
        Args: { content_user_id: string }
        Returns: boolean
      }
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
