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
    // Use PBKDF2 with a per-hash salt and return a prefixed format:
    // pbkdf2$<iterations>$<salt_base64>$<derived_base64>
    const encoder = new TextEncoder();
    const iterations = 100_000;

    // Create a random salt (16 bytes)
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const saltBase64 = btoa(String.fromCharCode(...Array.from(saltBytes)));

    // Optionally use a server-side pepper if provided (SESSION_SECRET), to be concatenated to password
    // This provides an extra secret that is not stored with the hash.
    // Note: SESSION_SECRET may be undefined; use empty string in that case.
    // We won't store the pepper in the hash; verification must also include it.
    // The pepper is used by concatenating it to the password before deriving.
    const pepper = (typeof (globalThis as any).SESSION_SECRET !== 'undefined') ? (globalThis as any).SESSION_SECRET : '';

    const saltedPassword = password + pepper;

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(saltedPassword),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: encoder.encode(saltBase64),
            iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );

    const derived = new Uint8Array(derivedBits);
    const derivedBase64 = btoa(String.fromCharCode(...Array.from(derived)));

    return `pbkdf2\$${iterations}\$${saltBase64}\$${derivedBase64}`;
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!hash || typeof hash !== 'string') return false;

    const encoder = new TextEncoder();

    // If stored hash is the new pbkdf2 format
    if (hash.startsWith('pbkdf2$')) {
        try {
            const parts = hash.split('$');
            // parts: ['pbkdf2', iterations, saltBase64, derivedBase64]
            const iterations = parseInt(parts[1], 10);
            const saltBase64 = parts[2];
            const expectedDerived = parts[3];

            const pepper = (typeof (globalThis as any).SESSION_SECRET !== 'undefined') ? (globalThis as any).SESSION_SECRET : '';
            const saltedPassword = password + pepper;

            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(saltedPassword),
                { name: 'PBKDF2' },
                false,
                ['deriveBits']
            );

            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: encoder.encode(saltBase64),
                    iterations,
                    hash: 'SHA-256'
                },
                keyMaterial,
                256
            );

            const derived = new Uint8Array(derivedBits);
            const derivedBase64 = btoa(String.fromCharCode(...Array.from(derived)));
            return derivedBase64 === expectedDerived;
        } catch (e) {
            console.error('Error verifying PBKDF2 hash:', e);
            return false;
        }
    }

    // Legacy: assume raw SHA-256 base64 string (no prefix). Verify for backward compatibility.
    try {
        const pepper = (typeof (globalThis as any).SESSION_SECRET !== 'undefined') ? (globalThis as any).SESSION_SECRET : '';
        const salted = password + pepper;
        const data = encoder.encode(salted);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashBase64 = btoa(String.fromCharCode(...hashArray));
        return hashBase64 === hash;
    } catch (e) {
        console.error('Error verifying legacy SHA-256 hash:', e);
        return false;
    }
}
