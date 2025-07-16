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
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          
          // Stripe/Payment info
          stripe_session_id: string
          payment_intent_id: string | null
          amount_total: number
          currency: string
          payment_status: string
          invoice_url: string | null
          
          // Customer info
          customer_name: string
          customer_email: string
          customer_phone: string | null
          customer_phone_prefix: string | null
          
          // Service info
          service_type: string
          service_label: string | null
          service_icon: string | null
          service_badge: string | null
          
          // Journey info
          pickup_address: string
          pickup_location_id: string | null
          pickup_is_custom: boolean
          destination_address: string
          destination_location_id: string | null
          destination_is_custom: boolean
          
          // Date & Time
          service_date: string
          service_time: string
          service_end_time: string | null
          service_duration: string | null
          
          // Vehicle configuration
          vehicle_type: string
          vehicle_count: number
          passengers: number
          luggage: number
          same_vehicle_type: boolean
          individual_vehicles: Json | null
          
          // Options
          meet_and_greet: boolean
          meet_greet_config: Json | null
          flight_info: string | null
          departure_city: string | null
          notes: string | null
          billing_info: string | null
          
          // Pricing
          distance: string | null
          duration: string | null
          transfer_cost: string | null
          transfer_route: string | null
          event_route: string | null
          night_surcharge: string | null
          vat_rate: string | null
          price_breakdown: string | null
          
          // Olympic/Event pricing
          is_olympic_pricing: boolean
          
          // Metadata
          raw_metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          
          // Stripe/Payment info
          stripe_session_id: string
          payment_intent_id?: string | null
          amount_total: number
          currency: string
          payment_status: string
          invoice_url?: string | null
          
          // Customer info
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          customer_phone_prefix?: string | null
          
          // Service info
          service_type: string
          service_label?: string | null
          service_icon?: string | null
          service_badge?: string | null
          
          // Journey info
          pickup_address: string
          pickup_location_id?: string | null
          pickup_is_custom?: boolean
          destination_address: string
          destination_location_id?: string | null
          destination_is_custom?: boolean
          
          // Date & Time
          service_date: string
          service_time: string
          service_end_time?: string | null
          service_duration?: string | null
          
          // Vehicle configuration
          vehicle_type: string
          vehicle_count: number
          passengers: number
          luggage: number
          same_vehicle_type?: boolean
          individual_vehicles?: Json | null
          
          // Options
          meet_and_greet?: boolean
          meet_greet_config?: Json | null
          flight_info?: string | null
          departure_city?: string | null
          notes?: string | null
          billing_info?: string | null
          
          // Pricing
          distance?: string | null
          duration?: string | null
          transfer_cost?: string | null
          transfer_route?: string | null
          event_route?: string | null
          night_surcharge?: string | null
          vat_rate?: string | null
          price_breakdown?: string | null
          
          // Olympic/Event pricing
          is_olympic_pricing?: boolean
          
          // Metadata
          raw_metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          
          // Stripe/Payment info
          stripe_session_id?: string
          payment_intent_id?: string | null
          amount_total?: number
          currency?: string
          payment_status?: string
          invoice_url?: string | null
          
          // Customer info
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          customer_phone_prefix?: string | null
          
          // Service info
          service_type?: string
          service_label?: string | null
          service_icon?: string | null
          service_badge?: string | null
          
          // Journey info
          pickup_address?: string
          pickup_location_id?: string | null
          pickup_is_custom?: boolean
          destination_address?: string
          destination_location_id?: string | null
          destination_is_custom?: boolean
          
          // Date & Time
          service_date?: string
          service_time?: string
          service_end_time?: string | null
          service_duration?: string | null
          
          // Vehicle configuration
          vehicle_type?: string
          vehicle_count?: number
          passengers?: number
          luggage?: number
          same_vehicle_type?: boolean
          individual_vehicles?: Json | null
          
          // Options
          meet_and_greet?: boolean
          meet_greet_config?: Json | null
          flight_info?: string | null
          departure_city?: string | null
          notes?: string | null
          billing_info?: string | null
          
          // Pricing
          distance?: string | null
          duration?: string | null
          transfer_cost?: string | null
          transfer_route?: string | null
          event_route?: string | null
          night_surcharge?: string | null
          vat_rate?: string | null
          price_breakdown?: string | null
          
          // Olympic/Event pricing
          is_olympic_pricing?: boolean
          
          // Metadata
          raw_metadata?: Json | null
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