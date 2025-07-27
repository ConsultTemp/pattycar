import { cookies } from "next/headers"
import crypto from "crypto"

// Validazione delle variabili d'ambiente
if (!process.env.ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required")
}

// Configurazione di sicurezza
export const AUTH_CONFIG = {
  // Password da variabile d'ambiente
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  SESSION_DURATION: process.env.SESSION_DURATION ? parseInt(process.env.SESSION_DURATION) : 30 * 60 * 1000, // 30 minuti
  MAX_LOGIN_ATTEMPTS: process.env.MAX_LOGIN_ATTEMPTS ? parseInt(process.env.MAX_LOGIN_ATTEMPTS) : 3,
  LOCKOUT_DURATION: process.env.LOCKOUT_DURATION ? parseInt(process.env.LOCKOUT_DURATION) : 15 * 60 * 1000, // 15 minuti di blocco
  COOKIE_NAME: "patty_admin_session",
}

// Store in memoria per i tentativi
const loginAttempts = new Map<string, { attempts: number; timestamp: number; lockedUntil?: number }>()

// Genera un token sicuro
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Genera hash sicuro per la password (usando SHA-256 con salt)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

// Verifica password con hash
function verifyPasswordHash(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(":")
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex")
  return hash === verifyHash
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

// Configurazione sicura per la sessione
const SESSION_COOKIE = AUTH_CONFIG.COOKIE_NAME

// Verifica password (confronto sicuro in tempo costante)
export function verifyPassword(password: string): boolean {
  // Usa timingSafeEqual per evitare timing attacks
  const providedBuffer = Buffer.from(password, "utf8")
  const expectedBuffer = Buffer.from(AUTH_CONFIG.ADMIN_PASSWORD, "utf8")
  
  // Assicura che i buffer abbiano la stessa lunghezza per evitare early return
  if (providedBuffer.length !== expectedBuffer.length) {
    // Esegui comunque il confronto per evitare timing attacks
    crypto.timingSafeEqual(
      Buffer.alloc(expectedBuffer.length, 0),
      expectedBuffer
    )
    return false
  }
  
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
}

// Crea sessione con token sicuro
export async function createSession(): Promise<void> {
  const sessionToken = generateSecureToken()
  
  ;(await cookies()).set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: Math.floor(AUTH_CONFIG.SESSION_DURATION / 1000), // Converti in secondi
    path: "/",
  })
}

// Verifica sessione
export async function verifySession(): Promise<boolean> {
  const session = (await cookies()).get(SESSION_COOKIE)
  return !!session?.value && session.value.length === 64 // Token deve essere di 64 caratteri hex
}

// Elimina sessione
export async function destroySession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}

// Log di sicurezza migliorato
export function logSecurityEvent(event: string, details?: any): void {
  const timestamp = new Date().toISOString()
  const sanitizedDetails = typeof details === "object" ? 
    JSON.stringify(details, null, 2) : 
    String(details || "")
  
  // In produzione, potresti voler inviare questi log a un servizio di monitoring
  if (process.env.NODE_ENV === "production") {
    // TODO: Implementare invio log a servizio esterno
  }
}
