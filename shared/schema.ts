import { pgTable, serial, text, timestamp, integer, pgEnum, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['admin', 'manager', 'user']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'review', 'done']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'critical']);
export const notificationTypeEnum = pgEnum('notification_type', ['task_assigned', 'task_updated', 'comment_added', 'project_invite']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Project users association table
export const projectUsers = pgTable('project_users', {
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.projectId, table.userId] })
  };
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  createdBy: integer('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Task comments table
export const taskComments = pgTable('task_comments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  relatedTaskId: integer('related_task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  relatedProjectId: integer('related_project_id').references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Files table
export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  assignedTasks: many(tasks, { relationName: 'assignedTasks' }),
  createdTasks: many(tasks, { relationName: 'createdTasks' }),
  comments: many(taskComments),
  notifications: many(notifications),
  uploadedFiles: many(files),
  projectMemberships: many(projectUsers)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id]
  }),
  tasks: many(tasks),
  members: many(projectUsers),
  files: many(files)
}));

export const projectUsersRelations = relations(projectUsers, ({ one }) => ({
  project: one(projects, {
    fields: [projectUsers.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [projectUsers.userId],
    references: [users.id]
  })
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id]
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: 'assignedTasks'
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: 'createdTasks'
  }),
  comments: many(taskComments),
  notifications: many(notifications),
  files: many(files)
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id]
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
  relatedTask: one(tasks, {
    fields: [notifications.relatedTaskId],
    references: [tasks.id]
  }),
  relatedProject: one(projects, {
    fields: [notifications.relatedProjectId],
    references: [projects.id]
  })
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploader: one(users, {
    fields: [files.uploadedBy],
    references: [users.id]
  }),
  task: one(tasks, {
    fields: [files.taskId],
    references: [tasks.id]
  }),
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id]
  })
}));
