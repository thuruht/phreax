import { Hono } from 'hono'
import { createSession, destroySession, validateSession, hashPassword } from '../middleware/auth'

const authRoutes = new Hono()

// --- Login ---
authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ username: string; password: string }>()
  const { username, password } = body

  // Example: use env-stored hash
  const expectedHash = c.env.DIRECTORY_PASSWORD_HASH
  const salt = c.env.DIRECTORY_SALT || 'default_salt'

  const passwordHash = await hashPassword(password, salt)

  if (username === 'admin' && passwordHash === expectedHash) {
    createSession(c, username)
    return c.json({ success: true })
  }

  return c.json({ success: false, error: 'Invalid credentials' }, 401)
})

// --- Logout ---
authRoutes.post('/logout', (c) => {
  destroySession(c)
  return c.json({ success: true })
})

// --- Check Session ---
authRoutes.get('/check', (c) => {
  if (validateSession(c)) {
    return c.json({ loggedIn: true, user: c.get('user') })
  }
  return c.json({ loggedIn: false })
})

export default authRoutes
