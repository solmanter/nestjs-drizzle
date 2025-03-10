# Announcing nestjs-drizzle v1.1.0: Supercharge Your NestJS Database Operations

We're excited to announce the release of nestjs-drizzle v1.1.0, a major update to our NestJS integration for Drizzle ORM. This release introduces powerful SQL utility functions, enhanced database operations, and improved documentation to make your database interactions more expressive and efficient.

## What is nestjs-drizzle?

nestjs-drizzle is a module that seamlessly integrates Drizzle ORM with NestJS, providing a type-safe and intuitive way to interact with your database. It supports multiple database engines including PostgreSQL, MySQL, Supabase, SQLite, PlanetScale, Neon, Vercel Postgres, and Turso.

## What's New in v1.1.0?

### 🚀 Powerful SQL Utility Functions

We've added over 40 SQL utility functions that make complex database operations simple and expressive:

```typescript
// Before
const users = await this.drizzle.get(users)
  .where(sql`UPPER(${users.name}) LIKE 'J%' AND ${users.age} > 18`);

// After
const users = await this.drizzle.get(users)
  .where(and(
    startsWith(upper(users.name), 'J'),
    gt(users.age, 18)
  ));
```

These functions cover a wide range of operations:

- **Numeric operations**: `increment`, `decrement`, `round`, `ceil`, `floor`, etc.
- **String operations**: `upper`, `lower`, `trim`, `substring`, etc.
- **Conditional logic**: `whereIf`, `caseWhen`, `ifThen`, etc.
- **Date operations**: `currentDate`, `extract`, `dateAdd`, etc.
- **JSON operations**: `jsonObject`, `jsonbSet`, etc.
- **Array operations**: `arrayAppend`, `arrayContains`, etc.

### 💪 Enhanced Database Operations

- **Raw SQL execution**: Execute complex SQL queries with the new `execute` method
- **Bulk insertions**: Insert multiple records efficiently with `insertMany`
- **Improved transactions**: Better support for database transactions

### 🌐 Expanded Database Support

We've added support for several new database engines:

- **SQLite**: Local database support via better-sqlite3
- **Turso**: Edge database built on LibSQL
- **PlanetScale**: MySQL-compatible serverless database platform
- **Neon**: Serverless PostgreSQL with branching
- **Vercel Postgres**: Vercel's managed PostgreSQL service

All these databases share the same consistent API, making it easy to switch between them or use multiple databases in the same project.

```typescript
// SQLite
DrizzleModule.forRoot({ 
  schema, 
  url: 'sqlite.db' 
})

// Turso
DrizzleModule.forRoot({ 
  schema, 
  driver: 'turso',
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

// PlanetScale
DrizzleModule.forRoot({ 
  schema, 
  driver: 'planetscale',
  connectionString: process.env.PLANETSCALE_URL
})

// Neon
DrizzleModule.forRoot({ 
  schema, 
  driver: 'neon',
  connectionString: process.env.NEON_DATABASE_URL
})

// Vercel Postgres
DrizzleModule.forRoot({ 
  schema, 
  driver: 'vercel',
  connectionString: process.env.POSTGRES_URL
})
```

### 📚 Comprehensive Documentation

We've completely revamped our documentation with:

- Detailed examples for all new SQL utility functions
- Guides for executing raw SQL queries
- Updated examples demonstrating best practices

## Getting Started

### Installation

```bash
npm install nestjs-drizzle
```

### Basic Usage

```typescript
// app.module.ts
import { DrizzleModule } from 'nestjs-drizzle/postgres';
import * as schema from './drizzle/schema';

@Module({
  imports: [
    DrizzleModule.forRoot({ schema })
  ]
})
export class AppModule {}

// users.service.ts
import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'nestjs-drizzle/postgres';
import { users } from './drizzle/schema';
import { eq, upper, jsonObject } from 'nestjs-drizzle/postgres';

@Injectable()
export class UsersService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getUsers() {
    return this.drizzle.get(users, {
      id: users.id,
      name: users.name,
      upperName: upper(users.name),
      userData: jsonObject([users.email, users.age])
    });
  }
}
```

## What's Next?

We're actively working on improving the library with:

- More database-specific optimizations
- Enhanced query builders
- Better migration tools
- Performance improvements

## Feedback and Contributions

We'd love to hear your feedback on this release! If you encounter any issues or have suggestions for improvements, please open an issue on our GitHub repository.

Happy coding!

---

*The nestjs-drizzle Team* 