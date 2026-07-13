import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Trophy, Zap, Clock, DollarSign, Heart, MessageCircle } from 'lucide-react';

const LEVELS = {
  'New Player': { badge: '🆕', color: 'from-slate-400 to-slate-500', textColor: 'text-slate-400', bgColor: 'bg-slate-500/10', border: 'border-slate-500/20' },
  'Elite Player': { badge: '🏆', color: 'from-yellow-400 to-amber-500', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  'Trusted Player': { badge: '⭐', color: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'Regular Player': { badge: '👍', color: 'from-blue-400 to-blue-600', textColor: 'text-blue-400', bgColor: 'bg-blue-500/10', border: 'border-blue-500/20' },
  'Needs Improvement': { badge: '⚠️', color: 'from-orange-400 to-orange-600', textColor: 'text-orange-400', bgColor: 'bg-orange-500/10', border: 'border-orange-500/20' },
  'Low Reputation': { badge: '🚫', color: 'from-red-400 to-red-600', textColor: 'text-red-400', bgColor: 'bg-red-500/10', border: 'border-red-500/20' },
};

function getLevel(score) {
  if (score === 0 || score === null || score === undefined) return 'New Player';
  if (score >= 95) return 'Elite Player';
  if (score >= 85) return 'Trusted Player';
  if (score >= 70) return 'Regular Player';
  if (score >= 50) return 'Needs Improvement';
  return 'Low Reputation';
}

function getStars(score) {
  const normalized = score / 20;
  const full = Math.floor(normalized);
  const half = normalized - full >= 0.5;
  return { full, half, empty: 5 - full - (half ? 1 : 0) };
}

export default function ReputationBadge({ score = 50, size = 'sm', showTooltip = true, className = '' }) {
  const [hovered, setHovered] = useState(false);
  const [reputation, setReputation] = useState(null);
  const level = getLevel(score);
  const levelData = LEVELS[level] || LEVELS['Regular Player'];
  const stars = getStars(score);

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className={`inline-flex items-center rounded-full font-bold ${sizes[size]} bg-gradient-to-r ${levelData.color} text-white shadow-lg cursor-default select-none transition-transform hover:scale-105`}
      >
        <span className="text-xs leading-none">{levelData.badge}</span>
        <span>{score}</span>
      </span>

      {showTooltip && (
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 glass-card rounded-2xl shadow-2xl z-50 overflow-hidden pointer-events-none"
            >
              <div className={`px-4 py-3 bg-gradient-to-r ${levelData.color} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{levelData.badge}</span>
                    <div>
                      <p className="font-extrabold text-lg leading-none">{score}/100</p>
                      <p className="text-xs opacity-80">{level}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < stars.full ? 'fill-white text-white' : (i === stars.full && stars.half ? 'fill-white/50 text-white' : 'text-white/30')} />
                    ))}
                  </div>
                </div>
              </div>

              {reputation && (
                <div className="px-4 py-3 space-y-2.5">
                  <StatRow icon={Shield} label="Participation" value={`${reputation.attendance_rate}%`} color="text-emerald-400" pct={reputation.attendance_rate} />
                  <StatRow icon={DollarSign} label="Paiement" value={`${reputation.payment_rate}%`} color="text-blue-400" pct={reputation.payment_rate} />
                  <StatRow icon={Clock} label="Ponctualité" value={`${reputation.punctuality_rate}%`} color="text-amber-400" pct={reputation.punctuality_rate} />
                  <StatRow icon={Heart} label="Fair Play" value={`${reputation.fair_play_rating}/5`} color="text-purple-400" pct={(reputation.fair_play_rating / 5) * 100} />
                  <StatRow icon={MessageCircle} label="Communication" value={`${reputation.communication_rating}/5`} color="text-cyan-400" pct={(reputation.communication_rating / 5) * 100} />
                  <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-slate-400">
                    <span>{reputation.total_matches} matchs</span>
                    <span>{reputation.total_reviews} avis</span>
                  </div>
                </div>
              )}

              {!reputation && (
                <div className="px-4 py-3 text-xs text-slate-400 text-center">
                  Chargement des détails...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color, pct }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className={color} />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-slate-400">{label}</span>
          <span className="text-white font-medium">{value}</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${color.replace('text-', 'from-')} to-transparent transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export function ReputationBadgeInline({ score, size = 'xs' }) {
  const level = getLevel(score);
  const levelData = LEVELS[level] || LEVELS['Regular Player'];

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0',
    sm: 'text-xs px-2 py-0.5',
  };

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full font-bold ${sizes[size]} bg-gradient-to-r ${levelData.color} text-white`}>
      <span className="text-[9px] leading-none">{levelData.badge}</span>
      <span>{score}</span>
    </span>
  );
}

export { LEVELS, getLevel, getStars };
