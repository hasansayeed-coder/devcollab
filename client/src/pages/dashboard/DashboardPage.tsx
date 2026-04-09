import { useEffect, useState } from 'react'
import { projectsApi } from '../../api/projects'
import { useProjectStore } from '../../store/projectStore'
import { useAuthStore } from '../../store/authStore'
import ProjectCard from '../../components/project/ProjectCard'
import CreateProjectModal from '../../components/project/CreateProjectModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import NotificationBell from '../../components/layout/NotificationBell'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle'
import { useCommandPalette } from '../../hooks/useCommandPalette'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import ShortcutsModal from '../../components/layout/ShortcutsModal'
import ProjectSettings from '../../components/project/ProjectSettings'

export default function DashboardPage() {
  const { logout } = useAuthStore()
  const { projects, setProjects } = useProjectStore()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { user } = useAuthStore()
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useKeyboardShortcuts([
  {
    key: 'c',
    description: 'Create new project',
    action: () => setShowModal(true),
  },
  {
    key: '?',
    description: 'Show shortcuts',
    action: () => setShowShortcuts(true),
  },
])

  const fetchProjects = async (q?: string) => {
    setLoading(true)
    try {
      const { projects } = await projectsApi.getAll({ search: q })
      setProjects(projects)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectDelete = (id: string) => {
  setProjects(projects.filter(p => p.id !== id))
}

  const navigate = useNavigate()
  const { toggle } = useCommandPalette()  

  useEffect(() => { fetchProjects() }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchProjects(search), 400)
    return () => clearTimeout(timeout)
  }, [search])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <h1 className="text-xl font-semibold">DevCollab</h1>
    <button
      onClick={toggle}
      className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-lg transition-colors"
    >
      <span>⌕ Search...</span>
      <kbd className="text-xs bg-background px-1.5 py-0.5 rounded border">Ctrl K</kbd>
    </button>
  </div>
  <div className="flex items-center gap-3">
    <ThemeToggle />
    <NotificationBell />
    <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
      @{user?.username}
    </Button>
    <Button variant="outline" size="sm" onClick={logout}>
      Sign out
    </Button>
  </div>
</header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Projects</h2>
          <Button onClick={() => setShowModal(true)}>New project</Button>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search projects by name, description or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-lg bg-secondary animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No projects yet</p>
            <p className="text-sm mb-4">Create your first project to get started</p>
            <Button onClick={() => setShowModal(true)}>Create project</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
  const isOwner = project.members.some(
    m => m.user.id === user?.id && m.role === 'OWNER'
  )
  return (
    <ProjectCard
      key={project.id}
      project={project}
      onDelete={handleProjectDelete}
      isOwner={isOwner}
      onEdit={setEditingProject}
    />
  )
})}
          </div>
        )}
      </main>

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
        {showShortcuts && (
  <ShortcutsModal onClose={() => setShowShortcuts(false)} />
)}
{editingProject && (
  <ProjectSettings
    project={editingProject}
    onClose={() => {
      setEditingProject(null)
      fetchProjects()
    }}
  />
)}
    </div>
  )
}