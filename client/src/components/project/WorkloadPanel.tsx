import { useEffect, useState } from 'react'
import { MemberWorkload, projectsApi } from '../../api/projects'
import { PRIORITY_CONFIG } from '../../config/taskConfig'

interface Props {
  projectId: string
  onClose: () => void
}

const STATUS_CONFIG = {
  TODO: { label: 'To do', color: 'bg-slate-400 dark:bg-slate-500', text: 'text-slate-600 dark:text-slate-400' },
  IN_PROGRESS: { label: 'In progress', color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  DONE: { label: 'Done', color: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
}

export default function WorkloadPanel({ projectId, onClose }: Props) {
  const [workload, setWorkload] = useState<MemberWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    projectsApi.getWorkload(projectId)
      .then(({ workload }) => setWorkload(workload))
      .finally(() => setLoading(false))
  }, [projectId])

  const maxTotal = Math.max(...workload.map(m => m.total), 1)

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-backdrop" />
      <div
        className="panel-content"
        style={{ maxWidth: '32rem' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold">Member workload</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Task distribution across all members
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-secondary rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-secondary animate-pulse rounded w-32" />
                      <div className="h-2 bg-secondary animate-pulse rounded w-20" />
                    </div>
                  </div>
                  <div className="h-2 bg-secondary animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : workload.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No members found</p>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center gap-4 px-1">
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${val.color}`} />
                    <span className="text-xs text-muted-foreground">{val.label}</span>
                  </div>
                ))}
              </div>

              {/* Member cards */}
              {workload.map(member => {
                const isExpanded = expandedId === member.id
                const completionRate = member.total > 0
                  ? Math.round((member.done / member.total) * 100)
                  : 0

                return (
                  <div
                    key={member.id}
                    className="bg-secondary/40 rounded-xl border border-border overflow-hidden"
                  >
                    {/* Member header */}
                    <button
                      className="w-full flex items-center gap-3 p-4 hover:bg-secondary/60 transition-colors text-left"
                      onClick={() => setExpandedId(isExpanded ? null : member.id)}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center shrink-0 overflow-hidden">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          member.username[0].toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium truncate">{member.username}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{member.role}</span>
                        </div>

                        {/* Status counts */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {member.total} task{member.total !== 1 ? 's' : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            {member.todo > 0 && (
                              <span className={`text-xs font-medium ${STATUS_CONFIG.TODO.text}`}>
                                {member.todo} to do
                              </span>
                            )}
                            {member.inProgress > 0 && (
                              <span className={`text-xs font-medium ${STATUS_CONFIG.IN_PROGRESS.text}`}>
                                {member.inProgress} in progress
                              </span>
                            )}
                            {member.done > 0 && (
                              <span className={`text-xs font-medium ${STATUS_CONFIG.DONE.text}`}>
                                {member.done} done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Completion % + expand icon */}
                      <div className="flex items-center gap-2 shrink-0">
                        {member.total > 0 && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            completionRate === 100
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : completionRate > 50
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-secondary text-muted-foreground'
                          }`}>
                            {completionRate}%
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {/* Stacked progress bar */}
                    {member.total > 0 && (
                      <div className="px-4 pb-3">
                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                          {member.todo > 0 && (
                            <div
                              className={`${STATUS_CONFIG.TODO.color} transition-all`}
                              style={{ width: `${(member.todo / member.total) * 100}%` }}
                              title={`To do: ${member.todo}`}
                            />
                          )}
                          {member.inProgress > 0 && (
                            <div
                              className={`${STATUS_CONFIG.IN_PROGRESS.color} transition-all`}
                              style={{ width: `${(member.inProgress / member.total) * 100}%` }}
                              title={`In progress: ${member.inProgress}`}
                            />
                          )}
                          {member.done > 0 && (
                            <div
                              className={`${STATUS_CONFIG.DONE.color} transition-all`}
                              style={{ width: `${(member.done / member.total) * 100}%` }}
                              title={`Done: ${member.done}`}
                            />
                          )}
                        </div>

                        {/* Relative bar compared to most loaded member */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/30 rounded-full transition-all"
                              style={{ width: `${(member.total / maxTotal) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {member.total === maxTotal && member.total > 0 ? 'Most loaded' : `${member.total}/${maxTotal}`}
                          </span>
                        </div>
                      </div>
                    )}

                    {member.total === 0 && (
                      <p className="px-4 pb-3 text-xs text-muted-foreground">No tasks assigned</p>
                    )}

                    {/* Expanded task list */}
                    {isExpanded && member.tasks.length > 0 && (
                      <div className="border-t border-border">
                        <div className="px-4 py-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Assigned tasks
                          </p>
                          <div className="space-y-1.5">
                            {member.tasks.map(task => {
                              const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.MEDIUM
                              const statusConf = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]
                              const isOverdue = task.dueDate &&
                                new Date(task.dueDate) < new Date() &&
                                task.status !== 'DONE'

                              return (
                                <div
                                  key={task.id}
                                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors"
                                >
                                  {/* Status dot */}
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusConf?.color || 'bg-slate-400'}`} />

                                  {/* Title */}
                                  <p className="text-sm flex-1 truncate">{task.title}</p>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Priority */}
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priority.color}`}>
                                      {priority.label}
                                    </span>

                                    {/* Due date */}
                                    {task.dueDate && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                        isOverdue
                                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                          : 'text-muted-foreground'
                                      }`}>
                                        {isOverdue ? 'Overdue' : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Summary footer */}
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Project summary
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-500 dark:text-slate-400">
                      {workload.reduce((acc, m) => acc + m.todo, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">To do</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-500">
                      {workload.reduce((acc, m) => acc + m.inProgress, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">In progress</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-500">
                      {workload.reduce((acc, m) => acc + m.done, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}