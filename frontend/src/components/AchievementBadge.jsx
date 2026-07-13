import React from 'react';
import { motion } from 'framer-motion';

export default function AchievementBadge({ icon, title, color = 'text-yellow-500', unlocked = true, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-base',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={`relative flex flex-col items-center gap-1`}
    >
      <div
        className={`${sizes[size]} rounded-2xl flex items-center justify-center
          ${unlocked
            ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-lg'
            : 'bg-white/5 border border-white/5 opacity-30 grayscale'
          }
          transition-all duration-300`}
      >
        <span className={unlocked ? color : 'text-slate-500'}>{icon}</span>
      </div>
      <span className={`text-[10px] font-medium text-center leading-tight ${unlocked ? 'text-slate-300' : 'text-slate-600'}`}>
        {title}
      </span>
      {unlocked && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-900" />
      )}
    </motion.div>
  );
}

export function AchievementRow({ achievements }) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="flex gap-3 flex-wrap">
      {achievements.map((ach, i) => (
        <AchievementBadge
          key={ach.id || i}
          icon={ach.icon}
          title={ach.title}
          color={ach.color}
          unlocked={true}
          size="sm"
        />
      ))}
    </div>
  );
}
