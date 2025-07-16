import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get the access token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Verify the token with Supabase
    const supabase = createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: { 
        id: user.id, 
        email: user.email 
      } 
    })
    
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'logout') {
      // Clear auth cookies
      const response = NextResponse.json({ success: true })
      
      response.cookies.set('sb-access-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      })
      
      response.cookies.set('sb-refresh-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      })
      
      return response
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Auth action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 