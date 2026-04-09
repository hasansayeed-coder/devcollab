import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'

interface PresenceMember {
  userId: string
  username: string
}

export const usePresence = (socket: Socket | null) => {
  const [onlineMembers, setOnlineMembers] = useState<PresenceMember[]>([])

  useEffect(() => {
    if (!socket) return
    socket.on('presence:update', (members: PresenceMember[]) => {
      setOnlineMembers(members)
    })
    return () => { socket.off('presence:update') }
  }, [socket])

  return onlineMembers
}