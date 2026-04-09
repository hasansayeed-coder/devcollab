import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().optional().default(true),
})

const updateProjectSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().optional(),
})

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const parsed = createProjectSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Validation failed', 400, parsed.error.issues)

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        tags: parsed.data.tags || [],
        isPublic: parsed.data.isPublic,
        members: {
          create: {
            userId: authReq.user!.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
    })

    res.status(201).json({ success: true, project })
  } catch (err) { next(err) }
}

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const { search, page = '1', limit = '12' } = req.query
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const where: any = {
      OR: [
        { isPublic: true },
        { members: { some: { userId: authReq.user!.id } } },
      ],
    }

    if (search && typeof search === 'string') {
      where.AND = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ],
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          members: {
            include: {
              user: { select: { id: true, username: true, avatarUrl: true } },
            },
          },
          _count: { select: { tasks: true } },
        },
      }),
      prisma.project.count({ where }),
    ])

    res.json({
      success: true,
      projects,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    })
  } catch (err) { next(err) }
}

export const getProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const id = req.params['id'] as string

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true, email: true } },
          },
        },
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            assignees: {
              include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    })

    if (!project) throw new AppError('Project not found', 404)

    const isMember = project.members.some(m => m.userId === authReq.user!.id)
    if (!project.isPublic && !isMember) throw new AppError('Access denied', 403)

    res.json({ success: true, project })
  } catch (err) { next(err) }
}

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const id = req.params['id'] as string
    const parsed = updateProjectSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Validation failed', 400, parsed.error.issues)

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId: id } },
    })
    if (!member || !['OWNER', 'CONTRIBUTOR'].includes(member.role))
      throw new AppError('Access denied', 403)

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.tags && { tags: parsed.data.tags }),
        ...(parsed.data.isPublic !== undefined && { isPublic: parsed.data.isPublic }),
      },
    })

    res.json({ success: true, project })
  } catch (err) { next(err) }
}

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const id = req.params['id'] as string

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId: id } },
    })
    if (!member || member.role !== 'OWNER')
      throw new AppError('Only owners can delete projects', 403)

    await prisma.project.delete({ where: { id } })
    res.json({ success: true, message: 'Project deleted' })
  } catch (err) { next(err) }
}