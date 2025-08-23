/**
 * Session data structure
 */
export interface Session {
  userId: string;
  expires: number;
  created_at: number;
}

/**
 * Authentication request data
 */
export interface AuthRequest {
  password: string;
}

/**
 * Authentication response data
 */
export interface AuthResponse {
  success: boolean;
  error?: string;
}

/**
 * Session status response
 */
export interface SessionStatus {
  authenticated: boolean;
  user?: string;
}