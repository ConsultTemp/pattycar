import { NextRequest } from 'next/server'

// Configurazione semplice
const SECURITY_CONFIG = {
  MAX_ATTEMPTS: 5,
  WINDOW_TIME: 15 * 60 * 1000, // 15 minuti
  BLOCK_TIME: 15 * 60 * 1000,  // 15 minuti di blocco
}

// Store in memoria per rate limiting
const attemptStore = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>()

// Pulisce automaticamente i vecchi tentativi
function cleanupOldAttempts() {
  const now = Date.now()
  for (const [ip, data] of attemptStore.entries()) {
    // Rimuovi se è passato più tempo della finestra temporale e non è bloccato
    if (now - data.firstAttempt > SECURITY_CONFIG.WINDOW_TIME && (!data.blockedUntil || now > data.blockedUntil)) {
      attemptStore.delete(ip)
    }
  }
}

// Estrai IP dalla richiesta
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         '127.0.0.1'
}

// Controlla se IP è bloccato
export function isIPBlocked(ip: string): { blocked: boolean; remainingTime?: number; remainingAttempts?: number } {
  cleanupOldAttempts()
  
  const attempt = attemptStore.get(ip)
  if (!attempt) {
    return { blocked: false, remainingAttempts: SECURITY_CONFIG.MAX_ATTEMPTS }
  }
  
  const now = Date.now()
  
  // Controllo se è bloccato
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    return { 
      blocked: true, 
      remainingTime: Math.ceil((attempt.blockedUntil - now) / 1000 / 60) // minuti
    }
  }
  
  // Reset se è passato il tempo di blocco
  if (attempt.blockedUntil && now >= attempt.blockedUntil) {
    attemptStore.delete(ip)
    return { blocked: false, remainingAttempts: SECURITY_CONFIG.MAX_ATTEMPTS }
  }
  
  // Reset se è passata la finestra temporale
  if (now - attempt.firstAttempt > SECURITY_CONFIG.WINDOW_TIME) {
    attemptStore.delete(ip)
    return { blocked: false, remainingAttempts: SECURITY_CONFIG.MAX_ATTEMPTS }
  }
  
  return { 
    blocked: false, 
    remainingAttempts: SECURITY_CONFIG.MAX_ATTEMPTS - attempt.count 
  }
}

// Registra tentativo fallito
export function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const attempt = attemptStore.get(ip)
  
  if (!attempt) {
    attemptStore.set(ip, { count: 1, firstAttempt: now })
    console.log(`🔒 Login failed for IP ${ip} (1/${SECURITY_CONFIG.MAX_ATTEMPTS})`)
  } else {
    attempt.count++
    
    if (attempt.count >= SECURITY_CONFIG.MAX_ATTEMPTS) {
      attempt.blockedUntil = now + SECURITY_CONFIG.BLOCK_TIME
      console.log(`🚨 IP ${ip} blocked for ${SECURITY_CONFIG.BLOCK_TIME / 1000 / 60} minutes after ${attempt.count} failed attempts`)
    } else {
      console.log(`🔒 Login failed for IP ${ip} (${attempt.count}/${SECURITY_CONFIG.MAX_ATTEMPTS})`)
    }
  }
}

// Reset tentativi dopo login riuscito
export function resetAttempts(ip: string): void {
  attemptStore.delete(ip)
  console.log(`✅ Login successful for IP ${ip} - attempts reset`)
}

// Logging sicurezza base
export function logSecurityEvent(type: string, ip: string, details?: any): void {
  const timestamp = new Date().toISOString()
  console.log(`🔐 [${timestamp}] Security Event: ${type} from ${ip}`, details ? JSON.stringify(details) : '')
}

// Pulisci store periodicamente (ogni ora)
setInterval(cleanupOldAttempts, 60 * 60 * 1000) 