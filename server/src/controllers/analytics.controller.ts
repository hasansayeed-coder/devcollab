import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const getMemberWorkload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!member) throw new AppError('Access denied', 403)

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    })

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
    })

    const workload = members.map(m => {
      const assigned = tasks.filter(t =>
        t.assignees.some(a => a.user.id === m.user.id)
      )

      return {
        id: m.user.id,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        total: assigned.length,
        todo: assigned.filter(t => t.status === 'TODO').length,
        inProgress: assigned.filter(t => t.status === 'IN_PROGRESS').length,
        done: assigned.filter(t => t.status === 'DONE').length,
        tasks: assigned.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: (t as any).priority || 'MEDIUM',
          dueDate: t.dueDate,
        })),
      }
    }).sort((a, b) => b.total - a.total)

    res.json({ success: true, workload })
  } catch (err) { next(err) }
}

export const getProjectAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!member) throw new AppError('Access denied', 403)

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        comments: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    })

    // Task counts by status
    const statusCounts = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      DONE: tasks.filter(t => t.status === 'DONE').length,
    }

    const totalTasks = tasks.length
    const completionRate = totalTasks > 0
      ? Math.round((statusCounts.DONE / totalTasks) * 100)
      : 0

    // Overdue tasks
    const now = new Date()
    const overdueTasks = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    ).length

    // Tasks per member
    const memberActivity = members.map(m => {
      const assigned = tasks.filter(t =>
        t.assignees.some(a => a.user.id === m.user.id)
      ).length
      const completed = tasks.filter(t =>
        t.assignees.some(a => a.user.id === m.user.id) && t.status === 'DONE'
      ).length
      const commented = tasks.reduce((acc, t) =>
        acc + t.comments.filter((c: any) => c.userId === m.user.id).length, 0
      )
      return {
        id: m.user.id,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        assigned,
        completed,
        commented,
      }
    }).sort((a, b) => b.assigned - a.assigned)

    // Tasks created over last 14 days
    const days = 14
    const taskTimeline = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const created = tasks.filter(t => {
        const d = new Date(t.createdAt)
        return d >= date && d < nextDate
      }).length

      const completed = tasks.filter(t => {
        const d = new Date(t.updatedAt)
        return d >= date && d < nextDate && t.status === 'DONE'
      }).length

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created,
        completed,
      }
    })

    // Priority breakdown (due soon vs overdue vs normal)
    const dueSoon = tasks.filter(t => {
      if (!t.dueDate || t.status === 'DONE') return false
      const due = new Date(t.dueDate)
      const twoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      return due > now && due <= twoDays
    }).length

    res.json({
      success: true,
      analytics: {
        totalTasks,
        completionRate,
        overdueTasks,
        dueSoon,
        statusCounts,
        memberActivity,
        taskTimeline,
      },
    })
  } catch (err) { next(err) }
}