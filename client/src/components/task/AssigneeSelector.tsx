import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Member } from '../../api/projects'

interface Props {
  members: Member[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function AssigneeSelector({ members, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const toggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId))
    } else {
      onChange([...selectedIds, userId])
    }
  }

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    const handleScroll = () => setOpen(false)
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [open])

  const selectedMembers = members.filter(m => selectedIds.includes(m.user.id))

  const dropdown = open ? createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 19999 }}
        onClick={() => setOpen(false)}
      />
      <div
        style={{
          position: 'fixed',
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          zIndex: 20000,
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '0.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-4 text-center">
              No members to assign
            </p>
          ) : (
            members.map(member => {
              const isSelected = selectedIds.includes(member.user.id)
              return (
                <button
                  key={member.user.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(member.user.id) }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'hsl(var(--secondary))' : 'transparent',
                    border: 'none',
                    color: 'hsl(var(--foreground))',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(var(--secondary))'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {member.user.avatarUrl ? (
                      <img src={member.user.avatarUrl} alt={member.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      member.user.username[0].toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.user.username}
                    </p>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                      {member.role}
                    </p>
                  </div>
                  {isSelected && (
                    <span style={{ color: 'hsl(var(--primary))', fontSize: '16px', flexShrink: 0 }}>✓</span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {selectedIds.length > 0 && (
          <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '8px 12px' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange([]); setOpen(false) }}
              style={{
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Clear assignees
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  ) : null

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-secondary transition-colors text-sm text-left"
      >
        {selectedMembers.length === 0 ? (
          <span className="text-muted-foreground">Assign to...</span>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex -space-x-1.5">
              {selectedMembers.slice(0, 4).map(m => (
                <div
                  key={m.user.id}
                  title={m.user.username}
                  className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border-2 border-background overflow-hidden shrink-0"
                >
                  {m.user.avatarUrl ? (
                    <img src={m.user.avatarUrl} alt={m.user.username} className="w-full h-full object-cover" />
                  ) : (
                    m.user.username[0].toUpperCase()
                  )}
                </div>
              ))}
            </div>
            <span className="text-sm truncate">
              {selectedMembers.length === 1
                ? selectedMembers[0].user.username
                : `${selectedMembers.length} assignees`}
            </span>
          </div>
        )}
        <span className="text-muted-foreground ml-auto text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {dropdown}
    </div>
  )
}