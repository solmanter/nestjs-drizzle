import 'dotenv/config';
import { Injectable, Logger } from "@nestjs/common";
import { getTableColumns, Simplify, SQL } from "drizzle-orm";
import { GetSelectTableName } from "drizzle-orm/query-builders/select.types";
import { 
  SQLiteTable, 
  SelectedFields, 
  CreateSQLiteSelectFromBuilderMode 
} from "drizzle-orm/sqlite-core";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { LibSQLDatabase } from "drizzle-orm/libsql";

// Union type for both SQLite and Turso databases
export type SQLiteOrTursoDatabase<TSchema extends Record<string, unknown>> = 
  | BetterSQLite3Database<TSchema>
  | LibSQLDatabase<TSchema>;

@Injectable()
export class DrizzleService<TSchema extends Record<string, unknown> = Record<string, unknown>> {
  private readonly logger = new Logger(DrizzleService.name);
  public db: SQLiteOrTursoDatabase<TSchema>;

  constructor(db: SQLiteOrTursoDatabase<TSchema>) {
    this.db = db;
    this.logger.log('SQLite/Turso database connection established');
  }

  get<T extends SQLiteTable, TSelect = undefined>(
    from: T,
    select?: TSelect
  ) {
    // @ts-ignore - Handle different database implementations
    return this.db.select(select as any).from(from);
  }

  getWithout<T extends SQLiteTable, TSelect = undefined>(
    table: T,
    select?: TSelect
  ) {
    const columns = getTableColumns(table);
    const resultColumns = Object.fromEntries(
      Object.entries(columns).filter(([key]) => !Object.keys(select || {}).includes(key))
    ) as any;
    return this.get(table, resultColumns);
  }

  update<T extends SQLiteTable>(
    table: T,
    set: Partial<T['$inferSelect']>
  ) {
    return this.db.update(table).set(set);
  }

  insert<T extends SQLiteTable>(
    table: T,
    set: T["$inferInsert"] & Partial<T["$inferSelect"]>
  ) {
    return this.db.insert(table).values(set);
  }

  insertMany<T extends SQLiteTable>(
    table: T,
    values: (T["$inferInsert"] & Partial<T["$inferSelect"]>)[]
  ) {
    return this.db.insert(table).values(values);
  }

  delete<T extends SQLiteTable>(table: T) {
    return this.db.delete(table);
  }

  /**
   * Execute a raw SQL query
   * @param query SQL query to execute
   * @returns Promise resolving to the query result
   */
  execute<T = unknown>(query: SQL<unknown>): Promise<T> {
    // Handle both sync and async implementations
    const result = this.db.run(query);
    return Promise.resolve(result as unknown as T);
  }

  /**
   * Execute a transaction
   * @param callback Function to execute within the transaction
   * @returns Promise resolving to the result of the callback
   */
  transaction<T>(callback: (tx: any) => Promise<T> | T): Promise<T> {
    return Promise.resolve(this.db.transaction(callback as any));
  }

  get query() {
    return this.db.query;
  }
} 