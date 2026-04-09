import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { projectsApi, ProjectAnalytics } from '../../api/projects'

interface Props {
  projectId: string
  onClose: () => void
}

const STATUS_COLORS = {
  TODO: '#888780',
  IN_PROGRESS: '#378ADD',
  DONE: '#1D9E75',
}

export default function AnalyticsPanel({ projectId, onClose }: Props) {
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsApi.getAnalytics(projectId)
      .then(({ analytics }) => setAnalytics(analytics))
      .finally(() => setLoading(false))
  }, [projectId])

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-backdrop" />
      <div
    className="panel-content"
    style={{ maxWidth: '42rem' }}
    onClick={e => e.stopPropagation()}
  >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Project analytics</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-secondary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !analytics ? (
            <p className="text-muted-foreground text-center py-8">Failed to load analytics</p>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Total tasks"
                  value={analytics.totalTasks}
                  sub="across all columns"
                  color="text-foreground"
                />
                <StatCard
                  label="Completion rate"
                  value={`${analytics.completionRate}%`}
                  sub={`${analytics.statusCounts.DONE} tasks done`}
                  color="text-green-600 dark:text-green-400"
                />
                <StatCard
                  label="Overdue"
                  value={analytics.overdueTasks}
                  sub="past due date"
                  color={analytics.overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}
                />
                <StatCard
                  label="Due soon"
                  value={analytics.dueSoon}
                  sub="within 48 hours"
                  color={analytics.dueSoon > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}
                />
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Task breakdown</p>
                  <p className="text-xs text-muted-foreground">{analytics.totalTasks} total</p>
                </div>
                {analytics.totalTasks > 0 ? (
                  <>
                    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                      {analytics.statusCounts.TODO > 0 && (
                        <div
                          className="bg-slate-400 dark:bg-slate-600 transition-all"
                          style={{ width: `${(analytics.statusCounts.TODO / analytics.totalTasks) * 100}%` }}
                        />
                      )}
                      {analytics.statusCounts.IN_PROGRESS > 0 && (
                        <div
                          className="bg-blue-500 transition-all"
                          style={{ width: `${(analytics.statusCounts.IN_PROGRESS / analytics.totalTasks) * 100}%` }}
                        />
                      )}
                      {analytics.statusCounts.DONE > 0 && (
                        <div
                          className="bg-green-500 transition-all"
                          style={{ width: `${(analytics.statusCounts.DONE / analytics.totalTasks) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {Object.entries(analytics.statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {status === 'IN_PROGRESS' ? 'In progress' : status === 'TODO' ? 'To do' : 'Done'} ({count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                )}
              </div>

              {/* Timeline chart */}
              <div>
                <p className="text-sm font-medium mb-3">Activity — last 14 days</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.taskTimeline} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#378ADD" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        interval={3}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="created"
                        stroke="#378ADD"
                        strokeWidth={2}
                        fill="url(#colorCreated)"
                        name="Created"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#1D9E75"
                        strokeWidth={2}
                        fill="url(#colorCompleted)"
                        name="Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-blue-500" />
                    <span className="text-xs text-muted-foreground">Created</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-green-500" />
                    <span className="text-xs text-muted-foreground">Completed</span>
                  </div>
                </div>
              </div>

              {/* Status pie chart */}
              {analytics.totalTasks > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Status distribution</p>
                  <div className="flex items-center gap-6">
                    <div className="h-32 w-32 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'To do', value: analytics.statusCounts.TODO },
                              { name: 'In progress', value: analytics.statusCounts.IN_PROGRESS },
                              { name: 'Done', value: analytics.statusCounts.DONE },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell fill={STATUS_COLORS.TODO} />
                            <Cell fill={STATUS_COLORS.IN_PROGRESS} />
                            <Cell fill={STATUS_COLORS.DONE} />
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600" />
                        <span className="text-sm">To do</span>
                        <span className="text-sm font-medium ml-auto">{analytics.statusCounts.TODO}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm">In progress</span>
                        <span className="text-sm font-medium ml-auto">{analytics.statusCounts.IN_PROGRESS}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Done</span>
                        <span className="text-sm font-medium ml-auto">{analytics.statusCounts.DONE}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Member activity */}
              <div>
                <p className="text-sm font-medium mb-3">Member activity</p>
                <div className="space-y-3">
                  {analytics.memberActivity.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          member.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{member.username}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{member.role}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{member.assigned} assigned</span>
                          <span>{member.completed} done</span>
                          <span>{member.commented} comments</span>
                        </div>
                        {member.assigned > 0 && (
                          <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${(member.completed / member.assigned) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string
  value: string | number
  sub: string
  color: string
}) {
  return (
    <div className="bg-secondary rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  )
}