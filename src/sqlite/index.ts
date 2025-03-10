// src/sqlite/index.ts
import { AnyColumn, sql, SQL, count, sum, max, min, avg, Placeholder } from "drizzle-orm";

export * from "./sqlite.module";
export * from "./sqlite.service";
export * from "./types";

/**
 * Generates a SQL expression to increment a column by the specified value
 * @param column The column to increment
 * @param value The value to increment by (default: 1)
 * @returns SQL expression for incremented value
 * @example this.drizzle.get(users, { age: increment(users.age) })
 */
export function increment(column: AnyColumn, value: number = 1): number {
  return sql<number>`${column} + ${value}` as unknown as number;
}

/**
 * Generates a SQL expression to decrement a column by the specified value
 * @param column The column to decrement
 * @param value The value to decrement by (default: 1)
 * @returns SQL expression for decremented value
 * @example this.drizzle.get(users, { age: decrement(users.age) })
 */
export function decrement(column: AnyColumn, value: number = 1): number {
  return sql<number>`${column} - ${value}` as unknown as number;
}

/**
 * Helper function to conditionally apply a where clause
 * @param condition Boolean condition to determine if the clause should be applied
 * @param clause The SQL clause to apply if the condition is true
 * @returns SQL expression or undefined if condition is false
 * @example this.drizzle.get(users).where(whereIf(isActive, sql`active = true`))
 */
export function whereIf<T>(condition: boolean, clause: SQL<T>): SQL<T> | undefined {
  return condition ? clause : undefined;
}

/**
 * Helper to create a JSON object with the specified columns
 * @param columns Array of columns to include in the JSON object
 * @returns SQL expression for a JSON object containing the specified columns
 * @example this.drizzle.get(users, { userData: jsonObject([users.name, users.email]) })
 */
export function jsonObject<T>(columns: AnyColumn[]): SQL<T> {
  return sql<T>`json_object(${sql.join(
    columns.flatMap(col => [sql.raw(`'${col.name}'`), col]),
    sql.raw(', ')
  )})`;
}

/**
 * Concatenates multiple values into a single string
 * @param args Values to concatenate
 * @returns SQL expression for concatenated string
 * @example this.drizzle.get(users, { fullName: concat(users.firstName, ' ', users.lastName) })
 */
export function concat<T extends string>(...args: (SQL<unknown> | AnyColumn | string | number)[]): SQL<T> {
  return sql<T>`(${sql.join(args, sql.raw(' || '))})`;
}

/**
 * Returns the first non-null value in a list
 * @param args Values to check
 * @returns SQL expression for first non-null value
 * @example this.drizzle.get(users, { displayName: coalesce(users.nickname, users.username) })
 */
export function coalesce<T>(...args: (SQL<unknown> | AnyColumn | null | undefined | string | number)[]): SQL<T> {
  return sql<T>`coalesce(${sql.join(args, sql.raw(', '))})`;
}

/**
 * Creates a SQL CASE WHEN expression
 * @param cases Array of when/then pairs
 * @param defaultValue Default value if no cases match
 * @returns SQL expression for CASE WHEN
 * @example this.drizzle.get(users, { status: caseWhen([{ when: sql`${users.age} < 18`, then: 'Minor' }], 'Adult') })
 */
export function caseWhen<T>(
  cases: Array<{ when: SQL<unknown>; then: SQL<unknown> | string | number }>,
  defaultValue?: SQL<unknown> | string | number
): SQL<T> {
  let query = sql`CASE`;
  
  for (const { when, then } of cases) {
    query = sql`${query} WHEN ${when} THEN ${then}`;
  }
  
  if (defaultValue !== undefined) {
    query = sql`${query} ELSE ${defaultValue}`;
  }
  
  return sql<T>`${query} END`;
}

/**
 * Returns NULL if two expressions are equal
 * @param expr1 First expression
 * @param expr2 Second expression
 * @returns SQL expression for NULLIF
 * @example this.drizzle.get(users, { division: nullIf(users.divisor, 0) })
 */
export function nullIf<T>(expr1: SQL<unknown> | AnyColumn | string | number, expr2: SQL<unknown> | AnyColumn | string | number): SQL<T> {
  return sql<T>`nullif(${expr1}, ${expr2})`;
}

