import { cookies } from 'next/headers'
import { createAdminClient } from './supabase'

// Server-side authentication verification con refresh automatico
export async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    const refreshToken = cookieStore.get('sb-refresh-token')?.value
    
    if (!accessToken) {
      return false
    }

    // Verify the token with Supabase
    const supabase = createAdminClient()
    let { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    // Se il token è scaduto ma abbiamo un refresh token, prova a rinnovarlo
    if (error && refreshToken) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })
      
      if (!refreshError && refreshData.session) {
        // Aggiorna i cookie con i nuovi token
        cookieStore.set('sb-access-token', refreshData.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60, // 30 giorni
          path: '/'
        })
        
        cookieStore.set('sb-refresh-token', refreshData.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 90 * 24 * 60 * 60, // 90 giorni
          path: '/'
        })
        
        return true
      }
    }
    
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