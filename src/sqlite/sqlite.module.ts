import { DynamicModule, Module, Logger } from "@nestjs/common";
import { DrizzleService } from "./sqlite.service";
import { SqliteOptions } from "./types";
import "dotenv/config";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleTurso } from "drizzle-orm/libsql";

function getDefaultUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database URL is required. Provide it via options or DATABASE_URL environment variable.");
  }
  return process.env.DATABASE_URL;
}

@Module({})
export class DrizzleModule {
  private static readonly logger = new Logger(DrizzleModule.name);

  static forRoot(options: SqliteOptions): DynamicModule {
    try {
      const { schema, url, driver = 'sqlite', memory, authToken, libsqlOptions } = options;
      const dbUrl = url || getDefaultUrl();
      
      let db;
      
      if (driver === 'turso') {
        // Turso (LibSQL) setup
        if (!authToken && !process.env.TURSO_AUTH_TOKEN) {
          throw new Error("Turso auth token is required. Provide it via options or TURSO_AUTH_TOKEN environment variable.");
        }
        
        try {
          const { createClient } = require('@libsql/client');
          
          const client = createClient({
            url: dbUrl,
            authToken: authToken || process.env.TURSO_AUTH_TOKEN!,
            ...libsqlOptions
          });
          
          db = drizzleTurso(client, { schema });
          this.logger.log('Turso database connection established');
        } catch (error) {
          throw new Error(`Failed to load @libsql/client. Make sure it's installed: ${error.message}`);
        }
      } else {
        // SQLite setup
        try {
          const BetterSQLite3 = require('better-sqlite3');
          const sqlite = new BetterSQLite3(memory ? ':memory:' : dbUrl);
          db = drizzleSQLite(sqlite, { schema });
          this.logger.log('SQLite database connection established');
        } catch (error) {
          throw new Error(`Failed to load better-sqlite3. Make sure it's installed: ${error.message}`);
        }
      }

      return this.createModule(
        {
          provide: DrizzleService,
          useFactory: () => new DrizzleService(db),
        },
      );
    } catch (error) {
      this.logger.error('Failed to create database connection', error);
      throw error;
    }
  }

  private static createModule(
    provider: {
      provide: typeof DrizzleService;
      useFactory: () => DrizzleService;
    },
  ) {
    return {
      module: DrizzleModule,
      providers: [provider],
      exports: [DrizzleService],
      global: true,
    };
  }
} 