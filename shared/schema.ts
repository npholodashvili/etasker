import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferModel } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["admin", "manager", "user"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 191 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 191 }).notNull(),
  name: varchar("name", { length: 191 }).notNull(),
  role: userRole("role").notNull().default("user"),
  avatar_url: varchar("avatar_url", { length: 1024 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  owner_id: integer("owner_id").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const project_users = pgTable("project_users", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").references(() => projects.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  role: userRole("role").notNull().default("user"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);
export const taskStatus = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: taskPriority("priority").notNull().default("medium"),
  status: taskStatus("status").notNull().default("pending"),
  due_date: timestamp("due_date"),
  assignee_id: integer("assignee_id").references(() => users.id),
  project_id: integer("project_id").references(() => projects.id).notNull(),
  created_by: integer("created_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const task_comments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  task_id: integer("task_id").references(() => tasks.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const notificationType = pgEnum("notification_type", [
  "task_assigned",
  "task_updated",
  "deadline_reminder",
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  type: notificationType("type").notNull(),
  read: boolean("read").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  task_id: integer("task_id").references(() => tasks.id),
  filename: varchar("filename", { length: 1024 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  uploaded_by: integer("uploaded_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type User = InferModel<typeof users>;
export type NewUser = InferModel<typeof users, "insert">;
export type Task = InferModel<typeof tasks>;
export type NewTask = InferModel<typeof tasks, "insert">;
