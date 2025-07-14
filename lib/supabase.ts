import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types for our database
export interface BookingData {
  id?: string
  created_at?: string
  name: string
  email: string
  phone: string
  phone_prefix: string
  vehicle_type: string
  date: string
  time: string
  passengers: number
  departure_location: string
  destination: string
  luggage: number
  flight_number?: string
  billing_info?: string
  notes?: string
  meet_greet: boolean
  payment_status: 'pending' | 'completed' | 'failed'
  payment_intent_id?: string
  payment_amount?: number
  currency?: string
  stripe_session_id?: string
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
}