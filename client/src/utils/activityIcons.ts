export const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'task:created': '✦',
    'task:updated': '✎',
    'task:deleted': '✕',
    'member:joined': '✚',
    'member:removed': '−',
    'comment:created': '◎',
  }
  return icons[type] || '•'
}

export const getActivityColor = (type: string): string => {
  const colors: Record<string, string> = {
    'task:created': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'task:updated': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'task:deleted': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    'member:joined': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    'member:removed': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    'comment:created': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }
  return colors[type] || 'bg-secondary text-muted-foreground'
}

export const formatRelativeTime = (date: string): string => {
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