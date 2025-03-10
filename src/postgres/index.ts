// src/postgres/index.ts
import { AnyColumn, sql, SQL, count, sum, max, min, avg, Placeholder } from "drizzle-orm";

export * from "./postgres.module";
export * from "./postgres.service";
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
  return sql<T>`jsonb_build_object(${sql.join(
    columns.flatMap(col => [sql.raw(`'${col.name}'`), col]),
    sql.raw(', ')
  )})`;
}

/**
 * Creates a SQL expression for concatenating values
 * @param args Values to concatenate
 * @returns SQL expression for concatenated values
 * @example this.drizzle.get(users, { fullName: concat(users.firstName, ' ', users.lastName) })
 */
export function concat<T extends string>(...args: (SQL<unknown> | AnyColumn | string | number)[]): SQL<T> {
  return sql<T>`${sql.join(args, sql`||`)}`;
}

/**
 * Creates a SQL expression for coalescing values (returns first non-null value)
 * @param args Values to coalesce
 * @returns SQL expression for coalesced value
 * @example this.drizzle.get(users, { fullName: coalesce(users.firstName, users.lastName, 'Unknown') })
 */
export function coalesce<T>(...args: (SQL<unknown> | AnyColumn | null | undefined | string | number)[]): SQL<T> {
  return sql<T>`coalesce(${sql.join(args, sql`, `)})`;
}

/**
 * Creates a SQL expression for case statement
 * @param cases Array of condition-result pairs
 * @param defaultValue Default value if no conditions match
 * @returns SQL expression for case statement
 * @example this.drizzle.get(users, { 
 *   status: caseWhen([
 *     { when: sql`age < 18`, then: 'Minor' },
 *     { when: sql`age >= 18 AND age < 65`, then: 'Adult' }
 *   ], 'Senior')
 * })
 */
export function caseWhen<T>(
  cases: Array<{ when: SQL<unknown>; then: SQL<unknown> | string | number }>,
  defaultValue?: SQL<unknown> | string | number
): SQL<T> {
  let query = sql`CASE `;
  for (const { when, then } of cases) {
    query = sql`${query} WHEN ${when} THEN ${then} `;
  }
  if (defaultValue !== undefined) {
    query = sql`${query} ELSE ${defaultValue} `;
  }
  return sql<T>`${query} END`;
}

/**
 * Creates a SQL expression for nullif (returns null if expr1 equals expr2)
 * @param expr1 First expression
 * @param expr2 Second expression
 * @returns SQL expression for nullif
 * @example this.drizzle.get(users, { fullName: nullIf(users.firstName, '') })
 */
export function nullIf<T>(expr1: SQL<unknown> | AnyColumn | string | number, expr2: SQL<unknown> | AnyColumn | string | number): SQL<T> {
  return sql<T>`nullif(${expr1}, ${expr2})`;
}

/**
 * Creates a SQL expression for current date
 * @returns SQL expression for current date
 * @example this.drizzle.get(users, { currentDate: currentDate() })
 */
export function currentDate(): SQL<string> {
  return sql<string>`current_date`;
}

/**
 * Creates a SQL expression for current timestamp
 * @param withTimeZone Whether to include time zone
 * @returns SQL expression for current timestamp
 * @example this.drizzle.get(users, { currentTimestamp: currentTimestamp() })
 */
export function currentTimestamp(withTimeZone: boolean = true): SQL<string> {
  return withTimeZone
    ? sql<string>`current_timestamp`
    : sql<string>`localtimestamp`;
}

/**
 * Creates a SQL expression for extracting part from date/time
 * @param part Part to extract (year, month, day, etc.)
 * @param date Date/time expression
 * @returns SQL expression for extracted part
 * @example this.drizzle.get(users, { birthYear: extract('year', users.birthDate) })
 */
export function extract<T extends number>(
  part: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'epoch',
  date: SQL<unknown> | AnyColumn
): SQL<T> {
  return sql<T>`extract(${sql.raw(part)} from ${date})`;
}

/**
 * Creates a SQL expression for date/time arithmetic
 * @param date Date/time expression
 * @param operator + or -
 * @param interval Interval expression
 * @returns SQL expression for date/time arithmetic
 * @example this.drizzle.get(users, { nextBirthday: dateAdd(users.birthDate, '+', '1 year') })
 */
