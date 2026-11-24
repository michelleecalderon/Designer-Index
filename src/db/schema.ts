import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Stores authenticated users synchronized from Firebase Authentication.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Core table for the resource directory: supports external links, copyable prompts, and expandable notes.
export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  itemType: text('item_type').notNull(), // 'link' | 'prompt' | 'note'
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  pricing: text('pricing').notNull().default('Free'), // 'Free' | 'Freemium' | 'Paid' | 'N/A'
  tags: text('tags').array().notNull().default([]),
  url: text('url'),
  content: text('content'),
  isPublic: boolean('is_public').notNull().default(true),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  author: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
}));
