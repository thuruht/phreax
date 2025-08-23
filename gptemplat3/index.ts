import { Hono } from 'hono'
import { corsMiddleware } from './middleware/cors'
import { authMiddleware } from './middleware/auth'
import authRoutes from './routes/auth'
import contactsRoutes from './routes/contacts'
import imagesRoutes from './routes/images'

const app = new Hono()

// Apply CORS middleware
globalThis.isProduction = globalThis.isProduction ?? (process.env.NODE_ENV === 'production')
app.use('*', corsMiddleware)

// Session/Auth middleware
app.use('*', authMiddleware)

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/contacts', contactsRoutes)
app.route('/api/images', imagesRoutes)

// Default route
app.get('/', (c) => c.text('Phreax API is running'))

export default app
