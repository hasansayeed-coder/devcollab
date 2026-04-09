import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '../../api/axios'
import { useToastStore } from '../../store/toastStore'

interface Props {
  projectId: string
  projectName: string
}

export default function ExportButton({ projectId, projectName }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<'json' | 'csv' | null>(null)
  const { addToast } = useToastStore()

  const handleExport = async (format: 'json' | 'csv') => {
    setLoading(format)
    try {
      const response = await api.get(`/projects/${projectId}/export`, {
        params: { format },
        responseType: 'blob',
      })

      const contentType = format === 'csv' ? 'text/csv' : 'application/json'
      const blob = new Blob([response.data], { type: contentType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName.replace(/\s+/g, '_')}_export.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addToast({ message: `Exported as ${format.toUpperCase()} successfully` })
      setOpen(false)
    } catch {
      addToast({ message: `Failed to export as ${format.toUpperCase()}` })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(o => !o)}
      >
        Export
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 bg-background border rounded-lg shadow-lg overflow-hidden w-44">
            <div className="p-2 border-b">
              <p className="text-xs font-medium text-muted-foreground px-2">Export as</p>
            </div>

            <div className="p-1">
              <button
                onClick={() => handleExport('json')}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                  JS
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">JSON</p>
                  <p className="text-xs text-muted-foreground">Full data</p>
                </div>
                {loading === 'json' && (
                  <span className="ml-auto text-xs text-muted-foreground">...</span>
                )}
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-md bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center text-xs font-bold shrink-0">
                  CSV
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">CSV</p>
                  <p className="text-xs text-muted-foreground">Spreadsheet</p>
                </div>
                {loading === 'csv' && (
                  <span className="ml-auto text-xs text-muted-foreground">...</span>
                )}
              </button>
            </div>

            <div className="p-3 border-t bg-secondary/30">
              <p className="text-xs text-muted-foreground">
                Includes all tasks, comments, members and metadata
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}