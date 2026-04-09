import { api } from './axios'

export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string
  bio?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user: User
}

export const authApi = {
  register: async (data: { email: string; username: string; password: string }) => {
    const res = await api.post<AuthResponse>('/auth/register', data)
    return res.data
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<AuthResponse>('/auth/login', data)
    return res.data
  },

  logout: async () => {
    const res = await api.post('/auth/logout')
    return res.data
  },

  getMe: async () => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me')
    return res.data
  },

  refresh: async () => {
    const res = await api.post('/auth/refresh')
    return res.data
  },
}