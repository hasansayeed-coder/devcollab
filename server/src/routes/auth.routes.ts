import { Router } from 'express'
import passport from 'passport'
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  githubCallback,
} from '../controllers/auth.controller'
import { authenticate } from '../middlewares/authenticate'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authenticate, getMe)

router.get('/github',
  passport.authenticate('github', { session: false, scope: ['user:email'] })
)
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  githubCallback
)

export default router