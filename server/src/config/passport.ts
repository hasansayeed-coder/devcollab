import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { Strategy as GitHubStrategy } from 'passport-github2'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma'
import { env } from './env'
import { Request } from 'express'

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return done(null, false, { message: 'Invalid credentials' })
      if (!user.passwordHash) return done(null, false, { message: 'Use GitHub login' })

      const isMatch = await bcrypt.compare(password, user.passwordHash)
      if (!isMatch) return done(null, false, { message: 'Invalid credentials' })

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
))

// JWT Strategy — reads from httpOnly cookie
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromExtractors([
      (req: Request) => req?.cookies?.accessToken || null
    ]),
    secretOrKey: env.jwt.accessSecret,
  },
  async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!user) return done(null, false)
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
))

// GitHub Strategy
passport.use(new GitHubStrategy(
  {
    clientID: env.github.clientId,
    clientSecret: env.github.clientSecret,
    callbackURL: env.github.callbackUrl,
    scope: ['user:email'],
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value
      if (!email) return done(null, false, { message: 'No email from GitHub' })

      let user = await prisma.user.findUnique({ where: { githubId: profile.id } })

      if (!user) {
        user = await prisma.user.findUnique({ where: { email } })
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { githubId: profile.id, avatarUrl: profile.photos?.[0]?.value },
          })
        } else {
          const username = profile.username || email.split('@')[0]
          const existingUsername = await prisma.user.findUnique({ where: { username } })
          user = await prisma.user.create({
            data: {
              email,
              username: existingUsername ? `${username}_${Date.now()}` : username,
              githubId: profile.id,
              avatarUrl: profile.photos?.[0]?.value,
            },
          })
        }
      }

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
))

export default passport