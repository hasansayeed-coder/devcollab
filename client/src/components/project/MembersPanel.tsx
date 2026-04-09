import { useState } from 'react'
import { Project, Member, projectsApi } from '../../api/projects'
import { useAuthStore } from '../../store/authStore'
import { useProjectStore } from '../../store/projectStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  project: Project
  onClose: () => void
}

type Role = 'OWNER' | 'CONTRIBUTOR' | 'VIEWER'

const ROLE_CONFIG = {
  OWNER: {
    label: 'Owner',
    description: 'Full access, can manage members',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  CONTRIBUTOR: {
    label: 'Contributor',
    description: 'Can create and edit tasks',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  VIEWER: {
    label: 'Viewer',
    description: 'Read-only access',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
}

export default function MembersPanel({ project, onClose }: Props) {
  const { user } = useAuthStore()
  const { setCurrentProject } = useProjectStore()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'CONTRIBUTOR' | 'VIEWER'>('CONTRIBUTOR')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const myMember = project.members.find(m => m.user.id === user?.id)
  const isOwner = myMember?.role === 'OWNER'

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviting(true)
    try {
      await projectsApi.inviteMember(project.id, {
        email: inviteEmail,
        role: inviteRole,
      })
      setInviteSuccess(`${inviteEmail} has been added to the project`)
      setInviteEmail('')
      const { project: updated } = await projectsApi.getOne(project.id)
      setCurrentProject(updated)
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (member: Member, newRole: Role) => {
    if (newRole === member.role) return
    setUpdatingId(member.user.id)
    try {
      await projectsApi.updateMemberRole(project.id, member.user.id, newRole)
      const { project: updated } = await projectsApi.getOne(project.id)
      setCurrentProject(updated)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemove = async (member: Member) => {
    if (!confirm(`Remove ${member.user.username} from this project?`)) return
    setUpdatingId(member.user.id)
    try {
      await projectsApi.removeMember(project.id, member.user.id)
      const { project: updated } = await projectsApi.getOne(project.id)
      setCurrentProject(updated)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member')
    } finally {
      setUpdatingId(null)
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
            <h2 className="text-lg font-semibold">Members</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.members.length} member{project.members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Invite form — owners only */}
          {isOwner && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-3">Invite member</p>
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email address</Label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <div className="flex gap-2">
                    {(['CONTRIBUTOR', 'VIEWER'] as const).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          inviteRole === role
                            ? `${ROLE_CONFIG[role].color} border-current`
                            : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                        }`}
                      >
                        {ROLE_CONFIG[role].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_CONFIG[inviteRole].description}
                  </p>
                </div>

                {inviteError && (
                  <p className="text-xs text-destructive">{inviteError}</p>
                )}
                {inviteSuccess && (
                  <p className="text-xs text-green-600 dark:text-green-400">{inviteSuccess}</p>
                )}

                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={inviting}
                >
                  {inviting ? 'Adding...' : 'Add member'}
                </Button>
              </form>
            </div>
          )}

          {/* Member list */}
          <div>
            <p className="text-sm font-medium mb-3">Current members</p>
            <div className="space-y-3">
              {project.members.map(member => {
                const isMe = member.user.id === user?.id
                const isLoading = updatingId === member.user.id

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border bg-background transition-opacity ${
                      isLoading ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {member.user.avatarUrl ? (
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        member.user.username[0].toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{member.user.username}</p>
                        {isMe && (
                          <span className="text-xs text-muted-foreground">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.user.email}
                      </p>
                    </div>

                    {/* Role selector — owners can change others' roles */}
                    {isOwner && !isMe ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member, e.target.value as Role)}
                          disabled={isLoading}
                          className="text-xs bg-secondary text-foreground border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {(Object.keys(ROLE_CONFIG) as Role[]).map(role => (
                            <option key={role} value={role}>
                              {ROLE_CONFIG[role].label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemove(member)}
                          disabled={isLoading}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors px-1"
                          title="Remove member"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${ROLE_CONFIG[member.role].color}`}>
                        {ROLE_CONFIG[member.role].label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Role legend */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Role permissions
            </p>
            <div className="space-y-2">
              {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config]) => (
                <div key={role} className="flex items-start gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${config.color}`}>
                    {config.label}
                  </span>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}