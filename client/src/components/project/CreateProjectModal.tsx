import { useState } from 'react'
import { projectsApi } from '../../api/projects'
import { useProjectStore } from '../../store/projectStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'; 

interface Props {
  onClose: () => void
}

export default function CreateProjectModal({ onClose }: Props) {
  const addProject = useProjectStore((s) => s.addProject)
  const [form, setForm] = useState({ name: '', description: '', tags: '', isPublic: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { project } = await projectsApi.create({
        name: form.name,
        description: form.description || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        isPublic: form.isPublic,
      })
      addProject(project)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card 
    className="w-full max-w-md bg-background/80 backdrop-blur-md border border-white/20 shadow-2xl" 
    onClick={(e) => e.stopPropagation()}
  >
    <CardHeader className="relative">
      <CardTitle>Create new project</CardTitle>
      {/* Optional: Add a close button inside the modal */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Project name</Label>
          <Input
            placeholder="My awesome project"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            placeholder="What are you building?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Tags (comma separated)</Label>
          <Input
            placeholder="react, typescript, api"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={form.isPublic}
            onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
          />
          <Label htmlFor="isPublic">Make project public</Label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create project'}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
    </div>
  )
}