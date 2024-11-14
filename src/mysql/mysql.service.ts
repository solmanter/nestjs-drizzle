import { Injectable } from "@nestjs/common";
import { type MySql2Database } from "drizzle-orm/mysql2";
import {
  CreateMySqlSelectFromBuilderMode,
  MySqlTable,
  SelectedFields,
} from "drizzle-orm/mysql-core";
import { getTableColumns, Simplify } from "drizzle-orm";
import { GetSelectTableName } from "drizzle-orm/query-builders/select.types";

@Injectable()
export class DrizzleService<
  TSchema extends Record<string, unknown> = Record<string, never>
> {
  constructor(public db: MySql2Database<TSchema>) { }

  get<T extends MySqlTable, TSelect extends SelectedFields | Simplify<T['$inferSelect']> | undefined>(from: T, select?: TSelect):
    CreateMySqlSelectFromBuilderMode<"db", GetSelectTableName<T>, TSelect extends SelectedFields ? Simplify<TSelect> : Simplify<T['_']['columns']>, "partial", any> {
    return this.db.select(select as SelectedFields).from(from) as any;
  }

  getWithout<T extends MySqlTable, TSelect>(table: T, select?: TSelect | Partial<Record<keyof T['_']['columns'], true>>):
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

  insert<T extends MySqlTable>(table: T, set: T["$inferInsert"] & Partial<T["$inferSelect"]>) {
    return this.db.insert(table).values(set);
  }

  delete(table: MySqlTable) {
    return this.db.delete(table);
  }

  query<TKey extends keyof typeof this.db.query>(query: TKey): (typeof this.db.query)[TKey] {
    return this.db.query[query];
  }
}
