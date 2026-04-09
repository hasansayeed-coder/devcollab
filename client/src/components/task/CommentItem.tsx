import { useState } from 'react'
import { Comment, projectsApi } from '../../api/projects'
import { useAuthStore } from '../../store/authStore'

interface Props {
  comment: Comment
  projectId: string
  taskId: string
  onReplyAdded: (reply: Comment, parentId: string) => void
  onDeleted: (commentId: string, parentId?: string) => void
  depth?: number
}

function formatTime(date: string) {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CommentItem({
  comment,
  projectId,
  taskId,
  onReplyAdded,
  onDeleted,
  depth = 0,
}: Props) {
  const { user } = useAuthStore()
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const isOwn = comment.user.id === user?.id
  const hasReplies = comment.replies && comment.replies.length > 0
  const maxDepth = 3

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return
    setSubmitting(true)
    try {
      const { comment: newReply } = await projectsApi.createComment(
        projectId,
        taskId,
        replyContent.trim(),
        comment.id
      )
      onReplyAdded(newReply, comment.id)
      setReplyContent('')
      setShowReplyBox(false)
      setShowReplies(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return
    await projectsApi.deleteComment(projectId, taskId, comment.id)
    onDeleted(comment.id, comment.parentId)
  }

  return (
    <div className={`flex gap-2.5 ${depth > 0 ? 'mt-2' : ''}`}>
      {/* Thread line for replies */}
      {depth > 0 && (
        <div className="w-px bg-border ml-3 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        {/* Avatar */}
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 overflow-hidden">
            {comment.user.avatarUrl ? (
              <img src={comment.user.avatarUrl} alt={comment.user.username} className="w-full h-full object-cover" />
            ) : (
              comment.user.username[0].toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Comment bubble */}
            <div className="bg-secondary/50 rounded-xl rounded-tl-sm px-3 py-2 group relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{comment.user.username}</span>
                <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
                {isOwn && (
                  <button
                    onClick={handleDelete}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-1 ml-1">
              {depth < maxDepth && (
                <button
                  onClick={() => setShowReplyBox(r => !r)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {showReplyBox ? 'Cancel' : 'Reply'}
                </button>
              )}
              {hasReplies && (
                <button
                  onClick={() => setShowReplies(s => !s)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showReplies
                    ? `Hide ${comment.replies!.length} ${comment.replies!.length === 1 ? 'reply' : 'replies'}`
                    : `Show ${comment.replies!.length} ${comment.replies!.length === 1 ? 'reply' : 'replies'}`}
                </button>
              )}
            </div>

            {/* Reply input */}
            {showReplyBox && (
              <form onSubmit={handleReply} className="mt-2 flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user.username}...`}
                    className="flex-1 text-sm bg-secondary/50 border border-border rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleReply(e as any)
                      }
                      if (e.key === 'Escape') setShowReplyBox(false)
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !replyContent.trim()}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {submitting ? '...' : 'Reply'}
                  </button>
                </div>
              </form>
            )}

            {/* Nested replies */}
            {showReplies && hasReplies && (
              <div className="mt-2 ml-2 space-y-2 border-l-2 border-border pl-3">
                {comment.replies!.map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    projectId={projectId}
                    taskId={taskId}
                    onReplyAdded={onReplyAdded}
                    onDeleted={onDeleted}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}