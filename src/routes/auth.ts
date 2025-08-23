/**
 * Authentication routes
 */
import { Hono } from 'hono';
import { Env, AuthRequest, AuthResponse } from '../types';
import { createSession, destroySession, validateSession, verifyPassword } from '../auth';

const authRoutes = new Hono<{ Bindings: Env }>();

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const { password } = await c.req.json<AuthRequest>();
    
    // Verify password against stored hash
    const isValid = await verifyPassword(password, c.env.DIRECTORY_PASSWORD_HASH);
    
    if (!isValid) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'Invalid password' 
      }, 401);
    }
    
    // Create session
    await createSession(c, 'admin');
    
    return c.json<AuthResponse>({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return c.json<AuthResponse>({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Logout endpoint
authRoutes.post('/logout', async (c) => {
  try {
    await destroySession(c);
    return c.json<AuthResponse>({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json<AuthResponse>({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Session status endpoint
authRoutes.get('/status', async (c) => {
  try {
    const userId = await validateSession(c);
    return c.json({ 
      authenticated: !!userId,
      user: userId || undefined
    });
  } catch (error) {
    console.error('Status check error:', error);
    return c.json({ 
      authenticated: false,
      error: 'Error checking authentication status'
    });
  }
});

export default authRoutes;

export default authRoutes;