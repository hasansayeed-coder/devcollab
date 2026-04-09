import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'

import { env } from './config/env'
import './config/passport'
import passport from 'passport'
import { errorHandler } from './middlewares/errorHandler'
import { notFound } from './middlewares/notFound'
import { initSockets } from './sockets'
import authRouter from './routes/auth.routes'
import projectRouter from './routes/project.routes'
import uploadRouter from './routes/upload.routes'
import notificationRouter from './routes/notification.routes'

const app = express()
const httpServer = http.createServer(app)

export const io = new Server(httpServer, {
  cors: { origin: env.clientUrl, credentials: true },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
})

app.use(helmet())
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(passport.initialize())

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
})

// Rate limiting on auth
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// Routes
app.use('/api/auth', authRouter)
app.use('/api/projects', projectRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/notifications', notificationRouter)

initSockets(io)

app.use(notFound)
app.use(errorHandler)

httpServer.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`)
})