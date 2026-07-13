import React from 'react';

export function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="h-48 skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 skeleton w-16 rounded-full" />
          <div className="h-6 skeleton w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCircle({ size = 'md' }) {
  const s = { sm: 'w-9 h-9', md: 'w-12 h-12', lg: 'w-16 h-16' };
  return <div className={`${s[size]} skeleton rounded-full`} />;
}
