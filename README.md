## Nest.js Drizzle

### Todo List

- [x] mysql2
- [x] node-postgres
- [x] supabase
- [ ] sqlite
- [ ] planetscale
- [ ] neon
- [ ] vercel postgres
- [ ] turso

```bash
npm install nestjs-drizzle
```

### For schema
```ts
// drizzle/schemas/users.ts
import { pgTable, varchar, uuid, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').unique().primaryKey().defaultRandom(),

  username: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),

  // more schema
});

// drizzle/schema.ts
export * from './schemas/users.ts'
```

### app.module.ts

```ts
import { DrizzleModule } from 'nestjs-drizzle/postgres';
import * as schema from '/path/schema';

@Module({
  imports: [
    // in default DrizzleModule gets url from .env DATABASE_URL
    DrizzleModule.forRoot({ schema }),
    // or
    DrizzleModule.forRoot({ schema, connectionString: process.env.DATABASE_URL })
  ]
})

// For mysql
import { DrizzleModule } from 'nestjs-drizzle/mysql';
import * as schema from '/path/schema';

@Module({
  imports: [
    DrizzleModule.forRoot({ schema, connection: { uri: process.env.DATABASE_URL } }),
    DrizzleModule.forRoot({ schema, pool: { ... } })
  ]
})
```

> I recomend to use `global.d.ts` file for env type safety.

```ts
// For quering data
declare type ISchema = typeof import('your/path/schema');

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    DATABASE_URL: string;
    // add more environment variables and their types here
  }
}
```

### any.service.ts

```ts
import { Injectable } from "@nestjs/common";
import { DrizzleService } from "nestjs-drizzle/mysql";
import { users } from "./drizzle";
import { isNull, eq } from "drizzle-orm";
import { increment, upper, jsonObject } from "nestjs-drizzle/mysql";

@Injectable()
export class AppService {
  constructor(private readonly drizzle: DrizzleService<ISchema>) {}

  async getManyUsers() {
    const users = await this.drizzle.get(users, {
      id: users.id,
      username: users.username,
      upperName: upper(users.username),
      incrementedAge: increment(users.age),
    });

    return users;
  }

  async getOneUser(id: string) {
    const [user] = await this.drizzle
      .get(users, {
        id: users.id,
        username: users.username,
      })
      .where(eq(users.id, id));

    return user;
  }
}
```

### All function in nestjs-drizzle

```ts
// main drizzle db
this.drizzle.db;
// insertion
this.drizzle.insert(users, values);
this.drizzle.insert(users, values).$dynamic;
// insert multiple records
this.drizzle.insertMany(users, [values1, values2, values3]);
// update
this.drizzle.update(users, values).where(eq(users.id, 10));
// Increment | Decrement
this.drizzle.update(users, { age: increment(users.age, 20) }).where(eq(users.id, 10));
// Delete
this.drizzle.delete(users).where(eq(users.id, 10));
// Query
this.drizzle.query.users.findFirst();
this.drizzle.query.users.findMany();
// Get
this.drizzle.get(users);
this.drizzle.get(users, { id: users.id, username: users.username })
// or without function
this.drizzle.getWithout(users, { password: true })
// Execute raw SQL
this.drizzle.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
// Transactions
await this.drizzle.transaction(async (tx) => {
  await tx.insert(users, { username: 'john', password: 'password' });
  await tx.update(profiles).set({ active: true }).where(eq(profiles.userId, userId));
});
```

### Using query

```ts
import { DrizzleService } from "nestjs-drizzle/postgres";
import * as schema from '/your/path/schema';

@Injectable()
export class AppService {
  constructor(
    private readonly drizzle: DrizzleService<ISchema> // <- put here <ISchema>
    // or
    private readonly drizzle: DrizzleService<typeof schema> // <- or put here <typeof schema>
  ) {}

  getUsers() {
    this.drizzle.query.users.findMany({
      columns: {
        id: true,
        name: true,
      },
      limit: 10,
    });
  }
}
```

### SQL Utility Functions

