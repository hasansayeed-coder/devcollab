import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'
import { createActivity } from '../utils/activity'
import { z } from 'zod'
import { io } from '../index'

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional().default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  labels: z.array(z.string().max(30)).max(10).optional().default([]),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  labels: z.array(z.string().max(30)).max(10).optional(),
  position: z.number().optional(),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
})

const checkMembership = async (userId: string, projectId: string) => {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  })
  if (!member) throw new AppError('Access denied', 403)
  return member
}

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = req.params['id'] as string
    const parsed = createTaskSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Validation failed', 400, parsed.error.issues)

    await checkMembership(authReq.user!.id, projectId)

    const lastTask = await prisma.task.findFirst({
      where: { projectId, status: parsed.data.status },
      orderBy: { position: 'desc' },
    })
    const position = lastTask ? lastTask.position + 1000 : 1000

    const { assigneeIds, dueDate, status, title, description, priority, labels } = parsed.data

    const task = await prisma.task.create({
  data: {
    title,
    description,
    status,
    priority,
    labels: labels || [],
    position,
    projectId,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    assignees: assigneeIds && assigneeIds.length > 0 ? {
      create: assigneeIds.map((uid) => ({ userId: uid })),
    } : undefined,
  },
  include: {
    assignees: {
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    },
  },
})
await createActivity({
  projectId,
  userId: authReq.user!.id,
  type: 'task:created',
  message: `created task "${task.title}"`,
  meta: { taskId: task.id, taskTitle: task.title },
})
    io.to(`project:${projectId}`).emit('task:created', task)
    res.status(201).json({ success: true, task })
  } catch (err) { next(err) }
}

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = req.params['id'] as string
    const taskId = req.params['taskId'] as string
    const parsed = updateTaskSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Validation failed', 400, parsed.error.issues)

    await checkMembership(authReq.user!.id, projectId)

    const { assigneeIds, dueDate, title, description, status, position, priority, labels } = parsed.data

    const task = await prisma.task.update({
  where: { id: taskId },
  data: {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(status !== undefined && { status }),
    ...(position !== undefined && { position }),
    ...(priority !== undefined && { priority }),
    ...(labels !== undefined && { labels }),
    ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
    ...(assigneeIds !== undefined && {
      assignees: {
        deleteMany: {},
        create: assigneeIds.map((uid) => ({ userId: uid })),
      },
    }),
  },
  include: {
    assignees: {
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    },
  },
})

await createActivity({
  projectId,
  userId: authReq.user!.id,
  type: 'task:updated',
  message: `updated task "${task.title}"`,
  meta: { taskId: task.id, taskTitle: task.title, changes: Object.keys(parsed.data) },
})

    io.to(`project:${projectId}`).emit('task:updated', task)
    res.json({ success: true, task })
  } catch (err) { next(err) }
}

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = req.params['id'] as string
    const taskId = req.params['taskId'] as string

    await checkMembership(authReq.user!.id, projectId)

    const taskToDelete = await prisma.task.findUnique({ where: { id: taskId } })

await prisma.task.delete({ where: { id: taskId } })

if (taskToDelete) {
  await createActivity({
    projectId,
    userId: authReq.user!.id,
    type: 'task:deleted',
    message: `deleted task "${taskToDelete.title}"`,
    meta: { taskTitle: taskToDelete.title },
  })
}

    await prisma.task.delete({ where: { id: taskId } })


    io.to(`project:${projectId}`).emit('task:deleted', { taskId })
    res.json({ success: true, message: 'Task deleted' })
  } catch (err) { next(err) }
}