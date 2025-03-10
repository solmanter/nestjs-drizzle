import { DynamicModule, Module, Logger } from "@nestjs/common";
import { DrizzleService } from "./mysql.service";
import { Mysql2Options } from "./types";
import "dotenv/config";
import { Connection, Pool } from "mysql2";
import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";

function databaseWithDefault(connectionString?: string): string {
  if (!connectionString && !process.env.DATABASE_URL) {
    throw new Error("Database connection string is required. Provide it via options or DATABASE_URL environment variable.");
  }
  return connectionString || process.env.DATABASE_URL!;
}

@Module({})
export class DrizzleModule {
  private static readonly logger = new Logger(DrizzleModule.name);

  static forRoot(options: Mysql2Options): DynamicModule {
    try {
      const { schema, connectionString, driver = 'mysql', planetscale, ...connectionOpts } = options;

      // Handle different drivers
      if (driver === 'planetscale') {
        // PlanetScale setup
        try {
          // Dynamically import PlanetScale dependencies
          // @ts-ignore - Dynamically require @planetscale/database
          const { connect } = require('@planetscale/database');
          // @ts-ignore - Dynamically require drizzle-orm/planetscale-serverless
          const { drizzle: drizzlePlanetScale } = require('drizzle-orm/planetscale-serverless');
          
          // Get connection details
          const url = connectionString || process.env.DATABASE_URL;
          const { host, username, password, database, ssl } = planetscale || {};
          
          // Create connection
          const connection = connect({
            host: host,
            username: username,
            password: password,
            database: database,
            url: url,
            ssl: ssl
          });
          
          // Create Drizzle instance
          const db = drizzlePlanetScale(connection, { schema });
          this.logger.log('PlanetScale database connection established');
          
          return this.createModule(
            {
              provide: DrizzleService,
              useFactory: () => new DrizzleService(db),
            },
          );
        } catch (error) {
          this.logger.error(`Failed to load PlanetScale dependencies. Make sure @planetscale/database and drizzle-orm are installed: ${error.message}`);
          throw error;
        }
      } else {
        // Standard MySQL setup
        let client: Connection | Pool;

        if (options.pool) {
          // Use pool
          const poolOptions = options.pool || {
            uri: databaseWithDefault(connectionString)
          };
          client = mysql.createPool(poolOptions);
          this.logger.log('Created MySQL connection pool');
        } else {
          // Use connection
          const connectionOptions = options.connection || {
            uri: databaseWithDefault(connectionString)
          };
          client = mysql.createConnection(connectionOptions);
          this.logger.log('Created MySQL connection');
        }

        return this.createModule(
          {
            provide: DrizzleService,
            useFactory: () => new DrizzleService(drizzle(client, schema)),
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to create MySQL connection', error);
      throw error;
    }
  }

  private static createModule(
    provider: {
      provide: typeof DrizzleService;
      useFactory: () => DrizzleService<Record<string, unknown>>;
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
