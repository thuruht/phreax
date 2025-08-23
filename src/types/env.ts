/**
 * Cloudflare Workers Environment Bindings
 * Defines all the bindings available in the Worker environment
 */

// Import the Cloudflare Workers types
// These would be available with @cloudflare/workers-types
// You'd typically import them, but we're defining them inline for simplicity
type D1Database = any;
type KVNamespace = any;
type R2Bucket = any;
type Fetcher = any;

export interface Env {
  // Database binding
  DB: D1Database;
  
  // KV namespaces
  PHON_K: KVNamespace;
  PHREAK_KV: KVNamespace;
  
  // R2 bucket for images
  phr3img: R2Bucket;
  IMAGES: R2Bucket;
  
  // Static assets binding (modern approach)
  ASSETS: Fetcher;
  
  // Secrets
  DIRECTORY_PASSWORD_HASH: string;
  SESSION_SECRET: string;
  
  // Environment variables
  SESSION_DURATION: string;
  ENVIRONMENT?: string;
  
  // Optional image delivery configuration
  IMAGES_ACCOUNT_HASH?: string;
}