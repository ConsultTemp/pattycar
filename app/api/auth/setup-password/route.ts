import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getClientIP, isIPBlocked, recordFailedAttempt, resetAttempts, logSecurityEvent } from '@/lib/simple-security'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    
    // Verifica rate limiting
    const blockStatus = isIPBlocked(ip)
    if (blockStatus.blocked) {
      logSecurityEvent('BLOCKED_SETUP_ATTEMPT', ip, { remainingTime: blockStatus.remainingTime })
      
      return NextResponse.json({ 
        error: `Too many setup attempts. Try again in ${blockStatus.remainingTime} minutes.`,
        blocked: true,
        remainingTime: blockStatus.remainingTime
      }, { status: 429 })
    }
    
    const { tokenHash, password } = await request.json()
    
    if (!tokenHash || !password) {
      recordFailedAttempt(ip)
      logSecurityEvent('INVALID_SETUP_REQUEST', ip, { reason: 'missing_data' })
      
      return NextResponse.json({ 
        error: 'Missing token or password',
        success: false,
        remainingAttempts: blockStatus.remainingAttempts 
      }, { status: 400 })
    }

    // Validate password requirements
    if (password.length < 8) {
      recordFailedAttempt(ip)
      logSecurityEvent('INVALID_SETUP_REQUEST', ip, { reason: 'weak_password' })
      
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters',
        success: false,
        remainingAttempts: blockStatus.remainingAttempts 
      }, { status: 400 })
    }

    // Verify invite token and set password
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'invite'
    })
    
    if (error || !data.session) {
      recordFailedAttempt(ip)
      logSecurityEvent('SETUP_FAILED', ip, { error: error?.message || 'Token verification failed' })
      
      return NextResponse.json({ 
        error: error?.message || 'Invalid or expired invitation token',
        success: false,
        remainingAttempts: blockStatus.remainingAttempts 
      }, { status: 400 })
    }

    // Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })
    
    if (updateError) {
      recordFailedAttempt(ip)
      logSecurityEvent('SETUP_FAILED', ip, { error: updateError.message })
      
      return NextResponse.json({ 
        error: updateError.message || 'Password update failed',
        success: false,
        remainingAttempts: blockStatus.remainingAttempts 
      }, { status: 400 })
    }

    // Setup successful - reset attempts
    resetAttempts(ip)
    logSecurityEvent('SETUP_SUCCESS', ip)

    // Set authentication cookies
    const response = NextResponse.json({ 
      success: true,
      message: 'Password setup completed successfully' 
    })
    
    // Set access token cookie
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })
    
    // Set refresh token cookie
    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: '/'
    })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
    
  } catch (error) {
    const ip = getClientIP(request)
    recordFailedAttempt(ip)
    logSecurityEvent('SETUP_ERROR', ip, { error: error instanceof Error ? error.message : 'Unknown error' })
    
    console.error('Setup password error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false 
    }, { status: 500 })
  }
} 