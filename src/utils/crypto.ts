/**
 * Cryptographic utility functions for hashing and verification
 */

/**
 * Hash a string using SHA-256
 * @param input The string to hash
 * @returns A base64-encoded hash
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert ArrayBuffer to base64
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
  return hashBase64;
}

/**
 * Generate a secure random string
 * @param length The length of the string to generate
 * @returns A random string
 */
export function generateRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a UUID
 * @returns A UUID string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Compare two strings in constant time to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns Whether the strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}