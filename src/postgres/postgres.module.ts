// src/postgres/postgres.module.ts
import 'dotenv/config';
import { DynamicModule, Module, Logger } from "@nestjs/common";
import { DrizzleService } from "./postgres.service";
import { PostgresOptions } from "./types";
import { Pool } from 'pg';
import { drizzle } from "drizzle-orm/node-postgres";

function databaseWithDefault(connectionString?: string): string {
  if (!connectionString && !process.env.DATABASE_URL) {
    throw new Error("Database connection string is required. Provide it via options or DATABASE_URL environment variable.");
  }
  return connectionString || process.env.DATABASE_URL!;
}

@Module({})
export class DrizzleModule {
  private static readonly logger = new Logger(DrizzleModule.name);

  static forRoot(options: PostgresOptions): DynamicModule {
    try {
      const { schema, connectionString, driver = 'pool', neon, vercel, ...connection } = options;
      const dbUrl = databaseWithDefault(connectionString);
      
      let db;
      
      // Handle different drivers
      if (driver === 'neon') {
        // Neon serverless setup
        try {
          // Dynamically import Neon dependencies
          // @ts-ignore - Dynamically require @neondatabase/serverless
          const { neon: neonConnect } = require('@neondatabase/serverless');
          // @ts-ignore - Dynamically require drizzle-orm/neon-serverless
          const { drizzle: drizzleNeon } = require('drizzle-orm/neon-serverless');
          
          // Get connection options
          const { useHttp, fetchImplementation, maxConnections, endSessionOnClose } = neon || {};
          
          // Create connection
          const sql = neonConnect(dbUrl, { 
            useHttp, 
            fetchImplementation, 
            maxConnections, 
            endSessionOnClose 
          });
          
          // Create Drizzle instance
          db = drizzleNeon(sql, { schema });
          this.logger.log('Neon database connection established');
        } catch (error) {
          this.logger.error(`Failed to load Neon dependencies. Make sure @neondatabase/serverless and drizzle-orm are installed: ${error.message}`);
          throw error;
        }
      } else if (driver === 'vercel') {
        // Vercel Postgres setup
        try {
          // Dynamically import Vercel dependencies
          // @ts-ignore - Dynamically require @vercel/postgres
          const { createPool } = require('@vercel/postgres');
          // @ts-ignore - Dynamically require drizzle-orm/vercel-postgres
          const { drizzle: drizzleVercel } = require('drizzle-orm/vercel-postgres');
          
          // Get connection options
          const { pooling, maxConnections, maxIdleTime } = vercel || {};
          
          // Create connection
          const pool = createPool({
            connectionString: dbUrl,
            pooling,
            maxConnections,
            maxIdleTime
          });
          
          // Create Drizzle instance
          db = drizzleVercel(pool, { schema });
          this.logger.log('Vercel Postgres database connection established');
        } catch (error) {
          this.logger.error(`Failed to load Vercel dependencies. Make sure @vercel/postgres and drizzle-orm are installed: ${error.message}`);
          throw error;
        }
      } else {
        // Standard PostgreSQL setup
        const pool = new Pool({ 
          connectionString: dbUrl,
          ...connection
        });
        db = drizzle(pool, { schema });
        this.logger.log('PostgreSQL database connection established');
      }

      return this.createModule(
        {
          provide: DrizzleService,
          useFactory: () => new DrizzleService(db),
        },
      );
    } catch (error) {
      this.logger.error('Failed to establish database connection', error);
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