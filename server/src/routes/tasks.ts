import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { tasks } from '../../../shared/schema';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  projectId: z.number().int().positive('Project ID must be a positive integer'),
  assignedTo: z.number().int().positive().optional(),
  dueDate: z.string().datetime().optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.number().int().positive().optional(),
  dueDate: z.string().datetime().optional()
});

/**
 * GET /api/tasks
 * List all tasks with optional filters
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, projectId, assignedTo, search } = req.query;

    // Build filter conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(tasks.status, status as string));
    }
    if (priority) {
      conditions.push(eq(tasks.priority, priority as string));
    }
    if (projectId) {
      conditions.push(eq(tasks.projectId, parseInt(projectId as string)));
    }
    if (assignedTo) {
      conditions.push(eq(tasks.assignedTo, parseInt(assignedTo as string)));
    }
    if (search) {
      conditions.push(
        or(
          like(tasks.title, `%${search}%`),
          like(tasks.description, `%${search}%`)
        )
      );
    }

    // Query tasks
    const taskList = await db
      .select()
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasks.createdAt));

    res.json({
      tasks: taskList,
      count: taskList.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/tasks/:id
 * Get a specific task by ID
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createTaskSchema.parse(req.body);

    // Create task
    const [newTask] = await db
      .insert(tasks)
      .values({
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        projectId: validatedData.projectId,
        assignedTo: validatedData.assignedTo,
        createdBy: req.user!.id,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null
      })
      .returning();

    res.status(201).json({
      message: 'Task created successfully',
      task: newTask
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update an existing task
 */
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    // Validate request body
    const validatedData = updateTaskSchema.parse(req.body);

    // Check if task exists
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Update task
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    };

    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    // Check if task exists
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Delete task
    await db
      .delete(tasks)
      .where(eq(tasks.id, taskId));

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
