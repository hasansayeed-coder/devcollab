import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/token'
import { AuthRequest } from '../middlewares/authenticate'
import { env } from '../config/env'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError('Validation failed', 400, parsed.error.issues)
    }

    const { email, username, password } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) {
      throw new AppError(
        existing.email === email ? 'Email already in use' : 'Username already taken',
        409
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
    })

    const accessToken = generateAccessToken({ userId: user.id, email: user.email })
    const refreshToken = await generateRefreshToken(user.id)
    setAuthCookies(res, accessToken, refreshToken)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError('Validation failed', 400, parsed.error.issues)
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials', 401)
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) throw new AppError('Invalid credentials', 401)

    const accessToken = generateAccessToken({ userId: user.id, email: user.email })
    const refreshToken = await generateRefreshToken(user.id)
    setAuthCookies(res, accessToken, refreshToken)

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) throw new AppError('No refresh token', 401)

    const stored = await prisma.refreshToken.findUnique({ where: { token } })
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401)
    }

    // Rotate — delete old, issue new
    await prisma.refreshToken.delete({ where: { token } })

    const user = await prisma.user.findUnique({ where: { id: stored.userId } })
    if (!user) throw new AppError('User not found', 404)

    const accessToken = generateAccessToken({ userId: user.id, email: user.email })
    const refreshToken = await generateRefreshToken(user.id)
    setAuthCookies(res, accessToken, refreshToken)

    res.json({ success: true, message: 'Tokens refreshed' })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } })
    }
    clearAuthCookies(res)
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const user = await prisma.user.findUnique({
      where: { id: authReq.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    })
    if (!user) throw new AppError('User not found', 404)
    res.json({ success: true, user })
  } catch (err) {
    next(err)
  }
}

export const githubCallback = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  const user = authReq.user!

  const accessToken = generateAccessToken({ userId: user.id, email: user.email })
  const refreshToken = await generateRefreshToken(user.id)
  setAuthCookies(res, accessToken, refreshToken)

  res.redirect(`${env.clientUrl}/dashboard`)
}