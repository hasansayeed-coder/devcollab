import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AuthRequest } from '../middlewares/authenticate'

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const notifications = await prisma.notification.findMany({
      where: { userId: authReq.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const unreadCount = notifications.filter(n => !n.read).length
    res.json({ success: true, notifications, unreadCount })
  } catch (err) { next(err) }
}

export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    await prisma.notification.updateMany({
      where: { userId: authReq.user!.id, read: false },
      data: { read: true },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
}

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const id = String(req.params['id'])
    await prisma.notification.update({
      where: { id, userId: authReq.user!.id },
      data: { read: true },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
}