'use client'

import { useUIStore } from '@/stores/ui'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl glass border border-[var(--color-border)] shadow-2xl pointer-events-auto"
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-[var(--color-success)] shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[var(--color-error)] shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[var(--color-primary)] shrink-0" />}
            <p className="text-sm text-[var(--color-text)] flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
