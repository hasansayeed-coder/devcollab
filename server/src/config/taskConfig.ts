export const PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-400',
    border: 'border-slate-300 dark:border-slate-600',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-300 dark:border-blue-600',
  },
  HIGH: {
    label: 'High',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-300 dark:border-amber-600',
  },
  CRITICAL: {
    label: 'Critical',
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    dot: 'bg-red-500',
    border: 'border-red-300 dark:border-red-600',
  },
} as const

export const LABEL_COLORS = [
  { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', name: 'purple' },
  { bg: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300', name: 'pink' },
  { bg: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300', name: 'teal' },
  { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', name: 'orange' },
  { bg: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', name: 'green' },
  { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', name: 'indigo' },
  { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', name: 'yellow' },
  { bg: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', name: 'red' },
]

export const getLabelColor = (label: string) => {
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length].bg
}

export const PRESET_LABELS = [
  'bug', 'feature', 'docs', 'design', 'backend',
  'frontend', 'testing', 'devops', 'refactor', 'research',
]