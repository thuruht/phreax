/**
 * Database utility functions
 */
import { Env } from '../types';

/**
 * Execute a database query with error handling
 * @param db The D1 database instance
 * @param query The SQL query to execute
 * @param params The query parameters
 * @returns The query result
 */
export async function executeQuery<T = any>(
  db: D1Database, 
  query: string, 
  params: any[] = []
): Promise<{ success: boolean; results?: T[]; error?: string }> {
  try {
    const statement = db.prepare(query);
    const result = await statement.bind(...params).all<T>();
    return { success: true, results: result.results };
  } catch (error) {
    console.error('Database error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

/**
 * Execute a database write operation with error handling
 * @param db The D1 database instance
 * @param query The SQL query to execute
 * @param params The query parameters
 * @returns The operation result
 */
export async function executeWrite(
  db: D1Database, 
  query: string, 
  params: any[] = []
): Promise<{ success: boolean; lastRowId?: number; error?: string }> {
  try {
    const statement = db.prepare(query);
    const result = await statement.bind(...params).run();
    return { 
      success: result.success, 
      lastRowId: result.meta?.last_row_id 
    };
  } catch (error) {
    console.error('Database write error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

/**
 * Get a single record from the database
 * @param db The D1 database instance
 * @param query The SQL query to execute
 * @param params The query parameters
 * @returns The query result
 */
export async function getSingleRecord<T = any>(
  db: D1Database, 
  query: string, 
  params: any[] = []
): Promise<{ success: boolean; record?: T; error?: string }> {
  try {
    const result = await executeQuery<T>(db, query, params);
    if (!result.success) {
      return result;
    }
    
    return { 
      success: true, 
      record: result.results && result.results.length > 0 ? result.results[0] : undefined
    };
  } catch (error) {
    console.error('Database error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}