export function dateAdd<T>(
  date: SQL<unknown> | AnyColumn,
  operator: '+' | '-',
  interval: string
): SQL<T> {
  return sql<T>`${date} ${sql.raw(operator)} interval '${sql.raw(interval)}'`;
}

/**
 * Creates a SQL expression for cast
 * @param value Value to cast
 * @param type Type to cast to
 * @returns SQL expression for cast
 * @example this.drizzle.get(users, { ageAsText: cast(users.age, 'text') })
 */
export function cast<T>(
  value: SQL<unknown> | AnyColumn | string | number | null,
  type: string
): SQL<T> {
  return sql<T>`cast(${value} as ${sql.raw(type)})`;
}

/**
 * Creates a SQL expression for lower case
 * @param value Value to convert to lower case
 * @returns SQL expression for lower case
 * @example this.drizzle.get(users, { lowercaseName: lower(users.name) })
 */
export function lower<T extends string>(value: SQL<unknown> | AnyColumn | string): SQL<T> {
  return sql<T>`lower(${value})`;
}

/**
 * Creates a SQL expression for upper case
 * @param value Value to convert to upper case
 * @returns SQL expression for upper case
 * @example this.drizzle.get(users, { uppercaseName: upper(users.name) })
 */
export function upper<T extends string>(value: SQL<unknown> | AnyColumn | string): SQL<T> {
  return sql<T>`upper(${value})`;
}

/**
 * Creates a SQL expression for trim
 * @param value Value to trim
 * @returns SQL expression for trimmed value
 * @example this.drizzle.get(users, { trimmedName: trim(users.name) })
 */
export function trim<T extends string>(value: SQL<unknown> | AnyColumn | string): SQL<T> {
  return sql<T>`trim(${value})`;
}

/**
 * Creates a SQL expression for substring
 * @param value Value to extract substring from
 * @param start Start position (1-based)
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
    ? sql<T>`substring(${value} from ${start} for ${length})`
    : sql<T>`substring(${value} from ${start})`;
}

/**
 * Creates a SQL expression for length
 * @param value Value to get length of
 * @returns SQL expression for length
 * @example this.drizzle.get(users, { nameLength: length(users.name) })
 */
export function length<T extends number>(value: SQL<unknown> | AnyColumn | string): SQL<T> {
  return sql<T>`length(${value})`;
}

/**
 * Creates a SQL expression for position
 * @param substring Substring to find
 * @param string String to search in
 * @returns SQL expression for position
 * @example this.drizzle.get(users, { positionOfA: position('a', users.name) })
 */
export function position<T extends number>(
  substring: SQL<unknown> | string,
  string: SQL<unknown> | AnyColumn | string
): SQL<T> {
  return sql<T>`position(${substring} in ${string})`;
}

/**
 * Creates a SQL expression for replace
 * @param string String to perform replacement in
 * @param from String to replace
 * @param to Replacement string
 * @returns SQL expression for replaced string
 * @example this.drizzle.get(users, { replacedName: replace(users.name, 'old', 'new') })
 */
export function replace<T extends string>(
  string: SQL<unknown> | AnyColumn | string,
  from: string,
  to: string
): SQL<T> {
  return sql<T>`replace(${string}, ${from}, ${to})`;
}

/**
 * Creates a SQL expression for starts_with
 * @param string String to check
 * @param prefix Prefix to check for
 * @returns SQL expression for starts_with
 * @example this.drizzle.get(users, { startsWithA: startsWith(users.name, 'A') })
 */
export function startsWith<T extends boolean>(
  string: SQL<unknown> | AnyColumn | string,
  prefix: string
): SQL<T> {
  return sql<T>`starts_with(${string}, ${prefix})`;
}

/**
 * Creates a SQL expression for ends_with
 * @param string String to check
 * @param suffix Suffix to check for
 * @returns SQL expression for ends_with
 * @example this.drizzle.get(users, { endsWithZ: endsWith(users.name, 'Z') })
 */
export function endsWith<T extends boolean>(
  string: SQL<unknown> | AnyColumn | string,
  suffix: string
): SQL<T> {
  return sql<T>`ends_with(${string}, ${suffix})`;
}

