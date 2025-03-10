# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-03-10

### Added
- SQL utility functions for PostgreSQL and MySQL:
  - Numeric operations: `increment`, `decrement`, `abs`, `round`, `ceil`, `floor`, `mod`, `power`, `sqrt`, `random`
  - String operations: `lower`, `upper`, `trim`, `substring`, `length`, `position`, `replace`, `startsWith`, `endsWith`
  - Conditional operations: `whereIf`, `caseWhen`, `nullIf`, `ifThen`, `between`, `inList`
  - Date operations: `currentDate`, `currentTimestamp`, `extract`, `dateAdd`
  - JSON operations: `jsonObject`, `jsonAgg`, `jsonbAgg`, `toJson`, `toJsonb`, `jsonbSet`
  - Array operations: `arrayAgg`, `arrayAppend`, `arrayRemove`, `arrayContains`, `arrayLength`
  - Other utilities: `concat`, `coalesce`, `cast`, `generateSeries`, `stringAgg`, `regexpReplace`, `regexpMatches`, `distinct`, `withSubquery`, `placeholder`
- `execute` method for running raw SQL queries
- `insertMany` method for bulk insertions
- Improved transaction support
- Comprehensive documentation for new features
- Support for additional database engines:
  - SQLite (via better-sqlite3)
  - Turso (via @libsql/client)
  - PlanetScale (via @planetscale/database)
  - Neon (via @neondatabase/serverless)
  - Vercel Postgres (via @vercel/postgres)

### Changed
- Enhanced type safety for SQL operations
- Improved error handling for database connections
- Unified API across all database types
- Dynamic loading of database drivers for better dependency management

### Fixed
- Type inference issues with complex queries
- Connection handling for PostgreSQL clients

## [0.9.7] - 2024-10-15

### Added
- Initial release of nestjs-drizzle
- Basic DrizzleModule for NestJS
- Support for MySQL and PostgreSQL
- Basic query operations (get, insert, update, delete)
- Query builder integration
- Support for Supabase 