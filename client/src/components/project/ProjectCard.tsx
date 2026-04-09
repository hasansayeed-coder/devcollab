import { useNavigate } from 'react-router-dom'
import { Project } from '../../api/projects'
import { useToastStore } from '../../store/toastStore'
import { useProjectStore } from '../../store/projectStore'
import { projectsApi } from '../../api/projects'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Props {
  project: Project
  onDelete?: (id: string) => void
  isOwner?: boolean
  onEdit?: (project: Project) => void
}

export default function ProjectCard({ project, onDelete, isOwner, onEdit }: Props) {
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    let undone = false
    onDelete?.(project.id)

    addToast({
      message: `Project "${project.name}" deleted`,
      onUndo: () => { undone = true },
    })

    setTimeout(async () => {
      if (!undone) {
        try {
          await projectsApi.delete(project.id)
        } catch {
          addToast({ message: 'Failed to delete project' })
        }
      }
    }, 5000)
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow relative group"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Action buttons on hover */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {isOwner && onEdit && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(project) }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm"
            title="Edit project"
            onPointerDown={e => e.stopPropagation()}
          >
            ⚙
          </button>
        )}
        {isOwner && (
          <button
            onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors text-lg leading-none"
            title="Delete project"
            onPointerDown={e => e.stopPropagation()}
          >
            ×
          </button>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between pr-8">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
            project.isPublic
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {project.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description || 'No description'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.map((tag) => (
            <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs border-2 border-background overflow-hidden"
                title={m.user.username}
              >
                {m.user.avatarUrl ? (
                  <img src={m.user.avatarUrl} alt={m.user.username} className="w-full h-full object-cover" />
                ) : (
                  m.user.username[0].toUpperCase()
                )}
              </div>
            ))}
            {project.members.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-background">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <span>{project._count?.tasks || 0} tasks</span>
        </div>
      </CardContent>
    </Card>
  )
}