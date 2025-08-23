/**
 * Authentication middleware for Hono
 */
import { Context, Next } from 'hono';
import { Env } from '../types';
import { validateSession } from '../auth';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // Skip auth check for public routes and login endpoints
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/status'
  ];
  
  if (publicPaths.includes(c.req.path)) {
    return next();
  }
  
  // Skip auth check for static asset requests
  if (!c.req.path.startsWith('/api/')) {
    return next();
  }
  
  // Validate session using auth utility
  const userId = await validateSession(c);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  // Set user ID in context for use in route handlers
  c.set('userId', userId);
  
  return next();
}