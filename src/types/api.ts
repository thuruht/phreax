/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Error response structure
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Image upload response
 */
export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Database operation result
 */
export interface DbResult<T = any> {
  success: boolean;
  results?: T[];
  meta?: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}