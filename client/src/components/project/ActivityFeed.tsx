import { useEffect, useState, useCallback } from 'react'
import { Activity, projectsApi } from '../../api/projects'
import { getActivityIcon, getActivityColor, formatRelativeTime } from '../../utils/activityIcons'
import { Button } from '@/components/ui/button'

interface Props {
  projectId: string
  socket: any
  onClose: () => void
}

export default function ActivityFeed({ projectId, socket, onClose }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchActivities = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const { activities: newActivities, total } = await projectsApi.getActivities(projectId, p)
      setTotal(total)
      setActivities(prev => append ? [...prev, ...newActivities] : newActivities)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchActivities(1)
  }, [fetchActivities])

  useEffect(() => {
    if (!socket) return

    const handler = (activity: Activity) => {
      setActivities(prev => [activity, ...prev])
      setTotal(t => t + 1)
    }

    socket.on('activity:created', handler)
    return () => { socket.off('activity:created', handler) }
  }, [socket])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchActivities(nextPage, true)
  }

  const hasMore = activities.length < total

  return (
    <div className="panel-overlay" onClick={onClose}>

    <div className="panel-backdrop" />
      <div
    className="panel-content"
    style={{ maxWidth: '28rem' }}
    onClick={e => e.stopPropagation()}
    >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold">Activity feed</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{total} events total</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-secondary animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-secondary animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-secondary animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-8">
              <span className="text-4xl">◎</span>
              <p className="text-sm">No activity yet</p>
              <p className="text-xs text-center">Actions like creating tasks and inviting members will appear here</p>
            </div>
          ) : (
            <div className="p-5">
              {/* Group by date */}
              {groupByDate(activities).map(({ date, items }) => (
                <div key={date} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground px-2">{date}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="space-y-4">
                    {items.map(activity => (
                      <div key={activity.id} className="flex gap-3">
                        {/* Avatar + icon */}
                        <div className="relative shrink-0">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center overflow-hidden">
                            {activity.user.avatarUrl ? (
                              <img
                                src={activity.user.avatarUrl}
                                alt={activity.user.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              activity.user.username[0].toUpperCase()
                            )}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user.username}</span>
                            {' '}
                            <span className="text-muted-foreground">{activity.message}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="pt-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function groupByDate(activities: Activity[]) {
  const groups: Record<string, Activity[]> = {}

  activities.forEach(activity => {
    const date = new Date(activity.createdAt)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    let label: string
    if (date.toDateString() === now.toDateString()) {
      label = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday'
    } else {
      label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }

    if (!groups[label]) groups[label] = []
    groups[label].push(activity)
  })

  return Object.entries(groups).map(([date, items]) => ({ date, items }))
}