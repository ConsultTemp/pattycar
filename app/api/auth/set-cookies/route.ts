import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, isIPBlocked, recordFailedAttempt, resetAttempts, logSecurityEvent } from '@/lib/simple-security'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    
    // Verifica rate limiting
    const blockStatus = isIPBlocked(ip)
    if (blockStatus.blocked) {
      logSecurityEvent('BLOCKED_LOGIN_ATTEMPT', ip, { remainingTime: blockStatus.remainingTime })
      
      return NextResponse.json({ 
        error: `Troppi tentativi di login. Riprova tra ${blockStatus.remainingTime} minuti.`,
        blocked: true,
        remainingTime: blockStatus.remainingTime
      }, { status: 429 })
    }
    
    const { accessToken, refreshToken } = await request.json()
    
    if (!accessToken || !refreshToken) {
      recordFailedAttempt(ip)
      logSecurityEvent('INVALID_LOGIN_REQUEST', ip, { reason: 'missing_tokens' })
      
      return NextResponse.json({ 
        error: 'Missing tokens',
        remainingAttempts: blockStatus.remainingAttempts 
      }, { status: 400 })
    }

    // Login riuscito - reset tentativi
    resetAttempts(ip)
    logSecurityEvent('LOGIN_SUCCESS', ip)

    const response = NextResponse.json({ success: true })
    
    // Set access token cookie - sessione estesa a 30 giorni
    response.cookies.set('sb-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 giorni
      path: '/'
    })
    
    // Set refresh token cookie - sessione estesa a 90 giorni
    response.cookies.set('sb-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 90 * 24 * 60 * 60, // 90 giorni
      path: '/'
    })
    
    // Aggiungi header di sicurezza
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
    
  } catch (error) {
    const ip = getClientIP(request)
    recordFailedAttempt(ip)
    logSecurityEvent('LOGIN_ERROR', ip, { error: error instanceof Error ? error.message : 'Unknown error' })
    
    console.error('Set cookies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 