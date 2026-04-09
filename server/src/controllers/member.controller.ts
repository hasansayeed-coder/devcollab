import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'
import { createActivity } from '../utils/activity'
import { prisma as db } from '../db/prisma'
import { z } from 'zod'
import { emailQueue } from '../config/queue'
import { env } from '../config/env'


const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['CONTRIBUTOR', 'VIEWER']).default('CONTRIBUTOR'),
})

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = String(req.params['id'])

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, email: true } },
      },
    })
    res.json({ success: true, members })
  } catch (err) { next(err) }
}

export const inviteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])
    const parsed = inviteSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Validation failed', 400, parsed.error.issues)

    const ownerMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!ownerMember || ownerMember.role !== 'OWNER')
      throw new AppError('Only owners can invite members', 403)

    const invitedUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })
    if (!invitedUser) throw new AppError('User not found', 404)

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: invitedUser.id, projectId } },
    })
    if (existing) throw new AppError('User is already a member', 409)

    const member = await prisma.projectMember.create({
      data: {
        userId: invitedUser.id,
        projectId,
        role: parsed.data.role,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, email: true } },
      },
    })

    await createActivity({
  projectId,
  userId: authReq.user!.id,
  type: 'member:joined',
  message: `added ${invitedUser.username} to the project`,
  meta: { newMemberId: invitedUser.id, newMemberUsername: invitedUser.username },
})

    // Queue invite email
    
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (emailQueue) {
        await emailQueue.add('invite-email', {
        type: 'invite',
        to: invitedUser.email,
        data: {
          inviterUsername: authReq.user!.email,
          projectName: project?.name || 'a project',
          inviteUrl: `${env.clientUrl}/projects/${projectId}`,
        },
    })
  }


    res.status(201).json({ success: true, member })
  } catch (err) { next(err) }
}

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])
    const userId = String(req.params['userId'])

    const ownerMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!ownerMember || ownerMember.role !== 'OWNER')
      throw new AppError('Only owners can remove members', 403)

    if (userId === authReq.user!.id)
      throw new AppError('Cannot remove yourself', 400)

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    })

    const removedUser = await prisma.user.findUnique({ where: { id: userId } })
await createActivity({
  projectId,
  userId: authReq.user!.id,
  type: 'member:removed',
  message: `removed ${removedUser?.username || 'a member'} from the project`,
  meta: { removedUserId: userId },
})

    res.json({ success: true, message: 'Member removed' })
  } catch (err) { next(err) }
}

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])
    const userId = String(req.params['userId'])
    const { role } = req.body as { role: 'OWNER' | 'CONTRIBUTOR' | 'VIEWER' }

    const ownerMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!ownerMember || ownerMember.role !== 'OWNER')
      throw new AppError('Only owners can change roles', 403)

    const member = await prisma.projectMember.update({
      where: { userId_projectId: { userId, projectId } },
      data: { role },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    })

    res.json({ success: true, member })
  } catch (err) { next(err) }
}