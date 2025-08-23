import { Hono } from 'hono'
import { validateSession } from '../middleware/auth'

const contactsRoutes = new Hono()

// --- Get all contacts ---
contactsRoutes.get('/', async (c) => {
  if (!validateSession(c)) return c.json({ error: 'Unauthorized' }, 401)

  const result = await c.env.DB.prepare('SELECT * FROM contacts').all()
  return c.json(result.results)
})

// --- Add a contact ---
contactsRoutes.post('/', async (c) => {
  if (!validateSession(c)) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json<{ name: string; phone: string }>()
  const { name, phone } = body

  const stmt = c.env.DB.prepare('INSERT INTO contacts (name, phone) VALUES (?, ?)')
  const result = await stmt.bind(name, phone).run()

  return c.json({ success: true, id: result.lastRowId })
})

// --- Delete a contact ---
contactsRoutes.delete('/:id', async (c) => {
  if (!validateSession(c)) return c.json({ error: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const stmt = c.env.DB.prepare('DELETE FROM contacts WHERE id = ?')
  const result = await stmt.bind(id).run()

  return c.json({ success: result.changes > 0 })
})

export default contactsRoutes
