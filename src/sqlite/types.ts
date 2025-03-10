// Define LibSQLOptions interface to avoid direct dependency
interface LibSQLOptions {
  url?: string;
  authToken?: string;
  tls?: boolean;
  syncUrl?: string;
  syncInterval?: number;
  encryption?: {
    key: string;
  };
}

/**
 * Options for configuring the SQLite connection
 */
export type SqliteOptions = { 
  /**
   * The database schema
   */
  schema: Record<string, unknown>;
  
  /**
   * Database file path or URL
   * For SQLite: path to the database file (e.g., 'sqlite.db')
   * For Turso: connection URL (e.g., 'libsql://my-db.turso.io')
   */
  url?: string;
  
  /**
   * Database driver type
   * - 'sqlite': Use SQLite (default)
   * - 'turso': Use Turso (LibSQL)
   */
  driver?: 'sqlite' | 'turso';
  
  /**
   * Turso auth token (required for Turso)
   */
  authToken?: string;
  
  /**
   * Additional LibSQL options for Turso
   */
  libsqlOptions?: Omit<LibSQLOptions, 'url' | 'authToken'>;
  
  /**
   * Whether to use an in-memory database (SQLite only)
   */
  memory?: boolean;
}; 