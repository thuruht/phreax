/**
 * Error handling middleware for Hono
 */
import { Context, Next } from 'hono';
import { Env } from '../types';

export async function errorHandlerMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Unhandled error:', error);
    
    // Default error response
    const status = 500;
    const errorMessage = 'Internal Server Error';
    
    // Check if it's a known error type with status
    if (error instanceof Error) {
      // You can extend this with custom error types
      const errorObj = error as any;
      
      if (errorObj.status && typeof errorObj.status === 'number') {
        return c.json(
          { error: errorObj.message || errorMessage },
          errorObj.status
        );
      }
    }
    
    // Return a generic error response for unknown errors
    return c.json({ error: errorMessage }, status);
  }
}