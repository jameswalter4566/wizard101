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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      exchange_coins: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          likes: number | null
          liquidity_usd: number | null
          listed_by: string | null
          listed_by_username: string | null
          market_cap: number | null
          name: string
          price_change_24h: number | null
          price_usd: number | null
          symbol: string
          token_address: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes?: number | null
          liquidity_usd?: number | null
          listed_by?: string | null
          listed_by_username?: string | null
          market_cap?: number | null
          name: string
          price_change_24h?: number | null
          price_usd?: number | null
          symbol: string
          token_address: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes?: number | null
          liquidity_usd?: number | null
          listed_by?: string | null
          listed_by_username?: string | null
          market_cap?: number | null
          name?: string
          price_change_24h?: number | null
          price_usd?: number | null
          symbol?: string
          token_address?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_coins_listed_by_fkey"
            columns: ["listed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_chats: {
        Row: {
          created_at: string | null
          id: string
          message: string
          player_id: string
          screen_name: string
          timestamp: string | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          player_id: string
          screen_name: string
          timestamp?: string | null
          x: number
          y: number
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          player_id?: string
          screen_name?: string
          timestamp?: string | null
          x?: number
          y?: number
        }
        Relationships: []
      }
      player_positions: {
        Row: {
          created_at: string | null
          direction: string
          id: number
          model_type: string | null
          player_id: string
          screen_name: string
          source_x: number | null
          source_y: number | null
          timestamp: string | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: number
          model_type?: string | null
          player_id: string
          screen_name: string
          source_x?: number | null
          source_y?: number | null
          timestamp?: string | null
          x: number
          y: number
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: number
          model_type?: string | null
          player_id?: string
          screen_name?: string
          source_x?: number | null
          source_y?: number | null
          timestamp?: string | null
          x?: number
          y?: number
        }
        Relationships: []
      }
      token_launches: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          initial_market_cap: number | null
          lets_bonk_url: string | null
          market_cap: number | null
          mint_address: string | null
          token_address: string
          token_name: string
          token_symbol: string
          transaction_hash: string | null
          transaction_signature: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          initial_market_cap?: number | null
          lets_bonk_url?: string | null
          market_cap?: number | null
          mint_address?: string | null
          token_address: string
          token_name: string
          token_symbol: string
          transaction_hash?: string | null
          transaction_signature?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          initial_market_cap?: number | null
          lets_bonk_url?: string | null
          market_cap?: number | null
          mint_address?: string | null
          token_address?: string
          token_name?: string
          token_symbol?: string
          transaction_hash?: string | null
          transaction_signature?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_launches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          recipient_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          recipient_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          recipient_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          body_type: string | null
          character_model: string | null
          created_at: string | null
          id: string
          market_cap: number | null
          mint_address: string | null
          pants_color: string | null
          shirt_color: string | null
          skin_color: string | null
          token_mint_address: string | null
          updated_at: string | null
          username: string
          wallet_private_key: string
          wallet_public_key: string
        }
        Insert: {
          body_type?: string | null
          character_model?: string | null
          created_at?: string | null
          id?: string
          market_cap?: number | null
          mint_address?: string | null
          pants_color?: string | null
          shirt_color?: string | null
          skin_color?: string | null
          token_mint_address?: string | null
          updated_at?: string | null
          username: string
          wallet_private_key: string
          wallet_public_key: string
        }
        Update: {
          body_type?: string | null
          character_model?: string | null
          created_at?: string | null
          id?: string
          market_cap?: number | null
          mint_address?: string | null
          pants_color?: string | null
          shirt_color?: string | null
          skin_color?: string | null
          token_mint_address?: string | null
          updated_at?: string | null
          username?: string
          wallet_private_key?: string
          wallet_public_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_positions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_coin_likes: {
        Args: { coin_id: string }
        Returns: undefined
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
