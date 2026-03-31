import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-3 right-3 z-[10000] flex flex-col gap-2 max-w-[90vw] sm:max-w-[360px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            className={`ornate-card rounded-lg p-3 relative ${
              toast.type === 'achievement' ? 'border-gold/30' :
              toast.type === 'success' ? 'border-xp/20' : 'border-danger/20'
            }`}
          >
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-2 right-2 text-muted hover:text-primary"
            >
              <X size={12} />
            </button>

            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                toast.type === 'achievement' ? 'bg-gold/10 text-gold' :
                toast.type === 'success' ? 'bg-xp/10 text-xp' : 'bg-danger/10 text-danger'
              }`}>
                <Trophy size={16} />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                {toast.type === 'achievement' && (
                  <div className="text-[8px] font-display font-bold uppercase tracking-[0.15em] text-gold mb-0.5">
                    Achievement Unlocked!
                  </div>
                )}
                <div className="font-semibold text-xs text-primary">{toast.title}</div>
                {toast.message && (
                  <div className="text-[10px] text-secondary mt-0.5">{toast.message}</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
