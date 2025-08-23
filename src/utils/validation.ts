/**
 * Validation utility functions
 */

/**
 * Validate an email address
 * @param email The email address to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a phone number (basic validation)
 * @param phone The phone number to validate
 * @returns Whether the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  // Allow +, digits, spaces, hyphens, and parentheses
  const phoneRegex = /^[+\d\s\-()]+$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize a string to prevent XSS
 * @param input The string to sanitize
 * @returns A sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate a URL
 * @param url The URL to validate
 * @returns Whether the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a file size
 * @param size The file size in bytes
 * @param maxSize The maximum allowed size in bytes
 * @returns Whether the file size is valid
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Validate allowed file extensions
 * @param filename The filename to validate
 * @param allowedExtensions An array of allowed extensions
 * @returns Whether the file extension is allowed
 */
export function hasAllowedExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return allowedExtensions.includes(extension);
}