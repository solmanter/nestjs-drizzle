// src/postgres/postgres.service.ts
import 'dotenv/config';
import { Injectable, Logger } from "@nestjs/common";
import { drizzle, NodePgClient, NodePgDatabase } from "drizzle-orm/node-postgres";
import { getTableColumns, Simplify, SQL } from "drizzle-orm";
import type {
  CreatePgSelectFromBuilderMode,
  PgInsertValue,
  PgTable,
  SelectedFields,
} from "drizzle-orm/pg-core";
import { GetSelectTableName } from "drizzle-orm/query-builders/select.types";
import { PostgresOptions } from './types';
import { Pool, QueryResult } from 'pg';

function databaseWithDefault(connectionString?: string): string {
  if (!connectionString && !process.env.DATABASE_URL) {
    throw new Error("Database connection string is required. Provide it via options or DATABASE_URL environment variable.");
  }
  return connectionString || process.env.DATABASE_URL!;
}

@Injectable()
export class DrizzleService<TSchema extends Record<string, unknown> = Record<string, unknown>> {
  private readonly logger = new Logger(DrizzleService.name);
  public db: NodePgDatabase<TSchema>;

  constructor(options: PostgresOptions) {
    const { schema, connectionString, ...connection } = options;

    try {
      if (options?.driver === 'pool') {
        const pool = new Pool({ connectionString: databaseWithDefault(connectionString) });
        this.db = drizzle({
          client: pool,
          schema,
          ...connection
        }) as NodePgDatabase<TSchema> & { $client: Pool };
      } else {
        this.db = drizzle({
          connection: {
            connectionString: databaseWithDefault(connectionString),
            ...connection
          },
          schema: options.schema
        }) as NodePgDatabase<TSchema> & { $client: NodePgClient };
      }
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to establish database connection', error);
      throw error;
    }
  }

  get<
    T extends PgTable,
    TSelect extends SelectedFields | Simplify<T['$inferSelect']> | undefined = undefined
  >(
    from: T,
    select?: TSelect
  ): CreatePgSelectFromBuilderMode<
    "db",
    GetSelectTableName<T>,
    TSelect extends SelectedFields ? Simplify<TSelect> : Simplify<T['_']['columns']>,
    "partial"
  > {
    return this.db.select(select as SelectedFields).from(from) as any;
  }

  getWithout<
    T extends PgTable,
    TSelect extends Partial<Record<keyof T['_']['columns'], true>> | undefined = undefined
  >(
    table: T,
    select?: TSelect
  ): CreatePgSelectFromBuilderMode<
    "db",
    GetSelectTableName<T>,
    Simplify<Omit<T['_']['columns'], keyof TSelect>>,
    "partial"
  > {
    const columns = getTableColumns(table);
    const resultColumns = Object.fromEntries(
      Object.entries(columns).filter(([key]) => !Object.keys(select || {}).includes(key))
    ) as T["_"]["columns"];
    return this.get(table, resultColumns);
  }

  update<T extends PgTable>(
    table: T,
    set: Partial<T['$inferSelect']>
  ) {
    return this.db.update(table).set(set);
  }

  insert<T extends PgTable>(
    table: T,
    set: PgInsertValue<T> & Partial<T['$inferSelect']>
  ) {
    return this.db.insert(table).values(set);
  }

  insertMany<T extends PgTable>(
    table: T,
    values: (PgInsertValue<T> & Partial<T['$inferSelect']>)[]
  ) {
    return this.db.insert(table).values(values);
  }

  delete<T extends PgTable>(table: T) {
    return this.db.delete(table);
  }

  transaction<T>(callback: (tx: NodePgDatabase<TSchema>) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  /**
   * Execute a raw SQL query
   * @param query SQL query to execute
   * @returns Promise resolving to the query result
   */
  execute<T = unknown>(query: SQL<unknown>): Promise<QueryResult<T>> {
    return this.db.execute(query) as unknown as Promise<QueryResult<T>>;
  }

  get query() {
    return this.db.query;
  }
}