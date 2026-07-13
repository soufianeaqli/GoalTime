import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40',
  secondary: 'bg-white/10 dark:bg-white/5 border border-primary/30 text-primary dark:text-primary-light hover:bg-primary/10',
  danger: 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20',
  ghost: 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5',
  gold: 'bg-gradient-to-r from-gold to-gold-light text-dark-900 shadow-lg shadow-gold/25 hover:shadow-xl hover:shadow-gold/40',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-2xl',
};

export default function Button({ children, variant = 'primary', size = 'md', loading, disabled, icon: Icon, className = '', ...props }) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : Icon ? <Icon size={16} /> : null}
      {children}
    </motion.button>
  );
}
