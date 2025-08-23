/**
 * Cloudflare Workers Environment Bindings
 * Defines all the bindings available in the Worker environment
 */
export interface Env {
  // Database binding
  DB: D1Database;
  
  // KV namespaces
  PHON_K: KVNamespace;
  PHREAK_KV: KVNamespace;
  
  // R2 bucket for images
  phr3img: R2Bucket;
  
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