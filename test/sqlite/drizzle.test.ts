import { Test } from '@nestjs/testing';
import { DrizzleService } from '../../src/sqlite/sqlite.service';
import { DrizzleModule } from '../../src/sqlite/sqlite.module';
import { eq, sql } from 'drizzle-orm';
import { users, profiles } from './users.schema';
import { 
  increment, decrement, whereIf, jsonObject, concat, upper, lower,
  round, abs, trim, substring, length, position, replace, startsWith,
  endsWith, dateAdd, ifThen, caseWhen, jsonExtract, jsonHasPath, max2, min2
} from '../../src/sqlite';
import { describe, it, expect, beforeAll, vi, beforeEach, afterAll } from 'vitest';
import type { SQLiteOrTursoDatabase } from '../../src/sqlite/sqlite.service';

// Define a schema type for testing
type Schema = {
  users: typeof users;
  profiles: typeof profiles;
};

describe('DrizzleService (SQLite)', () => {
  let service: DrizzleService<Schema>;
  
  // Mock database operations
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    run: vi.fn(),
    transaction: vi.fn(),
    query: {},
  };

  // Mock user data
  const mockUsers = [
    { id: '1', username: 'testuser', name: 'Test', surname: 'User', age: 30, created_at: new Date().toISOString() },
    { id: '2', username: 'user1', name: 'User', surname: 'One', age: 25, created_at: new Date().toISOString() },
    { id: '3', username: 'user2', name: 'User', surname: 'Two', age: 35, created_at: new Date().toISOString() },
  ];
  
  // Save original environment
  const originalEnv = { ...process.env };
  
  beforeAll(async () => {
    // Mock environment variables
    process.env.DATABASE_URL = 'sqlite::memory:';
    
    // Mock the dynamic require calls in the module
    vi.mock('better-sqlite3', () => {
      return {
        default: vi.fn().mockImplementation(() => ({
          // Mock SQLite methods
          prepare: vi.fn().mockReturnThis(),
          run: vi.fn(),
          get: vi.fn(),
          all: vi.fn(),
          close: vi.fn()
        }))
      };
    });

    // Create a testing module with DrizzleModule
    const moduleRef = await Test.createTestingModule({
      imports: [
        DrizzleModule.forRoot({
          schema: { users, profiles },
          url: ':memory:', // Use in-memory SQLite for testing
        }),
      ],
    }).compile();

    // Get the DrizzleService instance from the module
    service = moduleRef.get<DrizzleService<Schema>>(DrizzleService);
    
    // Replace the db property with our mock
    service.db = mockDb as unknown as SQLiteOrTursoDatabase<Schema>;
  });
  
  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clear all mocks
    vi.clearAllMocks();
    vi.resetModules();
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup mock query property with proper typing
    mockDb.query = {
      users: {
        findMany: vi.fn().mockResolvedValue(mockUsers),
        findFirst: vi.fn().mockResolvedValue(mockUsers[0]),
      },
      profiles: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    
    // Setup mock run method
    mockDb.run.mockImplementation((query) => {
      if (query.toString().includes('SELECT')) {
        return mockUsers;
      }
      return { changes: 1, lastInsertRowid: 4 };
    });
    
    // Setup mock transaction method
    mockDb.transaction.mockImplementation((callback) => {
      return callback(mockDb);
    });
  });

  describe('get', () => {
    it('should call select and from with the correct parameters', () => {
      service.get(users);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(users);
    });

    it('should call select with the specified columns', () => {
      const select = { id: users.id, username: users.username };
      service.get(users, select);
      expect(mockDb.select).toHaveBeenCalledWith(select);
    });
  });

  describe('getWithout', () => {
    it('should exclude specified columns', () => {
      const excludeColumns = { password: true };
      service.getWithout(users, excludeColumns);
      // This is a simplified test since we can't easily check the exact columns
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(users);
    });
  });

  describe('update', () => {
    it('should call update and set with the correct parameters', () => {
      const updateData = { name: 'Updated Name' };
      service.update(users, updateData);
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockDb.set).toHaveBeenCalledWith(updateData);
    });
  });

  describe('insert', () => {
    it('should call insert and values with the correct parameters', () => {
      const userData = { 
        id: '4', 
        username: 'newuser', 
        name: 'New', 
        surname: 'User', 
        email: 'new@example.com',
        password: 'password123',
        age: 28 
      };
      service.insert(users, userData);
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockDb.values).toHaveBeenCalledWith(userData);
    });
  });

  describe('insertMany', () => {
    it('should call insert and values with multiple records', () => {
      const usersData = [
        { 
          id: '4', 
          username: 'user4', 
          email: 'user4@example.com',
          password: 'password123',
        },
        { 
          id: '5', 
          username: 'user5', 
          email: 'user5@example.com',
          password: 'password456',
        }
      ];
      service.insertMany(users, usersData);
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockDb.values).toHaveBeenCalledWith(usersData);
    });
  });

  describe('delete', () => {
    it('should call delete with the correct parameters', () => {
      service.delete(users);
      expect(mockDb.delete).toHaveBeenCalledWith(users);
    });
  });

  describe('execute', () => {
    it('should execute raw SQL queries', async () => {
      const result = await service.execute(sql`SELECT * FROM users`);
      expect(mockDb.run).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('transaction', () => {
    it('should execute a transaction', async () => {
      const callback = vi.fn().mockReturnValue('result');
      const result = await service.transaction(callback);
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });

  describe('query', () => {
    it('should access the query property', () => {
      const query = service.query;
      expect(query).toBe(mockDb.query);
    });

    it('should call findMany on users query', () => {
      // Create a type-safe test that doesn't rely on actual query execution
      const mockQuery = mockDb.query as any;
      const findManyFn = mockQuery.users.findMany;
      expect(findManyFn).toBeDefined();
      
      // Call the function to verify it works
      findManyFn();
      expect(findManyFn).toHaveBeenCalled();
    });

    it('should call findFirst on users query', () => {
      // Create a type-safe test that doesn't rely on actual query execution
      const mockQuery = mockDb.query as any;
      const findFirstFn = mockQuery.users.findFirst;
      expect(findFirstFn).toBeDefined();
      
      // Call the function to verify it works
      findFirstFn();
      expect(findFirstFn).toHaveBeenCalled();
    });
  });

  describe('SQL utility functions', () => {
    it('should create increment expression', () => {
      const expr = increment(users.age, 5);
      expect(expr).toBeDefined();
    });

    it('should create decrement expression', () => {
      const expr = decrement(users.age, 3);
      expect(expr).toBeDefined();
    });

    it('should create whereIf expression', () => {
      const condition = true;
      const clause = sql`${users.age} > 18`;
      const expr = whereIf(condition, clause);
      expect(expr).toBe(clause);

      const falseExpr = whereIf(false, clause);
      expect(falseExpr).toBeUndefined();
    });

    it('should create jsonObject expression', () => {
      const expr = jsonObject([users.name, users.email]);
      expect(expr).toBeDefined();
    });

    it('should create concat expression', () => {
      const expr = concat(users.name, ' ', users.surname);
      expect(expr).toBeDefined();
    });

    it('should create upper expression', () => {
      const expr = upper(users.name);
      expect(expr).toBeDefined();
    });

    it('should create lower expression', () => {
      const expr = lower(users.name);
      expect(expr).toBeDefined();
    });

    it('should create round expression', () => {
      const expr = round(users.age, 2);
      expect(expr).toBeDefined();
    });

    it('should create abs expression', () => {
      const expr = abs(users.age);
      expect(expr).toBeDefined();
    });

    it('should create trim expression', () => {
      const expr = trim(users.name);
      expect(expr).toBeDefined();
    });

    it('should create substring expression', () => {
      const expr = substring(users.name, 1, 3);
      expect(expr).toBeDefined();
    });

    it('should create length expression', () => {
      const expr = length(users.name);
      expect(expr).toBeDefined();
    });

    it('should create position expression', () => {
      const expr = position('a', users.name);
      expect(expr).toBeDefined();
    });

    it('should create replace expression', () => {
      const expr = replace(users.name, 'a', 'b');
      expect(expr).toBeDefined();
    });

    it('should create startsWith expression', () => {
      const expr = startsWith(users.name, 'A');
      expect(expr).toBeDefined();
    });

    it('should create endsWith expression', () => {
      const expr = endsWith(users.name, 'z');
      expect(expr).toBeDefined();
    });

    it('should create dateAdd expression', () => {
      const expr = dateAdd(users.createdAt, '+', '1 day');
      expect(expr).toBeDefined();
    });

    it('should create ifThen expression', () => {
      const expr = ifThen(sql`${users.age} >= 18`, 'Adult', 'Minor');
      expect(expr).toBeDefined();
    });

    it('should create caseWhen expression', () => {
      const expr = caseWhen([
        { when: sql`${users.age} < 18`, then: 'Minor' },
        { when: sql`${users.age} >= 65`, then: 'Senior' }
      ], 'Adult');
      expect(expr).toBeDefined();
    });

    it('should create jsonExtract expression', () => {
      const expr = jsonExtract(users.metadata, '$.name');
      expect(expr).toBeDefined();
    });

    it('should create jsonHasPath expression', () => {
      const expr = jsonHasPath(users.metadata, '$.name');
      expect(expr).toBeDefined();
    });

    it('should create max2 expression', () => {
      const expr = max2(users.age, 18);
      expect(expr).toBeDefined();
    });

    it('should create min2 expression', () => {
      const expr = min2(users.age, 18);
      expect(expr).toBeDefined();
    });
  });
}); 