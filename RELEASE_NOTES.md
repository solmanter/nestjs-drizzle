# Release Notes

## v1.1.0 (2025-03-10)

### New Features

#### SQL Utility Functions
We've added a comprehensive set of SQL utility functions to make your database queries more expressive and powerful:

- **Numeric Operations**: `increment`, `decrement`, `abs`, `round`, `ceil`, `floor`, `mod`, `power`, `sqrt`, `random`
- **String Operations**: `lower`, `upper`, `trim`, `substring`, `length`, `position`, `replace`, `startsWith`, `endsWith`
- **Conditional Operations**: `whereIf`, `caseWhen`, `nullIf`, `ifThen`, `between`, `inList`
- **Date Operations**: `currentDate`, `currentTimestamp`, `extract`, `dateAdd`
- **JSON Operations**: `jsonObject`, `jsonAgg`, `jsonbAgg`, `toJson`, `toJsonb`, `jsonbSet`
- **Array Operations**: `arrayAgg`, `arrayAppend`, `arrayRemove`, `arrayContains`, `arrayLength`
- **Other Utilities**: `concat`, `coalesce`, `cast`, `generateSeries`, `stringAgg`, `regexpReplace`, `regexpMatches`, `distinct`, `withSubquery`, `placeholder`

#### Enhanced DrizzleService
- Added `execute` method for running raw SQL queries
- Added `insertMany` method for bulk insertions
- Improved transaction support

### Documentation
- Added comprehensive examples for SQL utility functions
- Added documentation for executing raw SQL queries
- Updated examples to demonstrate new features

### Supported Databases
- [x] MySQL/MySQL2
- [x] PostgreSQL
- [x] Supabase
- [x] SQLite
- [x] PlanetScale
- [x] Neon
- [x] Vercel Postgres
- [x] Turso

### Installation

```bash
npm install nestjs-drizzle
```

# Optional Dependencies

Depending on which database you want to use, you'll need to install the corresponding driver:

```bash
# For MySQL
npm install mysql2

# For PostgreSQL
npm install pg

# For SQLite
npm install better-sqlite3

# For Turso
npm install @libsql/client

# For PlanetScale
npm install @planetscale/database

# For Neon
npm install @neondatabase/serverless

# For Vercel Postgres
npm install @vercel/postgres
```

### Usage

Check the updated README for detailed usage examples of all new features.

## Previous Versions

### v1.0.0 (Initial Release)

- Basic DrizzleModule for NestJS
- Support for MySQL and PostgreSQL
- Basic query operations (get, insert, update, delete)
- Query builder integration 