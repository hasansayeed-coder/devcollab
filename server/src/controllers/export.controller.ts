import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const exportProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])
    const format = String(req.query['format'] || 'json').toLowerCase()

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!member) throw new AppError('Access denied', 403)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            assignees: {
              include: {
                user: { select: { id: true, username: true } },
              },
            },
            comments: {
              include: {
                user: { select: { id: true, username: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!project) throw new AppError('Project not found', 404)

    if (format === 'csv') {
      const headers = [
        'ID',
        'Title',
        'Description',
        'Status',
        'Priority',
        'Labels',
        'Assignees',
        'Due Date',
        'Comments',
        'Created At',
        'Updated At',
      ]

      const escape = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`

      const rows = project.tasks.map(task => [
        escape(task.id),
        escape(task.title),
        escape(task.description || ''),
        escape(task.status),
        escape((task as any).priority || 'MEDIUM'),
        escape((task as any).labels?.join(', ') || ''),
        escape(task.assignees.map(a => a.user.username).join(', ')),
        escape(task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''),
        escape(String(task.comments.length)),
        escape(new Date(task.createdAt).toISOString()),
        escape(new Date(task.updatedAt).toISOString()),
      ])

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/\s+/g, '_')}_export.csv"`)
      return res.send(csv)
    }

    // JSON format
    const exportData = {
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        tags: project.tags,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
        members: project.members.map(m => ({
          username: m.user.username,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        tasks: project.tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: (task as any).priority || 'MEDIUM',
          labels: (task as any).labels || [],
          assignees: task.assignees.map(a => a.user.username),
          dueDate: task.dueDate,
          comments: task.comments.map(c => ({
            author: c.user.username,
            content: c.content,
            createdAt: c.createdAt,
          })),
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })),
      },
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/\s+/g, '_')}_export.json"`)
    return res.send(JSON.stringify(exportData, null, 2))
  } catch (err) { next(err) }
}