import { useEffect, useState, useRef } from 'react'
import { Task, Comment, Member, projectsApi } from '../../api/projects'
import { useAuthStore } from '../../store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PRIORITY_CONFIG, getLabelColor } from '../../config/taskConfig'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import AssigneeSelector from './AssigneeSelector'
import CommentItem from './CommentItem'

interface Props {
  task: Task
  projectId: string
  members?: Member[]
  onClose: () => void
  socket: any
}

export default function TaskDetailPanel({ task, projectId, members = [], onClose, socket }: Props) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    projectsApi.getComments(projectId, task.id)
      .then(({ comments }) => setComments(comments))
      .finally(() => setFetching(false))
  }, [task.id, projectId])

  useEffect(() => {
    if (!socket) return

    const onCommentCreated = ({ taskId, comment }: { taskId: string; comment: Comment }) => {
      if (taskId !== task.id) return
      if (comment.parentId) {
        // Add reply to parent
        setComments(prev => addReplyToTree(prev, comment.parentId!, comment))
      } else {
        // Top level comment — avoid duplicates
        setComments(prev =>
          prev.some(c => c.id === comment.id) ? prev : [...prev, comment]
        )
      }
    }

    const onCommentDeleted = ({ taskId, commentId }: { taskId: string; commentId: string }) => {
      if (taskId !== task.id) return
      setComments(prev => removeFromTree(prev, commentId))
    }

    socket.on('comment:created', onCommentCreated)
    socket.on('comment:deleted', onCommentDeleted)

    return () => {
      socket.off('comment:created', onCommentCreated)
      socket.off('comment:deleted', onCommentDeleted)
    }
  }, [socket, task.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const addReplyToTree = (comments: Comment[], parentId: string, reply: Comment): Comment[] => {
    return comments.map(c => {
      if (c.id === parentId) {
        const alreadyExists = c.replies?.some(r => r.id === reply.id)
        if (alreadyExists) return c
        return { ...c, replies: [...(c.replies || []), reply] }
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: addReplyToTree(c.replies, parentId, reply) }
      }
      return c
    })
  }

  const removeFromTree = (comments: Comment[], commentId: string): Comment[] => {
    return comments
      .filter(c => c.id !== commentId)
      .map(c => ({
        ...c,
        replies: c.replies ? removeFromTree(c.replies, commentId) : [],
      }))
  }

  const handleReplyAdded = (reply: Comment, parentId: string) => {
    setComments(prev => addReplyToTree(prev, parentId, reply))
  }

  const handleDeleted = (commentId: string, parentId?: string) => {
    setComments(prev => removeFromTree(prev, commentId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      const { comment } = await projectsApi.createComment(projectId, task.id, content.trim())
      setComments(prev =>
        prev.some(c => c.id === comment.id) ? prev : [...prev, { ...comment, replies: [] }]
      )
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  const totalComments = (comments: Comment[]): number => {
    return comments.reduce((acc, c) => acc + 1 + totalComments(c.replies || []), 0)
  }

  const statusColors = {
    TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    DONE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  const statusLabels = {
    TODO: 'To do',
    IN_PROGRESS: 'In progress',
    DONE: 'Done',
  }

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-backdrop" />
      <div
        className="panel-content"
        style={{ maxWidth: '32rem' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </span>
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CONFIG[task.priority]?.color || PRIORITY_CONFIG.MEDIUM.color}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[task.priority]?.dot || PRIORITY_CONFIG.MEDIUM.dot}`} />
                {PRIORITY_CONFIG[task.priority]?.label || 'Medium'}
              </span>
            </div>
            <h2 className="text-lg font-semibold">{task.title}</h2>
            {task.labels && task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.labels.map(label => (
                  <span key={label} className={`px-2 py-0.5 rounded text-xs font-medium ${getLabelColor(label)}`}>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none mt-1">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              <MarkdownRenderer content={task.description} />
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Due date</p>
              <p className="text-sm">
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Assignees */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Assignees</p>
            {members.length > 0 ? (
              <AssigneeSelector
                members={members}
                selectedIds={task.assignees.map(a => a.user.id)}
                onChange={async (ids) => {
                  try {
                    await projectsApi.updateTask(projectId, task.id, { assigneeIds: ids })
                  } catch {}
                }}
              />
            ) : (
              task.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map(({ user: assignee }) => (
                    <div key={assignee.id} className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center overflow-hidden">
                        {assignee.avatarUrl
                          ? <img src={assignee.avatarUrl} alt={assignee.username} className="w-full h-full object-cover" />
                          : assignee.username[0].toUpperCase()
                        }
                      </div>
                      <span className="text-sm">{assignee.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No assignees</p>
              )
            )}
          </div>

          <div className="border-t" />

          {/* Comments */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Comments {totalComments(comments) > 0 && `(${totalComments(comments)})`}
            </p>

            {fetching ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-secondary animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-secondary animate-pulse rounded w-24" />
                      <div className="h-3 bg-secondary animate-pulse rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    projectId={projectId}
                    taskId={task.id}
                    onReplyAdded={handleReplyAdded}
                    onDeleted={handleDeleted}
                    depth={0}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* New comment input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 overflow-hidden">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                : user?.username?.[0]?.toUpperCase()
              }
            </div>
            <Input
              placeholder="Write a comment..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
            />
            <Button type="submit" size="sm" disabled={loading || !content.trim()}>
              {loading ? '...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}