/**
 * Creates a SQL expression for absolute value
 * @param value Value to get absolute value of
 * @returns SQL expression for absolute value
 * @example this.drizzle.get(products, { absoluteAmount: abs(products.amount) })
 */
export function abs<T extends number>(value: SQL<unknown> | AnyColumn | number): SQL<T> {
  return sql<T>`abs(${value})`;
}

/**
 * Creates a SQL expression for rounding
 * @param value Value to round
 * @param precision Precision to round to
 * @returns SQL expression for rounded value
 * @example this.drizzle.get(users, { roundedAge: round(users.age, 2) })
 */
export function round<T extends number>(
  value: SQL<unknown> | AnyColumn | number,
  precision: number = 0
): SQL<T> {
  return sql<T>`round(${value}, ${precision})`;
}

/**
 * Creates a SQL expression for ceiling
 * @param value Value to ceil
 * @returns SQL expression for ceiling
 * @example this.drizzle.get(users, { ceilingAge: ceil(users.age) })
 */
export function ceil<T extends number>(value: SQL<unknown> | AnyColumn | number): SQL<T> {
  return sql<T>`ceil(${value})`;
}

/**
 * Creates a SQL expression for floor
 * @param value Value to floor
 * @returns SQL expression for floor
 * @example this.drizzle.get(users, { floorAge: floor(users.age) })
 */
export function floor<T extends number>(value: SQL<unknown> | AnyColumn | number): SQL<T> {
  return sql<T>`floor(${value})`;
}

/**
 * Creates a SQL expression for modulo
 * @param dividend Dividend
 * @param divisor Divisor
 * @returns SQL expression for modulo
 * @example this.drizzle.get(users, { ageModulo: mod(users.age, 10) })
 */
export function mod<T extends number>(
  dividend: SQL<unknown> | AnyColumn | number,
  divisor: number
): SQL<T> {
  return sql<T>`mod(${dividend}, ${divisor})`;
}

/**
 * Creates a SQL expression for power
 * @param base Base
 * @param exponent Exponent
 * @returns SQL expression for power
 * @example this.drizzle.get(users, { ageSquared: power(users.age, 2) })
 */
export function power<T extends number>(
  base: SQL<unknown> | AnyColumn | number,
  exponent: number
): SQL<T> {
  return sql<T>`power(${base}, ${exponent})`;
}

/**
 * Creates a SQL expression for square root
 * @param value Value to get square root of
 * @returns SQL expression for square root
 * @example this.drizzle.get(users, { ageSquareRoot: sqrt(users.age) })
 */
export function sqrt<T extends number>(value: SQL<unknown> | AnyColumn | number): SQL<T> {
  return sql<T>`sqrt(${value})`;
}

/**
 * Creates a SQL expression for random number
 * @returns SQL expression for random number
 * @example this.drizzle.get(users, { randomNumber: random() })
 */
export function random<T extends number>(): SQL<T> {
  return sql<T>`random()`;
}

/**
 * Creates a SQL expression for array_agg (aggregate values into an array)
 * @param value Value to aggregate
 * @returns SQL expression for array_agg
 * @example this.drizzle.get(users, { agesArray: arrayAgg(users.age) })
 */
export function arrayAgg<T>(value: SQL<unknown> | AnyColumn): SQL<T> {
  return sql<T>`array_agg(${value})`;
}

/**
 * Creates a SQL expression for json_agg (aggregate values into a JSON array)
 * @param value Value to aggregate
 * @returns SQL expression for json_agg
 * @example this.drizzle.get(users, { agesJson: jsonAgg(users.age) })
 */
export function jsonAgg<T>(value: SQL<unknown> | AnyColumn): SQL<T> {
  return sql<T>`json_agg(${value})`;
}

/**
 * Creates a SQL expression for jsonb_agg (aggregate values into a JSONB array)
 * @param value Value to aggregate
 * @returns SQL expression for jsonb_agg
 * @example this.drizzle.get(users, { agesJsonb: jsonbAgg(users.age) })
 */
export function jsonbAgg<T>(value: SQL<unknown> | AnyColumn): SQL<T> {
  return sql<T>`jsonb_agg(${value})`;
}

/**
 * Creates a SQL expression for to_json (convert value to JSON)
 * @param value Value to convert
 * @returns SQL expression for to_json
 * @example this.drizzle.get(users, { userJson: toJson(users) })
 */