/**
 * Returns the current date
 * @returns SQL expression for current date
 * @example this.drizzle.get(users, { today: currentDate() })
 */
export function currentDate(): SQL<string> {
  return sql<string>`date('now')`;
}

/**
 * Returns the current timestamp
 * @returns SQL expression for current timestamp
 * @example this.drizzle.get(users, { now: currentTimestamp() })
 */
export function currentTimestamp(): SQL<string> {
  return sql<string>`datetime('now')`;
}

/**
 * Extracts part from a date/time value
 * @param part Part to extract (year, month, day, etc.)
 * @param date Date/time expression
 * @returns SQL expression for extracted part
 * @example this.drizzle.get(users, { birthYear: extract('year', users.birthDate) })
 */
export function extract<T extends number>(
  part: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
  date: SQL<unknown> | AnyColumn
): SQL<T> {
  const extractMap = {
    year: '%Y',
    month: '%m',
    day: '%d',
    hour: '%H',
    minute: '%M',
    second: '%S'
  };
  
  return sql<T>`cast(strftime('${sql.raw(extractMap[part])}', ${date}) as integer)`;
}

/**
 * Adds or subtracts an interval to/from a date
 * @param date Date expression
 * @param operator '+' or '-'
 * @param interval Interval string (e.g., '1 day', '2 month')
 * @returns SQL expression for date with interval applied
 * @example this.drizzle.get(users, { nextWeek: dateAdd(users.createdAt, '+', '1 day') })
 */
export function dateAdd<T>(
  date: SQL<unknown> | AnyColumn,
  operator: '+' | '-',
  interval: string
): SQL<T> {
  const [amount, unit] = interval.split(' ');
  const unitMap: Record<string, string> = {
    day: 'days',
    days: 'days',
    month: 'months',
    months: 'months',
    year: 'years',
    years: 'years',
    hour: 'hours',
    hours: 'hours',
    minute: 'minutes',
    minutes: 'minutes',
    second: 'seconds',
    seconds: 'seconds'
  };
  
  const sqliteUnit = unitMap[unit.toLowerCase()];
  if (!sqliteUnit) {
    throw new Error(`Unsupported interval unit: ${unit}`);
  }
  
  return sql<T>`datetime(${date}, '${sql.raw(operator)}${sql.raw(amount)} ${sql.raw(sqliteUnit)}')`;
}

/**
 * Casts a value to a different type
 * @param value Value to cast
 * @param type Type to cast to
 * @returns SQL expression for cast value
 * @example this.drizzle.get(users, { ageAsString: cast(users.age, 'text') })
 */
export function cast<T>(
  value: SQL<unknown> | AnyColumn | string | number | null,
  type: string
): SQL<T> {
  return sql<T>`cast(${value} as ${sql.raw(type)})`;
}

/**
 * Converts a string to lowercase
 * @param value Value to convert
 * @returns SQL expression for lowercase string
 * @example this.drizzle.get(users, { lowerName: lower(users.name) })
 */
export function lower<T extends string>(value: SQL<unknown> | AnyColumn | string): SQL<T> {
  return sql<T>`lower(${value})`;
}

/**
 * Converts a string to uppercase
 * @param value Value to convert
 * @returns SQL expression for uppercase string
 * @example this.drizzle.get(users, { upperName: upper(users.name) })
 */
export function upper<T extends string>(value: SQL<unknown> | AnyColumn | string): SQL<T> {
  return sql<T>`upper(${value})`;
}

/**
 * Removes leading and trailing spaces from a string
 * @param value Value to trim
 * @returns SQL expression for trimmed string
 * @example this.drizzle.get(users, { trimmedName: trim(users.name) })
 */
export function trim<T extends string>(value: SQL<unknown> | AnyColumn | string): SQL<T> {
  return sql<T>`trim(${value})`;
}

/**
 * Extracts a substring from a string
 * @param value String to extract from
 * @param start Start position (1-indexed in SQLite)
 * @param length Length of substring
 * @returns SQL expression for substring
 * @example this.drizzle.get(users, { firstThreeChars: substring(users.name, 1, 3) })
 */
