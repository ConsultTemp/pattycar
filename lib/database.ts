import { createAdminClient } from './supabase'
import { Database } from '@/types/database.types'

type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingRow = Database['public']['Tables']['bookings']['Row']

// Insert a new booking (used by stripe webhook)
export async function insertBooking(bookingData: BookingInsert): Promise<{ success: boolean; error?: string; data?: BookingRow }> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting booking:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error inserting booking:', error)
    return { success: false, error: 'Failed to insert booking' }
  }
}

// Get all bookings (used by admin dashboard)
export async function getAllBookings(): Promise<{ success: boolean; error?: string; data?: BookingRow[] }> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bookings:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching bookings:', error)
    return { success: false, error: 'Failed to fetch bookings' }
  }
}

// Get booking by stripe session ID
export async function getBookingByStripeSessionId(sessionId: string): Promise<{ success: boolean; error?: string; data?: BookingRow }> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single()
    
    if (error) {
      console.error('Error fetching booking by session ID:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching booking by session ID:', error)
    return { success: false, error: 'Failed to fetch booking' }
  }
}

// Update booking
export async function updateBooking(id: string, updates: Partial<BookingInsert>): Promise<{ success: boolean; error?: string; data?: BookingRow }> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating booking:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating booking:', error)
    return { success: false, error: 'Failed to update booking' }
  }
}

// Get bookings with pagination
export async function getBookingsPaginated(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    serviceType?: string
    dateFrom?: string
    dateTo?: string
    customerEmail?: string
  }
): Promise<{ success: boolean; error?: string; data?: BookingRow[]; total?: number }> {
  try {
    const supabase = createAdminClient()
    
    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters?.serviceType) {
      query = query.eq('service_type', filters.serviceType)
    }
    
    if (filters?.dateFrom) {
      query = query.gte('service_date', filters.dateFrom)
    }
    
    if (filters?.dateTo) {
      query = query.lte('service_date', filters.dateTo)
    }
    
    if (filters?.customerEmail) {
      query = query.ilike('customer_email', `%${filters.customerEmail}%`)
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('Error fetching paginated bookings:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [], total: count || 0 }
  } catch (error) {
    console.error('Unexpected error fetching paginated bookings:', error)
    return { success: false, error: 'Failed to fetch bookings' }
  }
} 