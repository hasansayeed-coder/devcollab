import { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write a description... (supports **markdown**)',
  minHeight = '120px',
}: Props) {
  const [preview, setPreview] = useState(false)

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center gap-1 border-b bg-secondary/50 px-2 py-1">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            !preview
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            preview
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Preview
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Markdown supported</span>
        </div>
      </div>

      {preview ? (
        <div
          className="p-3 bg-background"
          style={{ minHeight }}
        >
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-3 text-sm bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none font-mono"
        />
      )}
    </div>
  )
}