export function substring<T extends string>(
  value: SQL<unknown> | AnyColumn | string,
  start: number,
  length?: number
): SQL<T> {
  return length !== undefined
    ? sql<T>`substr(${value}, ${start}, ${length})`
    : sql<T>`substr(${value}, ${start})`;
}

/**
 * Gets the length of a string
 * @param value String to get length of
 * @returns SQL expression for string length
 * @example this.drizzle.get(users, { nameLength: length(users.name) })
 */
export function length<T extends number>(value: SQL<unknown> | AnyColumn | string): SQL<T> {
  return sql<T>`length(${value})`;
}

/**
 * Finds the position of a substring in a string
 * @param substring Substring to find
 * @param string String to search in
 * @returns SQL expression for position (1-indexed, 0 if not found)
 * @example this.drizzle.get(users, { positionOfA: position('a', users.name) })
 */
export function position<T extends number>(
  substring: SQL<unknown> | string,
  string: SQL<unknown> | AnyColumn | string
): SQL<T> {
  return sql<T>`instr(${string}, ${substring})`;
}

/**
 * Replaces occurrences of a substring with another string
 * @param string String to perform replacement on
 * @param from Substring to replace
 * @param to Replacement string
 * @returns SQL expression for string with replacements
 * @example this.drizzle.get(users, { newName: replace(users.name, 'a', 'A') })
 */
export function replace<T extends string>(
  string: SQL<unknown> | AnyColumn | string,
  from: string,
  to: string
): SQL<T> {
  return sql<T>`replace(${string}, ${from}, ${to})`;
}

/**
 * Checks if a string starts with a prefix
 * @param string String to check
 * @param prefix Prefix to check for
 * @returns SQL expression for boolean result
 * @example this.drizzle.get(users).where(startsWith(users.name, 'A'))
 */
export function startsWith<T extends boolean>(
  string: SQL<unknown> | AnyColumn | string,
  prefix: string
): SQL<T> {
  return sql<T>`${string} LIKE ${prefix + '%'}`;
}

/**
 * Checks if a string ends with a suffix
 * @param string String to check
 * @param suffix Suffix to check for
 * @returns SQL expression for boolean result
 * @example this.drizzle.get(users).where(endsWith(users.name, 'z'))
 */
export function endsWith<T extends boolean>(
  string: SQL<unknown> | AnyColumn | string,
  suffix: string
): SQL<T> {
  return sql<T>`${string} LIKE ${'%' + suffix}`;
}

/**
 * Gets the absolute value of a number
 * @param value Value to get absolute value of
 * @returns SQL expression for absolute value
 * @example this.drizzle.get(users, { absAge: abs(users.age) })
 */
export function abs<T extends number>(value: SQL<unknown> | AnyColumn | number): SQL<T> {
  return sql<T>`abs(${value})`;
}

/**
 * Rounds a number to a specified precision
 * @param value Value to round
 * @param precision Precision to round to
 * @returns SQL expression for rounded value
 * @example this.drizzle.get(users, { roundedSalary: round(users.salary, 2) })
 */
export function round<T extends number>(
  value: SQL<unknown> | AnyColumn | number,
  precision: number = 0
): SQL<T> {
  return sql<T>`round(${value}, ${precision})`;
}

/**
 * Gets the maximum of two values
 * @param a First value
 * @param b Second value
 * @returns SQL expression for maximum value
 * @example this.drizzle.get(users, { maxAge: max2(users.age, 18) })
 */
export function max2<T extends number>(
  a: SQL<unknown> | AnyColumn | number,
  b: SQL<unknown> | AnyColumn | number
): SQL<T> {
  return sql<T>`max(${a}, ${b})`;
}

/**
 * Gets the minimum of two values
 * @param a First value
 * @param b Second value
 * @returns SQL expression for minimum value
 * @example this.drizzle.get(users, { minAge: min2(users.age, 18) })
 */
export function min2<T extends number>(
  a: SQL<unknown> | AnyColumn | number,
  b: SQL<unknown> | AnyColumn | number
): SQL<T> {
  return sql<T>`min(${a}, ${b})`;
}

