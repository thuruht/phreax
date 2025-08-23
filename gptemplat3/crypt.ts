import { Context, Next } from 'hono'

// Simple in-memory session store (replace with KV/D1 in production)
const sessions = new Map<string, string>()

// --- Utility: Generate session ID ---
function generateSessionId(): string {
  return crypto.randomUUID()
}

// --- Utility: Hash password with PBKDF2 ---
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )
  return btoa(String.fromCharCode(...new Uint8Array(bits)))
}

// --- Middleware ---
export async function authMiddleware(c: Context, next: Next) {
  const sid = c.req.cookie('session_id')
  if (sid && sessions.has(sid)) {
    // Attach user info to context if needed
    c.set('user', sessions.get(sid))
  }
  await next()
}

// --- Session helpers ---
export function createSession(c: Context, username: string) {
  const sid = generateSessionId()
  sessions.set(sid, username)

  const isProduction = globalThis.isProduction ?? false
  c.cookie('session_id', sid, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 day
  })
}

export function destroySession(c: Context) {
  const sid = c.req.cookie('session_id')
  if (sid) sessions.delete(sid)
  c.cookie('session_id', '', { maxAge: 0, path: '/' })
}

export function validateSession(c: Context): boolean {
  const sid = c.req.cookie('session_id')
  return !!(sid && sessions.has(sid))
}
