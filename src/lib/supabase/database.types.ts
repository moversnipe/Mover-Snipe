// Database types for the `public` schema.
// Matches supabase/migrations. Regenerate after any migration with:
//   npm run db:types
// (requires the local Supabase stack: npm run db:start)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
        }
        Insert: {
          created_at?: string
          id: string
          stripe_customer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json
          product_id: string
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"]
          unit_amount: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency: string
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json
          product_id: string
          trial_period_days?: number | null
          type: Database["public"]["Enums"]["pricing_type"]
          unit_amount?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json
          product_id?: string
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"]
          unit_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image: string | null
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id: string
          metadata?: Json
          price_id?: string | null
          quantity?: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempts: number
          error: string | null
          event_id: string
          event_type: string
          processed_at: string | null
          provider: string
          received_at: string
          status: Database["public"]["Enums"]["webhook_event_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          error?: string | null
          event_id: string
          event_type: string
          processed_at?: string | null
          provider: string
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_event_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          error?: string | null
          event_id?: string
          event_type?: string
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_event_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_webhook_event: {
        Args: { p_event_id: string; p_event_type: string; p_provider: string }
        Returns: boolean
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
      webhook_event_status: "processing" | "processed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T]