export function toJson<T>(value: SQL<unknown> | AnyColumn): SQL<T> {
  return sql<T>`to_json(${value})`;
}

/**
 * Creates a SQL expression for to_jsonb (convert value to JSONB)
 * @param value Value to convert
 * @returns SQL expression for to_jsonb
 * @example this.drizzle.get(users, { userJsonb: toJsonb(users) })
 */
export function toJsonb<T>(value: SQL<unknown> | AnyColumn): SQL<T> {
  return sql<T>`to_jsonb(${value})`;
}

/**
 * Creates a SQL expression for jsonb_set (set a field in a JSONB document)
 * @param target JSONB document to modify
 * @param path Path to the field
 * @param value New value
 * @param createMissing Whether to create missing fields
 * @returns SQL expression for jsonb_set
 * @example this.drizzle.get(users, { updatedJsonb: jsonbSet(users.data, ['name'], sql`'John'`) })
 */
export function jsonbSet<T>(
  target: SQL<unknown> | AnyColumn,
  path: string[],
  value: SQL<unknown> | AnyColumn | object,
  createMissing: boolean = true
): SQL<T> {
  const pathElements = path.map(p => `"${p}"`).join(', ');
  const pathArray = sql`array[${sql.raw(pathElements)}]`;

  return sql<T>`jsonb_set(${target}, ${pathArray}, ${value}, ${createMissing})`;
}

/**
 * Creates a SQL expression for generate_series
 * @param start Start value
 * @param end End value
 * @param step Step value
 * @returns SQL expression for generate_series
 * @example this.drizzle.get(users, { series: generateSeries(1, 10) })
 */
export function generateSeries<T>(
  start: number,
  end: number,
  step?: number
): SQL<T> {
  return step !== undefined
    ? sql<T>`generate_series(${start}, ${end}, ${step})`
    : sql<T>`generate_series(${start}, ${end})`;
}

/**
 * Creates a SQL expression for string_agg (aggregate strings with separator)
 * @param value Value to aggregate
 * @param separator Separator
 * @returns SQL expression for string_agg
 * @example this.drizzle.get(users, { namesString: stringAgg(users.name, ', ') })
 */
export function stringAgg<T extends string>(
  value: SQL<unknown> | AnyColumn,
  separator: string = ','
): SQL<T> {
  return sql<T>`string_agg(${value}, ${separator})`;
}

/**
 * Creates a SQL expression for regexp_replace
 * @param string String to perform replacement in
 * @param pattern Regular expression pattern
 * @param replacement Replacement string
 * @param flags Regular expression flags
 * @returns SQL expression for regexp_replace
 * @example this.drizzle.get(users, { replacedName: regexpReplace(users.name, 'old', 'new', 'g') })
 */
export function regexpReplace<T extends string>(
  string: SQL<unknown> | AnyColumn | string,
  pattern: string,
  replacement: string,
  flags?: string
): SQL<T> {
  return flags !== undefined
    ? sql<T>`regexp_replace(${string}, ${pattern}, ${replacement}, ${flags})`
    : sql<T>`regexp_replace(${string}, ${pattern}, ${replacement})`;
}

/**
 * Creates a SQL expression for regexp_matches
 * @param string String to match against
 * @param pattern Regular expression pattern
 * @param flags Regular expression flags
 * @returns SQL expression for regexp_matches
 * @example this.drizzle.get(users, { matches: regexpMatches(users.name, 'pattern') })
 */
export function regexpMatches<T>(
  string: SQL<unknown> | AnyColumn | string,
  pattern: string,
  flags?: string
): SQL<T> {
  return flags !== undefined
    ? sql<T>`regexp_matches(${string}, ${pattern}, ${flags})`
    : sql<T>`regexp_matches(${string}, ${pattern})`;
}

/**
 * Creates a SQL expression for array_append
 * @param array Array to append to
 * @param element Element to append
 * @returns SQL expression for array_append
 * @example this.drizzle.get(users, { updatedArray: arrayAppend(users.tags, 'newTag') })
 */
export function arrayAppend<T>(
  array: SQL<unknown> | AnyColumn,
  element: unknown
): SQL<T> {
  return sql<T>`array_append(${array}, ${element})`;
}

