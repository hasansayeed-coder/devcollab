import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = (projectId?: string) => {
  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
    })
    socketRef.current = newSocket
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket)

    if (projectId) {
      newSocket.emit('join:project', projectId)
    }

    return () => {
      if (projectId) newSocket.emit('leave:project', projectId)
      newSocket.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [projectId])

  return { socket, socketRef }
}