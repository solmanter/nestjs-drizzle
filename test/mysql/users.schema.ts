import { mysqlTable, varchar, int, text, boolean, timestamp, json } from 'drizzle-orm/mysql-core';

// Define the users table schema for testing
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  surname: varchar('surname', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  age: int('age'),
  active: boolean('active').default(true),
  bio: text('bio'),
  metadata: json('metadata'),
  tags: json('tags').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Define the profiles table schema for testing relationships
export const profiles = mysqlTable('profiles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  active: boolean('active').default(true)
});

// Export all schemas
export default {
  users,
  profiles
}; 