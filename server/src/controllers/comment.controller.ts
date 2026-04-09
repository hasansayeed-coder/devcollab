import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'
import { z } from 'zod'
import { io } from '../index'

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
})

const commentInclude = {
  user: {
    select: { id: true, username: true, avatarUrl: true },
  },
  replies: {
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
      replies: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'asc' as const },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params['taskId'])

    // Only get top-level comments (no parentId)
    const comments = await prisma.comment.findMany({
      where: { taskId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: commentInclude,
    })

    res.json({ success: true, comments })
  } catch (err) { next(err) }
}

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const taskId = String(req.params['taskId'])
    const projectId = String(req.params['id'])

    const parsed = createCommentSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Validation failed', 400, parsed.error.issues)

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!member) throw new AppError('Access denied', 403)

    // Verify parent exists if provided
    if (parsed.data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parsed.data.parentId },
      })
      if (!parent) throw new AppError('Parent comment not found', 404)
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsed.data.content,
        taskId,
        userId: authReq.user!.id,
        parentId: parsed.data.parentId || null,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        replies: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    })

    io.to(`project:${projectId}`).emit('comment:created', { taskId, comment })

    // Activity log only for top-level comments
    if (!parsed.data.parentId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } })
      const { createActivity } = await import('../utils/activity')
      await createActivity({
        projectId,
        userId: authReq.user!.id,
        type: 'comment:created',
        message: `commented on "${task?.title || 'a task'}"`,
        meta: { taskId, commentId: comment.id },
      })
    }

    res.status(201).json({ success: true, comment })
  } catch (err) { next(err) }
}

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const commentId = String(req.params['commentId'])
    const projectId = String(req.params['id'])
    const taskId = String(req.params['taskId'])

    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) throw new AppError('Comment not found', 404)
    if (comment.userId !== authReq.user!.id) throw new AppError('Cannot delete others comments', 403)

    await prisma.comment.delete({ where: { id: commentId } })

    io.to(`project:${projectId}`).emit('comment:deleted', { taskId, commentId })

    res.json({ success: true, message: 'Comment deleted' })
  } catch (err) { next(err) }
}