import { useEffect, useState } from 'react'
import { Commit, projectsApi } from '../../api/projects'
import { useProjectStore } from '../../store/projectStore'
import { useToastStore } from '../../store/toastStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      dangerouslySetInnerHTML={{
        __html: '<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>'
      }}
    />
  )
}

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  projectId: string
  githubRepo?: string
  isOwner: boolean
  onClose: () => void
}

export default function GitHubPanel({ projectId, githubRepo, isOwner, onClose }: Props) {
  const { setCurrentProject } = useProjectStore()
  const { addToast } = useToastStore()
  const [commits, setCommits] = useState<Commit[]>([])
  const [repo, setRepo] = useState(githubRepo || '')
  const [repoInput, setRepoInput] = useState(githubRepo || '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchCommits = async (repoName: string) => {
    if (!repoName) return
    setLoading(true)
    setError('')
    try {
      const { commits } = await projectsApi.getCommits(projectId)
      setCommits(commits)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch commits')
      setCommits([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (githubRepo) fetchCommits(githubRepo)
  }, [githubRepo])

  const handleSaveRepo = async () => {
    const trimmed = repoInput.trim()
    setSaving(true)
    try {
      await projectsApi.linkRepo(projectId, trimmed || null)
      setRepo(trimmed)
      const { project } = await projectsApi.getOne(projectId)
      setCurrentProject(project)
      addToast({ message: trimmed ? `Linked to ${trimmed}` : 'GitHub repo unlinked' })
      if (trimmed) fetchCommits(trimmed)
      else setCommits([])
    } catch (err: any) {
      addToast({ message: err.response?.data?.message || 'Failed to save repo' })
    } finally {
      setSaving(false)
    }
  }

  const openGitHub = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

  return (
    <div className="panel-overlay" onClick={onClose}>

      <div className="panel-backdrop" />
      <div
    className="panel-content"
    style={{ maxWidth: '28rem' }}
    onClick={e => e.stopPropagation()}
  >
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <GitHubIcon />
            <div>
              <h2 className="text-lg font-semibold">GitHub</h2>
              {repo && <p className="text-xs text-muted-foreground">{repo}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isOwner && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Link repository</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Repository (owner/repo)</Label>
                <Input
                  placeholder="e.g. facebook/react"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  className="h-8 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Only public repositories are supported without a token
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveRepo}
                  disabled={saving || repoInput === repo}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : repo ? 'Update repo' : 'Link repo'}
                </Button>
                {repo && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setRepoInput(''); handleSaveRepo() }}
                    disabled={saving}
                  >
                    Unlink
                  </Button>
                )}
              </div>
            </div>
          )}

          {repo ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Recent commits</p>
                <button
                  onClick={() => fetchCommits(repo)}
                  disabled={loading}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-secondary animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-secondary animate-pulse rounded w-full" />
                        <div className="h-3 bg-secondary animate-pulse rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
                  <p className="font-medium mb-1">Could not load commits</p>
                  <p className="text-xs">{error}</p>
                </div>
              ) : commits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No commits found</p>
              ) : (
                <div className="space-y-3">
                  {commits.map(commit => (
                    <div key={commit.sha} className="flex gap-3 group">
                      <div className="w-7 h-7 rounded-full bg-secondary text-muted-foreground text-xs flex items-center justify-center shrink-0 overflow-hidden border">
                        {commit.authorAvatar ? (
                          <img src={commit.authorAvatar} alt={commit.author} className="w-full h-full object-cover" />
                        ) : (
                          commit.author[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => openGitHub(commit.url)}
                          className="text-sm font-medium hover:text-primary transition-colors line-clamp-2 text-left w-full"
                        >
                          {commit.message}
                        </button>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                            {commit.sha}
                          </code>
                          <span className="text-xs text-muted-foreground">{commit.author}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatRelative(commit.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {commits.length > 0 && (
                <div className="pt-4 border-t mt-4">
                  <button
                    onClick={() => openGitHub(`https://github.com/${repo}/commits`)}
                    className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    <GitHubIcon />
                    View all commits on GitHub
                  </button>
                </div>
              )}
            </div>
          ) : (
            !isOwner && (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                <GitHubIcon size={32} />
                <p className="text-sm">No GitHub repository linked</p>
                <p className="text-xs text-center">Ask the project owner to link a repository</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}