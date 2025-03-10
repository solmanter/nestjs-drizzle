import { ConnectionOptions, PoolOptions } from "mysql2";

/**
 * Options for configuring the MySQL connection
 */
export type Mysql2Options = { 
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
   * - 'mysql': Use MySQL/MySQL2 (default)
   * - 'planetscale': Use PlanetScale
   */
  driver?: 'mysql' | 'planetscale';
  
  /**
   * PlanetScale specific options (only used when driver is 'planetscale')
   */
  planetscale?: {
    /**
     * PlanetScale host
     */
    host?: string;
    
    /**
     * PlanetScale username
     */
    username?: string;
    
    /**
     * PlanetScale password
     */
    password?: string;
    
    /**
     * Database name
     */
    database?: string;
    
    /**
     * SSL configuration
     */
    ssl?: boolean | { rejectUnauthorized?: boolean };
  };
} & (
  { 
    /**
     * Connection options for mysql2
     */
    connection: ConnectionOptions; 
    pool?: never; 
  } | { 
    /**
     * Pool options for mysql2
     */
    pool: PoolOptions; 
    connection?: never; 
  } | {
    /**
     * For PlanetScale driver, neither connection nor pool is required
     */
    connection?: never;
    pool?: never;
  }
);