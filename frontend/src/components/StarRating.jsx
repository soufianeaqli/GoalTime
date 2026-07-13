import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, size = 18, readonly = false, label }) {
  const [hovered, setHovered] = React.useState(0);

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium text-slate-400">{label}</span>}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              size={size}
              className={
                star <= (hovered || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-white/10'
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}
