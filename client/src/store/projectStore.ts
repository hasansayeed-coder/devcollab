import { create } from 'zustand'
import { Project, Task } from '../api/projects'

interface ProjectStore {
  projects: Project[]
  currentProject: Project | null
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  removeProject: (id: string) => void
  updateTask: (taskId: string, data: Partial<Task>) => void
  addTask: (task: Task) => void
  removeTask: (taskId: string) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => set({ currentProject: project }),

  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),

  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter(p => p.id !== id) })),

  updateTask: (taskId, data) =>
    set((state) => ({
      currentProject: state.currentProject
        ? {
            ...state.currentProject,
            tasks: state.currentProject.tasks.map((t) =>
              t.id === taskId ? { ...t, ...data } : t
            ),
          }
        : null,
    })),

  addTask: (task) =>
    set((state) => ({
      currentProject: state.currentProject
        ? {
            ...state.currentProject,
            tasks: state.currentProject.tasks.some(t => t.id === task.id)
              ? state.currentProject.tasks
              : [...state.currentProject.tasks, task],
          }
        : null,
    })),

  removeTask: (taskId) =>
    set((state) => ({
      currentProject: state.currentProject
        ? {
            ...state.currentProject,
            tasks: state.currentProject.tasks.filter((t) => t.id !== taskId),
          }
        : null,
    })),
}))