import { useToastStore } from '../../store/toastStore'
import { Toast } from './Toast'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          onUndo={toast.onUndo} 
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}