import { Request, Response, NextFunction } from 'express'
import passport from 'passport'
import { User } from '@prisma/client'

export interface AuthRequest extends Request {
  user?: User
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: User) => {
    if (err) return next(err)
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    (req as AuthRequest).user = user
    next()
  })(req, res, next)
}

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    next()
  }
}