'use client'

import * as RadixToast from '@radix-ui/react-toast'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />,
  error: <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />,
  info: <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />,
}

const styles: Record<ToastType, string> = {
  success: 'border-green-100 bg-green-50',
  error: 'border-red-100 bg-red-50',
  info: 'border-blue-100 bg-blue-50',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, type, message }])
  }, [])

  function remove(id: string) {
    setToasts(t => t.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right" duration={3500}>
        {children}
        {toasts.map(t => (
          <RadixToast.Root
            key={t.id}
            open={true}
            onOpenChange={open => { if (!open) remove(t.id) }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm',
              'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2',
              'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
              styles[t.type]
            )}
          >
            {icons[t.type]}
            <RadixToast.Description className="flex-1 text-gray-800">
              {t.message}
            </RadixToast.Description>
            <RadixToast.Close onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100] outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
