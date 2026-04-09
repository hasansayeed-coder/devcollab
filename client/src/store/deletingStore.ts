import { create } from 'zustand'

interface DeletingStore {
  deletingIds: Set<string>
  addDeleting: (id: string) => void
  removeDeleting: (id: string) => void
  isDeleting: (id: string) => boolean
}

export const useDeletingStore = create<DeletingStore>((set, get) => ({
  deletingIds: new Set(),
  addDeleting: (id) => set(state => ({ deletingIds: new Set([...state.deletingIds, id]) })),
  removeDeleting: (id) => set(state => {
    const next = new Set(state.deletingIds)
    next.delete(id)
    return { deletingIds: next }
  }),
  isDeleting: (id) => get().deletingIds.has(id),
}))