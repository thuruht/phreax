/**
 * Main entry point for the Phreaky Phonebook application
 */
import { Hono } from 'hono';
import { Env } from './types';
import { corsMiddleware } from './middleware/cors';
import { errorHandlerMiddleware } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';

// Initialize the Hono app
const app = new Hono<{ Bindings: Env }>();

// Apply global middlewares
app.use('*', errorHandlerMiddleware);
app.use('*', corsMiddleware);
app.use('/api/*', authMiddleware);

// Register route handlers
app.route('/api/auth', authRoutes);

// Static files - use the Assets binding for modern static asset serving
app.get('/*', async (c) => {
  // For any remaining requests, try to serve from static assets
  return c.env.ASSETS.fetch(c.req.raw);
});

// Export the app
export default app;