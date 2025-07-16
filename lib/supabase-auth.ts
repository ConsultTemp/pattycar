import { supabase } from './supabase'

export interface AuthResult {
  success: boolean
  error?: string
  user?: any
  session?: any
}

// Admin login with email and password (client-side)
export async function adminLogin(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'No user data returned' }
    }

    return { success: true, user: data.user, session: data.session }
  } catch (error) {
    return { success: false, error: 'Login failed' }
  }
}

// Admin logout (client-side)
export async function adminLogout(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Logout failed' }
  }
}

// Get current user (client-side)
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
} 