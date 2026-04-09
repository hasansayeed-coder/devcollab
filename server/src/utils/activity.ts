import { prisma } from '../db/prisma'
import { io } from '../index'

interface CreateActivityParams {
  projectId: string
  userId: string
  type: string
  message: string
  meta?: Record<string, any>
}

export const createActivity = async ({
  projectId,
  userId,
  type,
  message,
  meta,
}: CreateActivityParams) => {
  const activity = await prisma.activity.create({
    data: { projectId, userId, type, message, meta },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  })

  io.to(`project:${projectId}`).emit('activity:created', activity)

  return activity
}