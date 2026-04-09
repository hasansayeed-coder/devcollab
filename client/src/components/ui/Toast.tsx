import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  onUndo?: () => void
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, onUndo, onDismiss, duration = 5000 }: ToastProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p - (100 / (duration / 100))
        if (next <= 0) {
          clearInterval(interval)
          onDismiss()
          return 0
        }
        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, onDismiss])

  return (
    <div className="relative flex items-center gap-3 bg-foreground text-background px-4 py-3 rounded-lg shadow-lg min-w-72 max-w-sm overflow-hidden">
      <p className="text-sm flex-1">{message}</p>
      {onUndo && (
        <button
          onClick={() => { onUndo(); onDismiss() }}
          className="text-sm font-medium underline underline-offset-2 hover:opacity-80 shrink-0"
        >
          Undo
        </button>
      )}
      <button
        onClick={onDismiss}
        className="text-background/60 hover:text-background text-lg leading-none shrink-0"
      >
        ×
      </button>
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-background/30 transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}