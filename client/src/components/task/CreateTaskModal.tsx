import { useState } from 'react'
import { createPortal } from 'react-dom'
import { projectsApi, Member } from '../../api/projects'
import { useProjectStore } from '../../store/projectStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownEditor from '@/components/ui/MarkdownEditor'
import AssigneeSelector from './AssigneeSelector'
import { PRIORITY_CONFIG, PRESET_LABELS, getLabelColor } from '../../config/taskConfig'
import type { Priority } from '../../api/projects'

interface Props {
  projectId: string
  defaultStatus: string
  members?: Member[]
  onClose: () => void
}

export default function CreateTaskModal({ projectId, defaultStatus, members = [], onClose }: Props) {
  const { addTask } = useProjectStore()
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM' as Priority,
    labels: [] as string[],
    assigneeIds: [] as string[],
    customLabel: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleLabel = (label: string) => {
    setForm(f => ({
      ...f,
      labels: f.labels.includes(label)
        ? f.labels.filter(l => l !== label)
        : [...f.labels, label],
    }))
  }

  const addCustomLabel = () => {
    const label = form.customLabel.trim().toLowerCase()
    if (!label || form.labels.includes(label)) return
    setForm(f => ({ ...f, labels: [...f.labels, label], customLabel: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { task } = await projectsApi.createTask(projectId, {
        title: form.title,
        description: form.description || undefined,
        status: defaultStatus,
        priority: form.priority,
        labels: form.labels,
        dueDate: form.dueDate || undefined,
        assigneeIds: form.assigneeIds.length > 0 ? form.assigneeIds : undefined,
      })
      addTask(task)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '32rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '0.75rem',
          zIndex: 1,
        }}
        onClick={e => e.stopPropagation()}
      >
        <Card>
          <CardHeader>
            <CardTitle>Add task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Task title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.priority === p
                          ? `${PRIORITY_CONFIG[p].color} ${PRIORITY_CONFIG[p].border} border-2`
                          : 'bg-secondary text-muted-foreground border-transparent hover:border-border border'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignees */}
              {members.length > 0 && (
                <div className="space-y-2">
                  <Label>Assign to</Label>
                  <AssigneeSelector
                    members={members}
                    selectedIds={form.assigneeIds}
                    onChange={ids => setForm({ ...form, assigneeIds: ids })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Labels</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LABELS.map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleLabel(label)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        form.labels.includes(label)
                          ? getLabelColor(label)
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Custom label..."
                    value={form.customLabel}
                    onChange={e => setForm({ ...form, customLabel: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addCustomLabel() }
                    }}
                    className="text-sm h-8"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomLabel}>
                    Add
                  </Button>
                </div>
                {form.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.labels.map(l => (
                      <span
                        key={l}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getLabelColor(l)}`}
                      >
                        {l}
                        <button type="button" onClick={() => toggleLabel(l)} className="hover:opacity-70">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <MarkdownEditor
                  value={form.description}
                  onChange={v => setForm({ ...form, description: v })}
                />
              </div>

              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add task'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}