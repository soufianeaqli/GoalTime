import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
};

const colors = {
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
    iconBg: 'bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    icon: 'text-red-500',
    iconBg: 'bg-red-500/20',
    text: 'text-red-600 dark:text-red-400',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    iconBg: 'bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
};

export default function Toast({ message, type = 'success', onClose, className = '' }) {
  if (!message) return null;
  const Icon = icons[type] || icons.success;
  const c = colors[type] || colors.success;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`glass-card border-l-4 ${c.border} ${c.bg} flex items-center gap-3 px-5 py-4 ${className}`}
        >
          <div className={`w-8 h-8 rounded-full ${c.iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={18} className={c.icon} />
          </div>
          <span className={`text-sm font-medium ${c.text} flex-1`}>{message}</span>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0">
              <X size={16} className={c.icon} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ToastFixed({ message, type = 'success', onClose }) {
  if (!message) return null;
  const Icon = icons[type] || icons.success;
  const c = colors[type] || colors.success;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-6 left-1/2 z-[60]"
        >
          <div className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 px-6 py-4 shadow-2xl flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${c.iconBg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={c.icon} />
            </div>
            <span className={`text-sm font-medium ${c.text} flex-1`}>{message}</span>
            {onClose && (
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0">
                <X size={16} className={c.icon} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
