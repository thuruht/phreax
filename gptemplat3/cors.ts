import { Context, Next } from 'hono'

// Whitelist allowed origins (adjust for your setup)
const allowedOrigins = [
  'https://fone.farewellcafe.com',
  'http://localhost:8787'
]

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin')

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Credentials', 'true')
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  }

  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  await next()
}
