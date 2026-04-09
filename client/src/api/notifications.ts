import { api } from './axios'

export interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  meta?: any
  createdAt: string
}

export const notificationsApi = {
  getAll: async () => {
    const res = await api.get<{ success: boolean; notifications: Notification[]; unreadCount: number }>('/notifications')
    return res.data
  },
  markRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`)
    return res.data
  },
  markAllRead: async () => {
    const res = await api.patch('/notifications/read-all')
    return res.data
  },
}