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
      bookings: {
        Row: {
          amount_total: number
          billing_info: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          customer_phone_prefix: string | null
          departure_city: string | null
          destination_address: string
          destination_is_custom: boolean | null
          destination_location_id: string | null
          distance: string | null
          driver_id: string | null
          duration: string | null
          event_route: string | null
          flight_info: string | null
          id: string
          individual_vehicles: Json | null
          invoice_url: string | null
          is_olympic_pricing: boolean | null
          luggage: number
          meet_and_greet: boolean | null
          meet_greet_config: Json | null
          modified_by: string | null
          night_surcharge: string | null
          notes: string | null
          passengers: number
          payment_intent_id: string | null
          payment_status: string
          pickup_address: string
          pickup_is_custom: boolean | null
          pickup_location_id: string | null
          price_breakdown: string | null
          raw_metadata: Json | null
          same_vehicle_type: boolean | null
          service_badge: string | null
          service_date: string
          service_duration: string | null
          service_end_time: string | null
          service_icon: string | null
          service_label: string | null
          service_time: string
          service_type: string
          departure_time: string | null
          departure_minutes: string | null
          departure_time_ampm: string | null
          stripe_session_id: string
          transfer_cost: string | null
          transfer_route: string | null
          updated_at: string
          vat_rate: string | null
          vehicle_count: number
          vehicle_type: string
        }
        Insert: {
          amount_total: number
          billing_info?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_phone_prefix?: string | null
          departure_city?: string | null
          destination_address: string
          destination_is_custom?: boolean | null
          destination_location_id?: string | null
          distance?: string | null
          driver_id?: string | null
          duration?: string | null
          event_route?: string | null
          flight_info?: string | null
          id?: string
          individual_vehicles?: Json | null
          invoice_url?: string | null
          is_olympic_pricing?: boolean | null
          luggage?: number
          meet_and_greet?: boolean | null
          meet_greet_config?: Json | null
          modified_by?: string | null
          night_surcharge?: string | null
          notes?: string | null
          passengers?: number
          payment_intent_id?: string | null
          payment_status?: string
          pickup_address: string
          pickup_is_custom?: boolean | null
          pickup_location_id?: string | null
          price_breakdown?: string | null
          raw_metadata?: Json | null
          same_vehicle_type?: boolean | null
          service_badge?: string | null
          service_date: string
          service_duration?: string | null
          service_end_time?: string | null
          service_icon?: string | null
          service_label?: string | null
          service_time: string
          service_type: string
          stripe_session_id: string
          transfer_cost?: string | null
          transfer_route?: string | null
          updated_at?: string
          vat_rate?: string | null
          vehicle_count?: number
          vehicle_type: string
        }
        Update: {
          amount_total?: number
          billing_info?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_phone_prefix?: string | null
          departure_city?: string | null
          destination_address?: string
          destination_is_custom?: boolean | null
          destination_location_id?: string | null
          distance?: string | null
          driver_id?: string | null
          duration?: string | null
          event_route?: string | null
          flight_info?: string | null
          id?: string
          individual_vehicles?: Json | null
          invoice_url?: string | null
          is_olympic_pricing?: boolean | null
          luggage?: number
          meet_and_greet?: boolean | null
          meet_greet_config?: Json | null
          modified_by?: string | null
          night_surcharge?: string | null
          notes?: string | null
          passengers?: number
          payment_intent_id?: string | null
          payment_status?: string
          pickup_address?: string
          pickup_is_custom?: boolean | null
          pickup_location_id?: string | null
          price_breakdown?: string | null
          raw_metadata?: Json | null
          same_vehicle_type?: boolean | null
          service_badge?: string | null
          service_date?: string
          service_duration?: string | null
          service_end_time?: string | null
          service_icon?: string | null
          service_label?: string | null
          service_time?: string
          service_type?: string
          stripe_session_id?: string
          transfer_cost?: string | null
          transfer_route?: string | null
          updated_at?: string
          vat_rate?: string | null
          vehicle_count?: number
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          billing_info: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          billing_info?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          billing_info?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
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
