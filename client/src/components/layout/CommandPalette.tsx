import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../store/projectStore'
import { useAuthStore } from '../../store/authStore'
import { projectsApi } from '../../api/projects'

interface Command {
  id: string
  label: string
  description?: string
  icon: string
  action: () => void
  group: string
}

interface Props {
  onClose: () => void
}

export default function CommandPalette({ onClose }: Props) {
  const navigate = useNavigate()
  const { projects, setProjects } = useProjectStore()
  const { logout } = useAuthStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (projects.length === 0) {
      projectsApi.getAll().then(({ projects }) => setProjects(projects))
    }
  }, [])

  useEffect(() => {
    setSelected(0)
  }, [query])

  const staticCommands: Command[] = [
    {
      id: 'go-dashboard',
      label: 'Go to Dashboard',
      icon: '⌂',
      group: 'Navigation',
      action: () => { navigate('/dashboard'); onClose() },
    },
    {
      id: 'go-profile',
      label: 'Go to Profile',
      icon: '◎',
      group: 'Navigation',
      action: () => { navigate('/profile'); onClose() },
    },
    {
      id: 'theme-light',
      label: 'Switch to Light mode',
      icon: '○',
      group: 'Appearance',
      action: () => {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme-preference', JSON.stringify({ state: { theme: 'light' }, version: 0 }))
        onClose()
      },
    },
    {
      id: 'theme-dark',
      label: 'Switch to Dark mode',
      icon: '●',
      group: 'Appearance',
      action: () => {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme-preference', JSON.stringify({ state: { theme: 'dark' }, version: 0 }))
        onClose()
      },
    },
    {
      id: 'logout',
      label: 'Sign out',
      icon: '→',
      group: 'Account',
      action: () => { logout(); navigate('/login'); onClose() },
    },
  ]

  const projectCommands: Command[] = projects.map(p => ({
    id: `project-${p.id}`,
    label: p.name,
    description: p.description || p.tags.join(', '),
    icon: '▣',
    group: 'Projects',
    action: () => { navigate(`/projects/${p.id}`); onClose() },
  }))

  const allCommands = [...staticCommands, ...projectCommands]

  const filtered = query.trim() === ''
    ? allCommands
    : allCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
        cmd.group.toLowerCase().includes(query.toLowerCase())
      )

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  const flatFiltered = Object.values(grouped).flat()

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, flatFiltered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flatFiltered[selected]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [flatFiltered, selected, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl bg-background border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <span className="text-muted-foreground text-sm">⌕</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, projects, pages..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {flatFiltered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([group, commands]) => {
              let globalIndex = 0
              for (const g of Object.keys(grouped)) {
                if (g === group) break
                globalIndex += grouped[g].length
              }

              return (
                <div key={group}>
                  <div className="px-3 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {group}
                    </span>
                  </div>
                  {commands.map((cmd, i) => {
                    const idx = globalIndex + i
                    const isSelected = idx === selected
                    return (
                      <button
                        key={cmd.id}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary text-foreground'
                        }`}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelected(idx)}
                      >
                        <span className={`text-base w-5 text-center ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                          {cmd.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cmd.label}</p>
                          {cmd.description && (
                            <p className={`text-xs truncate ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        <kbd className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30'
                            : 'bg-secondary text-muted-foreground border-border'
                        }`}>
                          ↵
                        </kbd>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <kbd className="bg-secondary px-1.5 py-0.5 rounded border text-xs">↑↓</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <kbd className="bg-secondary px-1.5 py-0.5 rounded border text-xs">↵</kbd>
            <span>select</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <kbd className="bg-secondary px-1.5 py-0.5 rounded border text-xs">ESC</kbd>
            <span>close</span>
          </div>
        </div>
      </div>
    </div>
  )
}