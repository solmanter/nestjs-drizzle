import { pgTable, varchar, uuid, integer, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Define the users table schema for testing
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  surname: varchar('surname', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  age: integer('age'),
  active: boolean('active').default(true),
  bio: text('bio'),
  metadata: jsonb('metadata'),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Define the profiles table schema for testing relationships
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
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