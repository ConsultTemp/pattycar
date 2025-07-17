import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getClientIP, logSecurityEvent } from "@/lib/simple-security"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const ip = getClientIP(request)
    
    // Cancella tutti i cookie di autenticazione
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')
    
    logSecurityEvent('LOGOUT', ip)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    const ip = getClientIP(request)
    logSecurityEvent('LOGOUT_ERROR', ip, { error: error instanceof Error ? error.message : 'Unknown error' })
    
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
