import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Define the users table schema for testing
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  name: text('name'),
  surname: text('surname'),
  email: text('email').notNull(),
  password: text('password').notNull(),
  age: integer('age'),
  active: integer('active', { mode: 'boolean' }).default(true),
  bio: text('bio'),
  metadata: text('metadata', { mode: 'json' }),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Define the profiles table schema for testing relationships
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  active: integer('active', { mode: 'boolean' }).default(true)
});

// Export all schemas
export default {
  users,
  profiles
}; 