/**
 * Gets the remainder of a division
 * @param dividend Dividend
 * @param divisor Divisor
 * @returns SQL expression for remainder
 * @example this.drizzle.get(users, { remainder: mod(users.age, 10) })
 */
export function mod<T extends number>(
  dividend: SQL<unknown> | AnyColumn | number,
  divisor: number
): SQL<T> {
  return sql<T>`(${dividend} % ${divisor})`;
}

/**
 * Gets a random number
 * @returns SQL expression for random number between 0 and 1
 * @example this.drizzle.get(users, { random: random() })
 */
export function random<T extends number>(): SQL<T> {
  return sql<T>`random() / 9223372036854775807.0`;
}

/**
 * Checks if a value is between two values
 * @param value Value to check
 * @param lower Lower bound
 * @param upper Upper bound
 * @param inclusive Whether to include bounds (default: true)
 * @returns SQL expression for boolean result
 * @example this.drizzle.get(users).where(between(users.age, 18, 65))
 */
export function between<T extends boolean>(
  value: SQL<unknown> | AnyColumn | number | string,
  lower: SQL<unknown> | number | string,
  upper: SQL<unknown> | number | string,
  inclusive: boolean = true
): SQL<T> {
  if (inclusive) {
    return sql<T>`${value} BETWEEN ${lower} AND ${upper}`;
  } else {
    return sql<T>`${value} > ${lower} AND ${value} < ${upper}`;
  }
}

/**
 * Checks if a value is in a list of values
 * @param value Value to check
 * @param values List of values
 * @returns SQL expression for boolean result
 * @example this.drizzle.get(users).where(inList(users.status, ['active', 'pending']))
 */
export function inList<T extends boolean>(
  value: SQL<unknown> | AnyColumn | string | number,
  values: (SQL<unknown> | string | number)[]
): SQL<T> {
  return sql<T>`${value} IN (${sql.join(values, sql.raw(', '))})`;
}

/**
 * Creates an IF-THEN-ELSE expression (using CASE WHEN in SQLite)
 * @param condition Condition
 * @param trueValue Value if condition is true
 * @param falseValue Value if condition is false
 * @returns SQL expression for conditional result
 * @example this.drizzle.get(users, { status: ifThen(sql`${users.age} >= 18`, 'Adult', 'Minor') })
 */
export function ifThen<T>(
  condition: SQL<unknown>,
  trueValue: SQL<unknown> | string | number | boolean,
  falseValue: SQL<unknown> | string | number | boolean
): SQL<T> {
  return sql<T>`CASE WHEN ${condition} THEN ${trueValue} ELSE ${falseValue} END`;
}

/**
 * Creates a placeholder for prepared statements
 * @param name Name of the placeholder
 * @returns Placeholder
 * @example this.drizzle.get(users).where(sql`${users.age} > ${placeholder('minAge')}`)
 */
export function placeholder<T extends string>(name: string): Placeholder<T, any> {
  return new Placeholder(name) as Placeholder<T, any>;
}

/**
 * Checks if a JSON string contains a path
 * @param json JSON string
 * @param path Path to check
 * @returns SQL expression for boolean result
 * @example this.drizzle.get(users).where(jsonHasPath(users.data, '$.name'))
 */
export function jsonHasPath<T extends boolean>(
  json: SQL<unknown> | AnyColumn,
  path: string
): SQL<T> {
  return sql<T>`json_type(${json}, ${path}) IS NOT NULL`;
}

/**
 * Extracts a value from a JSON string
 * @param json JSON string
 * @param path Path to extract
 * @returns SQL expression for extracted value
 * @example this.drizzle.get(users, { name: jsonExtract(users.data, '$.name') })
 */
export function jsonExtract<T>(
  json: SQL<unknown> | AnyColumn,
  path: string
): SQL<T> {
  return sql<T>`json_extract(${json}, ${path})`;
}

/**
 * Gets the distinct values
 * @param value Value to get distinct values of
 * @returns SQL expression for distinct values
 * @example this.drizzle.get(users, { distinctName: distinct(users.name) })
 */
export function distinct<T>(value: SQL<unknown> | AnyColumn): SQL<T> {
  return sql<T>`DISTINCT ${value}`;
} 