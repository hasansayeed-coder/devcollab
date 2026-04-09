import { api } from './axios'

export interface Member {
  id: string
  role: 'OWNER' | 'CONTRIBUTOR' | 'VIEWER'
  user: { id: string; username: string; avatarUrl?: string; email?: string }
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  position: number
  dueDate?: string
  assignees: { user: { id: string; username: string; avatarUrl?: string } }[]
}

export interface Project {
  id: string
  name: string
  description?: string
  tags: string[]
  isPublic: boolean
  githubRepo?: string
  createdAt: string
  members: Member[]
  tasks: Task[]
  _count?: { tasks: number }
}

export interface Comment {
  id: string
  content: string
  parentId?: string
  createdAt: string
  user: { id: string; username: string; avatarUrl?: string }
  replies?: Comment[]
}

export interface MemberWorkload {
  id: string
  username: string
  avatarUrl?: string
  role: string
  total: number
  todo: number
  inProgress: number
  done: number
  tasks: {
    id: string
    title: string
    status: string
    priority: string
    dueDate?: string
  }[]
}

export const projectsApi = {
  getAll: async (params?: { search?: string; page?: number }) => {
    const res = await api.get<{ success: boolean; projects: Project[]; pagination: any }>('/projects', { params })
    return res.data
  },

  getOne: async (id: string) => {
    const res = await api.get<{ success: boolean; project: Project }>(`/projects/${id}`)
    return res.data
  },

  create: async (data: { name: string; description?: string; tags?: string[]; isPublic?: boolean }) => {
    const res = await api.post<{ success: boolean; project: Project }>('/projects', data)
    return res.data
  },

  update: async (id: string, data: Partial<{ name: string; description: string; tags: string[]; isPublic: boolean }>) => {
    const res = await api.patch<{ success: boolean; project: Project }>(`/projects/${id}`, data)
    return res.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/projects/${id}`)
    return res.data
  },

  deleteTask: async (projectId: string, taskId: string) => {
    const res = await api.delete(`/projects/${projectId}/tasks/${taskId}`)
    return res.data
  },

  inviteMember: async (projectId: string, data: { email: string; role?: string }) => {
    const res = await api.post(`/projects/${projectId}/members`, data)
    return res.data
  },

  removeMember: async (projectId: string, userId: string) => {
    const res = await api.delete(`/projects/${projectId}/members/${userId}`)
    return res.data
  },

  getComments: async (projectId: string, taskId: string) => {
  const res = await api.get<{ success: boolean; comments: Comment[] }>(
    `/projects/${projectId}/tasks/${taskId}/comments`
  )
  return res.data
},

deleteComment: async (projectId: string, taskId: string, commentId: string) => {
  const res = await api.delete(
    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
  )
  return res.data
},

getAnalytics: async (projectId: string) => {
  const res = await api.get<{ success: boolean; analytics: ProjectAnalytics }>(
    `/projects/${projectId}/analytics`
  )
  return res.data
},

createTask: async (projectId: string, data: {
  title: string
  description?: string
  status?: string
  priority?: string
  labels?: string[]
  dueDate?: string
  assigneeIds?: string[]
}) => {
  const res = await api.post<{ success: boolean; task: Task }>(`/projects/${projectId}/tasks`, data)
  return res.data
},

updateTask: async (projectId: string, taskId: string, data: Partial<Task & { assigneeIds: string[] }>) => {
  const res = await api.patch<{ success: boolean; task: Task }>(`/projects/${projectId}/tasks/${taskId}`, data)
  return res.data
},

updateMemberRole: async (projectId: string, userId: string, role: string) => {
  const res = await api.patch(`/projects/${projectId}/members/${userId}`, { role })
  return res.data
},

getActivities: async (projectId: string, page = 1) => {
  const res = await api.get<{ success: boolean; activities: Activity[]; total: number }>(
    `/projects/${projectId}/activities`,
    { params: { page, limit: 30 } }
  )
  return res.data
},

linkRepo: async (projectId: string, githubRepo: string | null) => {
  const res = await api.patch(`/projects/${projectId}/github`, { githubRepo })
  return res.data
},

getCommits: async (projectId: string) => {
  const res = await api.get<{ success: boolean; commits: Commit[]; repo: string }>(
    `/projects/${projectId}/github/commits`
  )
  return res.data
},

createComment: async (projectId: string, taskId: string, content: string, parentId?: string) => {
  const res = await api.post<{ success: boolean; comment: Comment }>(
    `/projects/${projectId}/tasks/${taskId}/comments`,
    { content, parentId }
  )
  return res.data
},

getWorkload: async (projectId: string) => {
  const res = await api.get<{ success: boolean; workload: MemberWorkload[] }>(
    `/projects/${projectId}/workload`
  )
  return res.data
},
}

export interface ProjectAnalytics {
  totalTasks: number
  completionRate: number
  overdueTasks: number
  dueSoon: number
  statusCounts: { TODO: number; IN_PROGRESS: number; DONE: number }
  memberActivity: {
    id: string
    username: string
    avatarUrl?: string
    role: string
    assigned: number
    completed: number
    commented: number
  }[]
  taskTimeline: { date: string; created: number; completed: number }[]
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: Priority
  labels: string[]
  position: number
  dueDate?: string
  assignees: { user: { id: string; username: string; avatarUrl?: string } }[]
}

export interface Activity {
  id: string
  type: string
  message: string
  meta?: any
  createdAt: string
  user: { id: string; username: string; avatarUrl?: string }
}

export interface Commit {
  sha: string
  message: string
  author: string
  authorAvatar?: string
  date: string
  url: string
}