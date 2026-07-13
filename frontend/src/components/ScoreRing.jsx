import React from 'react';

const LEVELS = {
  'New Player': { badge: '🆕', color: 'from-slate-400 to-slate-500', textColor: 'text-slate-400', bgColor: 'bg-slate-500/10', ringColor: 'stroke-slate-400' },
  'Elite Player': { badge: '🏆', color: 'from-yellow-400 to-amber-500', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/10', ringColor: 'stroke-yellow-400' },
  'Trusted Player': { badge: '⭐', color: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10', ringColor: 'stroke-emerald-400' },
  'Regular Player': { badge: '👍', color: 'from-blue-400 to-blue-600', textColor: 'text-blue-400', bgColor: 'bg-blue-500/10', ringColor: 'stroke-blue-400' },
  'Needs Improvement': { badge: '⚠️', color: 'from-orange-400 to-orange-600', textColor: 'text-orange-400', bgColor: 'bg-orange-500/10', ringColor: 'stroke-orange-400' },
  'Low Reputation': { badge: '🚫', color: 'from-red-400 to-red-600', textColor: 'text-red-400', bgColor: 'bg-red-500/10', ringColor: 'stroke-red-400' },
};

export default function ScoreRing({ score, size = 80, level, showLabel = true }) {
  const levelData = LEVELS[level] || LEVELS['Regular Player'];
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-white/5 dark:text-white/10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${levelData.ringColor} transition-all duration-1000 ease-out`}
            style={{ strokeDashoffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-white leading-none">{score}</span>
          <span className="text-[9px] text-slate-400 font-medium">/100</span>
        </div>
      </div>
      {showLabel && (
        <span className={`text-[11px] font-bold ${levelData.textColor}`}>{levelData.badge} {level}</span>
      )}
    </div>
  );
}

export function ScoreRingSmall({ score, size = 36 }) {
  const level = getLevelForScore(score);
  const levelData = LEVELS[level] || LEVELS['Regular Player'];
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/5 dark:text-white/10" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={levelData.ringColor} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

function getLevelForScore(score) {
  if (score === 0 || score === null || score === undefined) return 'New Player';
  if (score >= 95) return 'Elite Player';
  if (score >= 85) return 'Trusted Player';
  if (score >= 70) return 'Regular Player';
  if (score >= 50) return 'Needs Improvement';
  return 'Low Reputation';
}

export { LEVELS, getLevelForScore };
