// src/postgres/postgres.service.ts
import 'dotenv/config';
import { Injectable, Logger } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getTableColumns, Simplify, SQL } from "drizzle-orm";
import type {
  CreatePgSelectFromBuilderMode,
  PgInsertValue,
  PgTable,
  SelectedFields,
} from "drizzle-orm/pg-core";
import { GetSelectTableName } from "drizzle-orm/query-builders/select.types";
import { QueryResult } from 'pg';

// Union type for all PostgreSQL-compatible databases
export type PostgresDatabase<TSchema extends Record<string, unknown>> = 
  | NodePgDatabase<TSchema>
  | any; // This allows for Neon and Vercel Postgres databases

@Injectable()
export class DrizzleService<TSchema extends Record<string, unknown> = Record<string, unknown>> {
  private readonly logger = new Logger(DrizzleService.name);
  public db: PostgresDatabase<TSchema>;

  constructor(db: PostgresDatabase<TSchema>) {
    this.db = db;
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

  /**
   * Execute a raw SQL query
   * @param query SQL query to execute
   * @returns Promise resolving to the query result
   */
  execute<T = unknown>(query: SQL<unknown>): Promise<QueryResult<T>> {
    return this.db.execute(query) as unknown as Promise<QueryResult<T>>;
  }

  /**
   * Execute a transaction
   * @param callback Function to execute within the transaction
   * @returns Promise resolving to the result of the callback
   */
  transaction<T>(callback: (tx: PostgresDatabase<TSchema>) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  get query() {
    return this.db.query;
  }
}