nestjs-drizzle provides a rich set of SQL utility functions that can be used in your queries. These functions help you write more expressive and powerful database queries.

```ts
import { 
  increment, decrement, whereIf, jsonObject, concat, coalesce, caseWhen,
  nullIf, currentDate, currentTimestamp, extract, dateAdd, cast,
  lower, upper, trim, substring, length, position, replace,
  startsWith, endsWith, abs, round, ceil, floor, mod, power, sqrt,
  random, arrayAgg, jsonAgg, jsonbAgg, toJson, toJsonb, jsonbSet,
  generateSeries, stringAgg, regexpReplace, regexpMatches, arrayAppend,
  arrayRemove, arrayContains, arrayLength, distinct, ifThen, between, inList
} from 'nestjs-drizzle/postgres';
import { users } from './drizzle';

@Injectable()
export class AppService {
  constructor(private readonly drizzle: DrizzleService<ISchema>) {}

  async examples() {
    // Numeric operations
    const incrementedAge = await this.drizzle.get(users, { 
      incrementedAge: increment(users.age, 5) // age + 5
    });
    
    const roundedValue = await this.drizzle.get(users, { 
      roundedSalary: round(users.salary, 2) // Round to 2 decimal places
    });
    
    // String operations
    const upperName = await this.drizzle.get(users, { 
      upperName: upper(users.name) // Convert name to uppercase
    });
    
    const nameLength = await this.drizzle.get(users, { 
      nameLength: length(users.name) // Get length of name
    });
    
    // Conditional operations
    const activeUsers = await this.drizzle
      .get(users)
      .where(whereIf(shouldFilterActive, eq(users.active, true)));
    
    const userStatus = await this.drizzle.get(users, {
      status: caseWhen([
        { when: sql`${users.age} < 18`, then: 'Minor' },
        { when: sql`${users.age} >= 65`, then: 'Senior' }
      ], 'Adult')
    });
    
    // Date operations
    const userYear = await this.drizzle.get(users, {
      birthYear: extract('year', users.birthDate)
    });
    
    const nextWeek = await this.drizzle.get(users, {
      nextWeek: dateAdd(users.createdAt, '+', '1 week')
    });
    
    // JSON operations
    const userData = await this.drizzle.get(users, {
      userData: jsonObject([users.name, users.email, users.age])
    });
    
    // Array operations
    const tagsWithNewTag = await this.drizzle.get(users, {
      updatedTags: arrayAppend(users.tags, 'new-tag')
    });
  }
}
```

For a complete list of available SQL utility functions and their documentation, refer to the source code or API documentation.

### Executing Raw SQL Queries

nestjs-drizzle allows you to execute raw SQL queries when you need more flexibility:

```ts
import { Injectable } from "@nestjs/common";
import { DrizzleService } from "nestjs-drizzle/postgres";
import { sql } from "drizzle-orm";

@Injectable()
export class AppService {
  constructor(private readonly drizzle: DrizzleService<ISchema>) {}

  async executeRawQuery(userId: string) {
    // Execute a raw SQL query
    const result = await this.drizzle.execute<{ id: string; username: string }>(
      sql`SELECT id, username FROM users WHERE id = ${userId}`
    );
    
    return result.rows;
  }
  
  async complexQuery() {
    // Execute a more complex query
    const result = await this.drizzle.execute(
      sql`
        WITH ranked_users AS (
          SELECT 
            id, 
            username, 
            ROW_NUMBER() OVER (ORDER BY created_at DESC) as rank
          FROM users
        )
        SELECT * FROM ranked_users WHERE rank <= 10
      `
    );
    
    return result.rows;
  }
}
```

## Working with Tests

The `test` directory is excluded from Git to keep the package lightweight, but it's visible in VSCode for development purposes. This is achieved through the following setup:

1. The `/test` directory is listed in `.gitignore` to exclude it from Git
2. VSCode settings in `.vscode/settings.json` ensure the test folder is visible in the editor
3. The `.vscode` directory is partially included in Git (only specific files) through patterns in `.gitignore`

### Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

For more details about the testing approach, see the [test README](test/README.md).