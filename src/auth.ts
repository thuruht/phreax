import { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// Session interface
interface Session {
    userId: string;
    expires: number;
}

// Generate session ID
function generateSessionId(): string {
    return crypto.randomUUID();
}

// Create session
export async function createSession(c: Context, userId: string): Promise<void> {
    const sessionId = generateSessionId();
    const sessionDuration = parseInt(c.env.SESSION_DURATION || '604800'); // Default 7 days
    const expires = Math.floor(Date.now() / 1000) + sessionDuration;
    
    const session: Session = {
        userId,
        expires
    };
    
    // Store session in KV
    await c.env.PHON_K.put(sessionId, JSON.stringify(session), {
        expiration: expires
    });
    
    // Set cookie - use secure flag only in production
    const isProduction = c.env.ENVIRONMENT === 'production';
    setCookie(c, 'session_id', sessionId, {
        path: '/',
        maxAge: sessionDuration,
        httpOnly: true,
        secure: true, // Always use secure for HTTPS
        sameSite: 'None' // Allow cross-site usage if needed
    });
}

// Validate session
export async function validateSession(c: Context): Promise<string | null> {
    const sessionId = getCookie(c, 'session_id');
    if (!sessionId) {
        return null;
    }
    
    const sessionData = await c.env.PHON_K.get(sessionId);
    if (!sessionData) {
        return null;
    }
    
    try {
        const session: Session = JSON.parse(sessionData);
        
        // Check if session is expired
        if (session.expires < Math.floor(Date.now() / 1000)) {
            await c.env.PHON_K.delete(sessionId);
            return null;
        }
        
        return session.userId;
    } catch (error) {
        console.error('Error parsing session data:', error);
        return null;
    }
}

// Destroy session
export async function destroySession(c: Context): Promise<void> {
    const sessionId = getCookie(c, 'session_id');
    if (sessionId) {
        await c.env.PHON_K.delete(sessionId);
    }
    
    deleteCookie(c, 'session_id');
}

// Hash password using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert ArrayBuffer to base64
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    return hashBase64;
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}
