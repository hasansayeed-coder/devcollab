import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

interface PresenceMap {
  [projectId: string]: Map<string, { userId: string; username: string }>
}

const presence: PresenceMap = {}

const getUserFromSocket = (socket: Socket) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie
      ?.split(';')
      .find((c: string) => c.trim().startsWith('accessToken='))
      ?.split('=')[1]

    if (!token) return null
    const payload = jwt.verify(token, env.jwt.accessSecret) as any
    return payload
  } catch {
    return null
  }
}

export const initSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const user = getUserFromSocket(socket)
    console.log(`Socket connected: ${socket.id} user: ${user?.userId || 'anonymous'}`)

    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`)

      if (user) {
        if (!presence[projectId]) presence[projectId] = new Map()
        presence[projectId].set(socket.id, {
          userId: user.userId,
          username: user.username || 'Unknown',
        })

        const members = Array.from(presence[projectId].values())
        io.to(`project:${projectId}`).emit('presence:update', members)
      }
    })

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`)

      if (presence[projectId]) {
        presence[projectId].delete(socket.id)
        const members = Array.from(presence[projectId].values())
        io.to(`project:${projectId}`).emit('presence:update', members)
      }
    })

    socket.on('disconnect', () => {
      for (const projectId in presence) {
        if (presence[projectId].has(socket.id)) {
          presence[projectId].delete(socket.id)
          const members = Array.from(presence[projectId].values())
          io.to(`project:${projectId}`).emit('presence:update', members)
        }
      }
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}