/**
 * Creates a SQL expression for array_remove
 * @param array Array to remove from
 * @param element Element to remove
 * @returns SQL expression for array_remove
 * @example this.drizzle.get(users, { updatedArray: arrayRemove(users.tags, 'oldTag') })
 */
export function arrayRemove<T>(
  array: SQL<unknown> | AnyColumn,
  element: unknown
): SQL<T> {
  return sql<T>`array_remove(${array}, ${element})`;
}

/**
 * Creates a SQL expression for array_contains
 * @param array Array to check
 * @param element Element to check for
 * @returns SQL expression for array_contains
 * @example this.drizzle.get(users, { containsTag: arrayContains(users.tags, 'specificTag') })
 */
export function arrayContains<T extends boolean>(
  array: SQL<unknown> | AnyColumn,
  element: unknown
): SQL<T> {
  return sql<T>`${array} @> array[${element}]`;
}

/**
 * Creates a SQL expression for array_length
 * @param array Array to get length of
 * @param dimension Dimension to get length of
 * @returns SQL expression for array_length
 * @example this.drizzle.get(users, { arrayLength: arrayLength(users.tags) })
 */
export function arrayLength<T extends number>(
  array: SQL<unknown> | AnyColumn,
  dimension: number = 1
): SQL<T> {
  return sql<T>`array_length(${array}, ${dimension})`;
}

/**
 * Re-export common aggregate functions from drizzle-orm
 */
export { count, sum, max, min, avg };

/**
 * Creates a SQL expression for distinct values
 * @param value Value to get distinct values for
 * @returns SQL expression for distinct
 * @example this.drizzle.get(users, { distinctAges: distinct(users.age) })
 */
export function distinct<T>(value: SQL<unknown> | AnyColumn): SQL<T> {
  return sql<T>`distinct ${value}`;
}

/**
 * Creates a SQL expression for returning a specific value based on a condition
 * @param condition Condition to check
 * @param trueValue Value to return if condition is true
 * @param falseValue Value to return if condition is false
 * @returns SQL expression for if
 * @example this.drizzle.get(users, { isActive: ifThen(sql`age > 18`, true, false) })
 */
export function ifThen<T>(
  condition: SQL<unknown>,
  trueValue: SQL<unknown> | string | number | boolean,
  falseValue: SQL<unknown> | string | number | boolean
): SQL<T> {
  return sql<T>`CASE WHEN ${condition} THEN ${trueValue} ELSE ${falseValue} END`;
}

/**
 * Creates a SQL expression for checking if a value is between two values
 * @param value Value to check
 * @param lower Lower bound
 * @param upper Upper bound
 * @param inclusive Whether to include the bounds
 * @returns SQL expression for between
 * @example this.drizzle.get(users, { isBetween: between(users.age, 18, 65) })
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
 * Creates a SQL expression for checking if a value is in a list of values
 * @param value Value to check
 * @param values List of values to check against
 * @returns SQL expression for in
 * @example this.drizzle.get(users, { isInList: inList(users.age, [25, 30, 35]) })
 */
export function inList<T extends boolean>(
  value: SQL<unknown> | AnyColumn | string | number,
  values: (SQL<unknown> | string | number)[]
): SQL<T> {
  return sql<T>`${value} IN (${sql.join(values, sql`, `)})`;
}

/**
 * Creates a SQL expression for a subquery using common table expressions (WITH queries)
 * @param name Name of the CTE
 * @param query Subquery to use as CTE
 * @returns SQL expression for CTE
 * @example const query = withSubquery('filtered_users', sql`SELECT * FROM users WHERE age > 18`);
 * this.drizzle.execute(sql`${query} SELECT * FROM filtered_users`)
 */
export function withSubquery<T>(name: string, query: SQL<unknown>): SQL<T> {
  return sql<T>`WITH ${sql.raw(name)} AS (${query})`;
}

/**
 * Creates a placeholder for prepared statements
 * @param name Name of the placeholder
 * @returns SQL placeholder
 * @example this.drizzle.get(users, { name: placeholder('name') })
 */
export function placeholder<T extends string>(name: string): Placeholder<T> {
  return sql.placeholder(name) as Placeholder<T>;
}