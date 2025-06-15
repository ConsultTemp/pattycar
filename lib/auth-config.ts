import { cookies } from "next/headers"
import crypto from "crypto"

// Configurazione di sicurezza
export const AUTH_CONFIG = {
  // Password hardcoded (in produzione dovrebbe essere in variabile d'ambiente)
  ADMIN_PASSWORD: "PattyCarElite2024!",
  SESSION_DURATION: 30 * 60 * 1000, // 30 minuti
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minuti di blocco
  COOKIE_NAME: "patty_admin_session",
}

// Store in memoria per i tentativi
const loginAttempts = new Map<string, { attempts: number; timestamp: number; lockedUntil?: number }>()

// Genera un token sicuro
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Registra un tentativo di login fallito
export function recordFailedAttempt(sessionId = "default"): void {
  const now = Date.now()
  const attempt = loginAttempts.get(sessionId) || { attempts: 0, timestamp: now }

  attempt.attempts++
  attempt.timestamp = now

  if (attempt.attempts >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = now + AUTH_CONFIG.LOCKOUT_DURATION
  }

  loginAttempts.set(sessionId, attempt)
}

// Verifica se la sessione è bloccata
export function isSessionBlocked(sessionId = "default"): boolean {
  const attempt = loginAttempts.get(sessionId)
  if (!attempt) return false

  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    return true
  }

  // Reset se il lockout è scaduto
  if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
    loginAttempts.delete(sessionId)
    return false
  }

  return false
}

// Reset tentativi dopo login riuscito
export function resetFailedAttempts(sessionId = "default"): void {
  loginAttempts.delete(sessionId)
}

// Password hardcoded
const ADMIN_PASSWORD = "PattyCarElite2024!"
const SESSION_COOKIE = "patty_admin_session"

// Verifica password
export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

// Crea sessione
export async function createSession(): Promise<void> {
  cookies().set(SESSION_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 ore
    path: "/",
  })
}

// Verifica sessione
export async function verifySession(): Promise<boolean> {
  const session = cookies().get(SESSION_COOKIE)
  return session?.value === "authenticated"
}

// Elimina sessione
export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE)
}

// Log di sicurezza semplificato
export function logSecurityEvent(event: string, details?: any): void {
  const timestamp = new Date().toISOString()
  console.log(`[SECURITY] ${timestamp} - ${event}`, details || "")
}
