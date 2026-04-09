import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi } from '../../api/projects'
import { useProjectStore } from '../../store/projectStore'
import { useAuthStore } from '../../store/authStore'
import { useSocket } from '../../hooks/useSocket'
import { usePresence } from '../../hooks/usePresence'
import KanbanBoard from '../../components/task/KanbanBoard'
import { Button } from '@/components/ui/button'
import ThemeToggle from '../../components/layout/ThemeToggle'
import AnalyticsPanel from '../../components/project/AnalyticsPanel'
import ActivityFeed from '../../components/project/ActivityFeed'
import MembersPanel from '../../components/project/MembersPanel'
import ProjectSettings from '../../components/project/ProjectSettings'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import ShortcutsModal from '../../components/layout/ShortcutsModal'
import CreateTaskModal from '../../components/task/CreateTaskModal'
import ExportButton from '../../components/project/ExportButton'
import GitHubPanel, { GitHubIcon } from '../../components/project/GitHubPanel'
import { useDeletingStore } from '../../store/deletingStore'
import WorkloadPanel from '../../components/project/WorkloadPanel'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentProject, setCurrentProject, addTask, updateTask, removeTask } = useProjectStore()
  const { socket } = useSocket(id)
  const onlineMembers = usePresence(socket)
  const { isDeleting } = useDeletingStore()

  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showGitHub, setShowGitHub] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [quickCreateColumn, setQuickCreateColumn] = useState<string | null>(null)
  const [showWorkload, setShowWorkload] = useState(false)

  // Load project
  useEffect(() => {
    if (!id) return
    projectsApi.getOne(id).then(({ project }) => setCurrentProject(project))
    return () => setCurrentProject(null)
  }, [id])

  // Socket listeners — single effect, no duplicates
  useEffect(() => {
    if (!socket) return

    const onTaskCreated = (task: any) => {
      if (!isDeleting(task.id)) addTask(task)
    }
    const onTaskUpdated = (task: any) => {
      if (!isDeleting(task.id)) updateTask(task.id, task)
    }
    const onTaskDeleted = ({ taskId }: { taskId: string }) => {
      if (!isDeleting(taskId)) removeTask(taskId)
    }

    socket.on('task:created', onTaskCreated)
    socket.on('task:updated', onTaskUpdated)
    socket.on('task:deleted', onTaskDeleted)

    return () => {
      socket.off('task:created', onTaskCreated)
      socket.off('task:updated', onTaskUpdated)
      socket.off('task:deleted', onTaskDeleted)
    }
  }, [socket, addTask, updateTask, removeTask, isDeleting])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'New task in Todo',
      action: () => {
        if (!showAnalytics && !showActivity && !showMembers && !showSettings) {
          setQuickCreateColumn('TODO')
        }
      },
    },
    {
      key: '?',
      description: 'Show shortcuts',
      action: () => setShowShortcuts(true),
    },
    {
      key: 'Escape',
      description: 'Close panels',
      action: () => {
        setShowAnalytics(false)
        setShowActivity(false)
        setShowMembers(false)
        setShowShortcuts(false)
        setShowGitHub(false)
        setShowSettings(false)
        setQuickCreateColumn(null)
        setShowWorkload(false)
      },
    },
  ])

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    )
  }

  const myRole = currentProject.members.find(m => m.user.id === user?.id)?.role
  const isOwner = myRole === 'OWNER'
  const canEdit = myRole === 'OWNER' || myRole === 'CONTRIBUTOR'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-4 bg-background relative z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          Back
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold truncate">{currentProject.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
              currentProject.isPublic
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {currentProject.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          {currentProject.description && (
            <p className="text-sm text-muted-foreground truncate">{currentProject.description}</p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          <ThemeToggle />

          {/* Settings gear — owners only */}
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              title="Project settings"
              className="text-muted-foreground hover:text-foreground"
            >
              ⚙
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowAnalytics(true)}>
            Analytics
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowActivity(true)}>
            Activity
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowMembers(true)}>
            Members
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowWorkload(true)}>
             Workload
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGitHub(true)}
            className="flex items-center gap-1.5"
          >
            <GitHubIcon />
            GitHub
          </Button>

          <ExportButton
            projectId={currentProject.id}
            projectName={currentProject.name}
          />

          <span className="text-xs text-muted-foreground border border-border rounded px-2 py-1">
            {myRole}
          </span>

          {/* Online member avatars */}
          <div className="flex -space-x-2">
            {currentProject.members.slice(0, 5).map((m) => {
              const isOnline = onlineMembers.some(om => om.userId === m.user.id)
              return (
                <div
                  key={m.id}
                  className="relative"
                  title={`${m.user.username} (${m.role})`}
                >
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border-2 border-background overflow-hidden">
                    {m.user.avatarUrl ? (
                      <img
                        src={m.user.avatarUrl}
                        alt={m.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      m.user.username[0].toUpperCase()
                    )}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-background" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Shortcuts hint */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
            title="Keyboard shortcuts"
          >
            ?
          </button>
        </div>
      </header>

      <main className="p-6">
        {/* Tags */}
        {currentProject.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-6">
            {currentProject.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <KanbanBoard
          projectId={currentProject.id}
          socket={socket}
          canEdit={canEdit}
          members={currentProject.members}
        />
      </main>

      {/* Panels */}
      {showAnalytics && (
        <AnalyticsPanel
          projectId={currentProject.id}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showActivity && (
        <ActivityFeed
          projectId={currentProject.id}
          socket={socket}
          onClose={() => setShowActivity(false)}
        />
      )}

      {showMembers && (
        <MembersPanel
          project={currentProject}
          onClose={() => setShowMembers(false)}
        />
      )}

      {showGitHub && (
        <GitHubPanel
          projectId={currentProject.id}
          githubRepo={currentProject.githubRepo}
          isOwner={isOwner}
          onClose={() => setShowGitHub(false)}
        />
      )}

      {showSettings && (
  <ProjectSettings
    key={currentProject.id + currentProject.isPublic}
    project={currentProject}
    onClose={() => setShowSettings(false)}
  />
)}

      {quickCreateColumn && (
        <CreateTaskModal
          projectId={currentProject.id}
          defaultStatus={quickCreateColumn}
          members={currentProject.members}
          onClose={() => setQuickCreateColumn(null)}
        />
      )}

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {showWorkload && (
  <WorkloadPanel
    projectId={currentProject.id}
    onClose={() => setShowWorkload(false)}
  />
)}
    </div>
  )
}