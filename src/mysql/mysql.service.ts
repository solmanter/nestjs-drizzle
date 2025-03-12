import 'dotenv/config';
import { Injectable, Logger } from "@nestjs/common";
import { type MySql2Database } from "drizzle-orm/mysql2";
import {
  CreateMySqlSelectFromBuilderMode,
  MySqlInsertValue,
  MySqlTable,
  SelectedFields,
} from "drizzle-orm/mysql-core";
import { getTableColumns, Simplify, SQL } from "drizzle-orm";
import { GetSelectTableName } from "drizzle-orm/query-builders/select.types";
import type { ResultSetHeader } from 'mysql2';

@Injectable()
export class DrizzleService<
  TSchema extends Record<string, unknown> = Record<string, never>
> {
  private readonly logger = new Logger(DrizzleService.name);

  constructor(public db: MySql2Database<TSchema>) {
    this.logger.log('MySQL database connection established');
  }

  get<T extends MySqlTable, TSelect extends SelectedFields | Simplify<T['_']['columns']> = Simplify<T['_']['columns']>>(from: T, select?: TSelect):
    CreateMySqlSelectFromBuilderMode<"db", GetSelectTableName<T>, TSelect extends SelectedFields ? Simplify<TSelect> : Simplify<T['_']['columns']>, "partial", any> {
    return this.db.select(select as SelectedFields).from(from) as any;
  }

  getWithout<T extends MySqlTable, TSelect extends Partial<Record<keyof T['_']['columns'], true>>>(table: T, select?: TSelect):
    CreateMySqlSelectFromBuilderMode<"db", GetSelectTableName<T>, Simplify<Omit<T['_']['columns'], keyof TSelect>>, "partial", any> {
    const columns = getTableColumns(table);
    const resultColumns = select ? Object.fromEntries(
      Object.entries(columns).filter(([key]) => !Object.keys(select || {}).includes(key))
    ) as T["_"]["columns"] : columns;
    return this.get(table, resultColumns);
  }

  update<T extends MySqlTable>(table: T, set: Partial<T["$inferSelect"]>) {
    return this.db.update(table).set(set);
  }

  insert<T extends MySqlTable>(table: T, set: MySqlInsertValue<T>) {
    return this.db.insert(table).values(set);
  }

  insertMany<T extends MySqlTable>(
    table: T,
    values: MySqlInsertValue<T>[]
  ) {
    return this.db.insert(table).values(values);
  }

  delete(table: MySqlTable) {
    return this.db.delete(table);
  }

  /**
   * Execute a raw SQL query
   * @param query SQL query to execute
   * @returns Promise resolving to the query result
   */
  execute<T = unknown>(query: SQL<unknown>): Promise<T> {
    return this.db.execute(query) as any;
  }

  /**
   * Execute a transaction
   * @param callback Function to execute within the transaction
   * @returns Promise resolving to the result of the callback
   */
  transaction<T>(callback: (tx: MySql2Database<TSchema>) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  get query() {
    return this.db.query;
  }
}
