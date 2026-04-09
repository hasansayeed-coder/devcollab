import { useState } from 'react'
import { Project, projectsApi } from '../../api/projects'
import { useProjectStore } from '../../store/projectStore'
import { useToastStore } from '../../store/toastStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  project: Project
  onClose: () => void
}

export default function ProjectSettings({ project, onClose }: Props) {
  const { setCurrentProject } = useProjectStore()
  const { addToast } = useToastStore()
  const [form, setForm] = useState({
  name: project.name,
  description: project.description || '',
  tags: project.tags.join(', '),
  isPublic: project.isPublic ?? true,
})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  try {
    const { project: updated } = await projectsApi.update(project.id, {
      name: form.name,
      description: form.description || undefined,
      tags: form.tags
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      isPublic: form.isPublic,
    })

    // Merge updated fields with existing project data
    setCurrentProject({
      ...project,
      name: updated.name,
      description: updated.description,
      tags: updated.tags,
      isPublic: updated.isPublic,
    })

    addToast({ message: 'Project settings saved' })
    onClose()
  } catch (err: any) {
    addToast({ message: err.response?.data?.message || 'Failed to save settings' })
  } finally {
    setLoading(false)
  }
}

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
            <h2 className="text-lg font-semibold">Project settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only owners can edit these settings
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-2">
              <Label>Project name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="My awesome project"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What are you building?"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder="react, typescript, api"
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>

            {/* Visibility toggle */}
            <div className="space-y-3">
              <Label>Visibility</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isPublic: true })}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-lg border-2 transition-all text-left ${
                    form.isPublic
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/80 bg-background'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      form.isPublic ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {form.isPublic && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium">Public</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Anyone can view this project
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, isPublic: false })}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-lg border-2 transition-all text-left ${
                    !form.isPublic
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/80 bg-background'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      !form.isPublic ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {!form.isPublic && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium">Private</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Only members can view
                  </p>
                </button>
              </div>
            </div>

            {/* Current status indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
              form.isPublic
                ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <span>{form.isPublic ? '◉' : '◎'}</span>
              <span>
                {form.isPublic
                  ? 'This project is visible to everyone'
                  : 'This project is only visible to members'}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}