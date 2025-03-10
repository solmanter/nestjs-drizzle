// src/postgres/types.ts
import type { PoolConfig } from 'pg';

/**
 * Options for configuring the PostgreSQL connection
 */
export type PostgresOptions = {
  /**
   * The database schema
   */
  schema: Record<string, unknown>;
  
  /**
   * Database connection string (optional, can also be set via DATABASE_URL environment variable)
   */
  connectionString?: string;
  
  /**
   * Driver type
   * - 'pool': Use node-postgres pool (default)
   * - 'client': Use node-postgres client
   * - 'neon': Use Neon serverless
   * - 'vercel': Use Vercel Postgres
   */
  driver?: 'pool' | 'client' | 'neon' | 'vercel';
  
  /**
   * Additional connection options for node-postgres
   */
  connection?: Omit<PoolConfig, 'connectionString'>;
  
  /**
   * Neon specific options (only used when driver is 'neon')
   */
  neon?: {
    /**
     * Whether to use the HTTP protocol (default: false)
     */
    useHttp?: boolean;
    
    /**
     * Fetch implementation for HTTP protocol
     */
    fetchImplementation?: typeof fetch;
    
    /**
     * Maximum number of connections (for WebSocket pool)
     */
    maxConnections?: number;
    
    /**
     * End session on connection close
     */
    endSessionOnClose?: boolean;
  };
  
  /**
   * Vercel specific options (only used when driver is 'vercel')
   */
  vercel?: {
    /**
     * Pooling configuration
     */
    pooling?: boolean;
    
    /**
     * Maximum number of connections
     */
    maxConnections?: number;
    
    /**
     * Maximum idle time (in milliseconds)
     */
    maxIdleTime?: number;
  };
};

// Added for better type safety
export type DrizzleSchema = Record<string, unknown>;