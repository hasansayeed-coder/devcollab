import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, projectsApi } from '../../api/projects'
import { useProjectStore } from '../../store/projectStore'
import { useToastStore } from '../../store/toastStore'
import { useDeletingStore } from '../../store/deletingStore'
import { Card, CardContent } from '@/components/ui/card'
import TaskDetailPanel from './TaskDetailPanel'
import { PRIORITY_CONFIG, getLabelColor } from '../../config/taskConfig'
import { Member  } from '../../api/projects'

interface Props {
  task: Task
  projectId: string
  socket?: any
  canEdit?: boolean
  members?: Member[]
}


export default function TaskCard({ task, projectId, socket, canEdit = true, members = [] }: Props) {
  const { removeTask, addTask } = useProjectStore()
  const { addToast } = useToastStore()
  const { addDeleting, removeDeleting } = useDeletingStore()
  const [showDetail, setShowDetail] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this task?')) return

    addDeleting(task.id)
    removeTask(task.id)

    let undone = false

    addToast({
      message: `Task "${task.title}" deleted`,
      onUndo: () => {
        undone = true
        removeDeleting(task.id)
        addTask(task)
      },
    })

    try {
      await projectsApi.deleteTask(projectId, task.id)
      removeDeleting(task.id)
    } catch {
      if (!undone) {
        removeDeleting(task.id)
        addTask(task)
        addToast({ message: 'Failed to delete task — restored' })
      }
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  const isDueSoon = task.dueDate && !isOverdue &&
    new Date(task.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) &&
    task.status !== 'DONE'

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
          isDragging ? 'shadow-lg ring-2 ring-primary' : ''
        }`}
        {...attributes}
        {...listeners}
        onClick={() => setShowDetail(true)}
      >
        <CardContent className="p-3 space-y-2">

          {/* Priority badge + delete button */}
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </div>
            {canEdit && (
              <button
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive text-base leading-none shrink-0"
                onPointerDown={e => e.stopPropagation()}
              >
                ×
              </button>
            )}
          </div>

          {/* Title */}
          <p className="text-sm font-medium leading-snug">{task.title}</p>

          {/* Description preview — strip markdown */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description.replace(/[#*`_~\[\]]/g, '').trim()}
            </p>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.slice(0, 3).map(label => (
                <span
                  key={label}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${getLabelColor(label)}`}
                >
                  {label}
                </span>
              ))}
              {task.labels.length > 3 && (
                <span className="px-1.5 py-0.5 rounded text-xs text-muted-foreground bg-secondary">
                  +{task.labels.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer: assignees + due date */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map(({ user }) => (
                  <div
                    key={user.id}
                    title={user.username}
                    className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border border-background overflow-hidden"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      user.username[0].toUpperCase()
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div />
            )}

            {task.dueDate && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                isOverdue
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : isDueSoon
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  : 'text-muted-foreground'
              }`}>
                {isOverdue
                  ? 'Overdue'
                  : isDueSoon
                  ? 'Due soon'
                  : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

        </CardContent>
      </Card>

      {showDetail && (
  <TaskDetailPanel
    task={task}
    projectId={projectId}
    socket={socket}
    members={members}
    onClose={() => setShowDetail(false)}
  />
)}
    </>
  )
}