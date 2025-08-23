/**
 * CORS middleware for Hono
 */
import { Context, Next } from 'hono';
import { Env } from '../types';

export async function corsMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // Get the origin from the request
  const origin = c.req.header('Origin');

  // List of allowed origins - update these to match your production domains
  const allowedOrigins = [
    'https://phreak.farewellcafe.com',
    'https://fone.farewellcafe.com'
  ];

  // In development, allow localhost origins
  if (c.env.ENVIRONMENT !== 'production') {
    allowedOrigins.push('http://localhost:8787');
    allowedOrigins.push('http://127.0.0.1:8787');
  }

  // Set CORS headers
  if (origin && (allowedOrigins.includes(origin) || c.env.ENVIRONMENT !== 'production')) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    c.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  await next();
}