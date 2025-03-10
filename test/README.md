# Testing NestJS Drizzle

This directory contains tests for the NestJS Drizzle package using Vitest.

## Prerequisites

Before running the tests, make sure you have:

1. Node.js installed
2. All dependencies installed (`npm install`)

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `postgres/`: Tests for PostgreSQL integration
  - `drizzle.test.ts`: Tests for the DrizzleService with PostgreSQL

## Mocking Approach

The tests use Vitest's mocking capabilities to mock the database operations instead of connecting to a real database. This approach has several advantages:

1. Tests run faster without actual database connections
2. No need to set up a test database
3. Tests are more reliable and don't depend on external services
4. You can control the exact responses for each test case

### Using DrizzleService Wrapper Functions

The tests prioritize using the DrizzleService wrapper functions (like `service.insert`, `service.update`, etc.) instead of directly accessing `service.db`. This approach better reflects how the service would be used in a real application:

```typescript
// Mock the service methods
service.insert = vi.fn().mockImplementation((table, values) => {
  mockDb.insert.mockReturnThis();
  mockDb.values.mockReturnThis();
  return mockDb.insert(table).values(values);
});

service.update = vi.fn().mockImplementation((table, values) => {
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
  return mockDb.update(table).set(values);
});

// Example usage in tests
const result = await service.insert(users, {
  username: 'testuser',
  name: 'Test',
  surname: 'User',
  age: 30,
}).returning();
```

### Fallback to Direct DB Access

For operations that don't have a direct wrapper function in DrizzleService, the tests fall back to using `service.db` directly:

```typescript
// For operations without a direct wrapper function
const dataTrue = await service.db.select()
  .from(users)
  .where(whereIf(true, eq(users.username, 'testuser')))
  .execute();
```

## Using Vitest

This project uses Vitest for testing, which is a modern test runner compatible with the Jest API but with better performance and TypeScript support.

The configuration is in `vitest.config.ts` at the root of the project. Key features:

- TypeScript support out of the box
- Fast execution with watch mode
- Compatible with Jest's expect API
- Built-in coverage reporting

## Test Setup

The test setup is defined in `test/vitest-setup.ts`. This file is loaded before running the tests and sets up the environment:

```typescript
// This file is used to set up the test environment
import 'reflect-metadata';
import 'dotenv/config'; // Load environment variables from .env.test

// Vitest automatically makes test functions globally available
// No need to manually define them like in Jest
```
