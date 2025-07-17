import { createAdminClient } from './supabase'
import { Database } from '@/types/database.types'

type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingRow = Database['public']['Tables']['bookings']['Row']
type DriverInsert = Database['public']['Tables']['drivers']['Insert']
type DriverRow = Database['public']['Tables']['drivers']['Row']

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
export async function getAllBookings(): Promise<{ success: boolean; error?: string; data?: any[] }> {
  try {
    const supabase = createAdminClient()
    
    // First get all bookings with driver info
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        driver:drivers(id, name),
        customer:customers(id, name, billing_info)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bookings:', error)
      return { success: false, error: error.message }
    }

    // Get unique user IDs from created_by and modified_by
    const userIds = new Set<string>()
    bookings?.forEach(booking => {
      const b = booking as any
      if (b.created_by) userIds.add(b.created_by)
      if (b.modified_by) userIds.add(b.modified_by)
    })

    // Fetch user emails if we have user IDs
    let userEmails: Record<string, string> = {}
    if (userIds.size > 0) {
      const { data: users, error: userError } = await supabase.auth.admin.listUsers()
      
      if (!userError && users?.users) {
        userEmails = users.users.reduce((acc: Record<string, string>, user: any) => {
          if (user.id && user.email) {
            acc[user.id] = user.email
          }
          return acc
        }, {})
      }
    }

    // Enhance bookings with user email information
    const enhancedBookings = bookings?.map(booking => {
      const b = booking as any
      return {
        ...booking,
        created_by_email: b.created_by ? userEmails[b.created_by] || b.created_by : null,
        modified_by_email: b.modified_by ? userEmails[b.modified_by] || b.modified_by : null
      }
    })
    
    return { success: true, data: enhancedBookings || [] }
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

// ========= DRIVERS FUNCTIONS =========

// Get all drivers
export async function getAllDrivers(): Promise<{ success: boolean; error?: string; data?: DriverRow[] }> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching drivers:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching drivers:', error)
    return { success: false, error: 'Failed to fetch drivers' }
  }
}

// Insert a new driver
export async function insertDriver(driverData: DriverInsert): Promise<{ success: boolean; error?: string; data?: DriverRow }> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting driver:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error inserting driver:', error)
    return { success: false, error: 'Failed to insert driver' }
  }
}

// Delete a driver
export async function deleteDriver(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // First check if driver is assigned to any bookings
    const { data: assignedBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('driver_id', id)
      .limit(1)
    
    if (bookingsError) {
      console.error('Error checking driver assignments:', bookingsError)
      return { success: false, error: 'Failed to check driver assignments' }
    }
    
    if (assignedBookings && assignedBookings.length > 0) {
      return { success: false, error: 'Cannot delete driver that is assigned to bookings' }
    }
    
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting driver:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting driver:', error)
    return { success: false, error: 'Failed to delete driver' }
  }
} 