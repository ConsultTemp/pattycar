import { cookies } from 'next/headers'
import { createAdminClient } from './supabase'

// Server-side authentication verification
export async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    
    if (!accessToken) {
      return false
    }

    // Verify the token with Supabase
    const supabase = createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    return !error && !!user
  } catch (error) {
    return false
  }
}

// Get authenticated user server-side
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    
    if (!accessToken) {
      return null
    }

    const supabase = createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
} 