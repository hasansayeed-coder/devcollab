import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])
    const { page = '1', limit = '30' } = req.query

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!member) throw new AppError('Access denied', 403)

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      prisma.activity.count({ where: { projectId } }),
    ])

    res.json({ success: true, activities, total })
  } catch (err) { next(err) }
}