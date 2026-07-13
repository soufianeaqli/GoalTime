import React from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, Minus, Clock, Calendar, MessageCircle } from 'lucide-react';

const REVIEW_ICONS = [
  { img: '/logo.jpg', bg: 'bg-emerald-500/10' },
  { emoji: '🔥', bg: 'bg-orange-500/10' },
  { emoji: '🎯', bg: 'bg-blue-500/10' },
  { emoji: '💪', bg: 'bg-purple-500/10' },
];

function getRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffWeeks < 4) return `Il y a ${diffWeeks}sem`;
  return `Il y a ${diffMonths}mois`;
}

export default function ReviewCard({ review, index = 0 }) {
  const reviewerName = review.reviewer?.name || review.reviewer?.username || 'Joueur';
  const iconData = REVIEW_ICONS[index % REVIEW_ICONS.length];
  const avgRating = ((review.punctuality_rating + review.fair_play_rating + review.communication_rating) / 3).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-xl p-4 hover:bg-white/[0.03] transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconData.bg} flex items-center justify-center shrink-0 overflow-hidden`}>
          {iconData.img ? <img src={iconData.img} alt="" className="w-5 h-5 rounded-sm object-cover" /> : <span className="text-sm">{iconData.emoji}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-white truncate">{reviewerName}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={10} className={s <= Math.round(parseFloat(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-white/10'} />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
              <Clock size={9} />
              {getRelativeTime(review.created_at)}
            </span>
          </div>

          {review.match_date && (
            <div className="flex items-center gap-1 mt-0.5 mb-1.5">
              <Calendar size={10} className="text-slate-500" />
              <span className="text-[10px] text-slate-500">{review.match_date}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <MiniStat icon={review.attended ? ThumbsUp : ThumbsDown} label="Présence" positive={review.attended} />
            <MiniStat icon={review.paid ? ThumbsUp : ThumbsDown} label="Paiement" positive={review.paid} />
            <MiniStat
              icon={review.would_play_again === 'definitely' ? ThumbsUp : review.would_play_again === 'no' ? ThumbsDown : Minus}
              label="Rejouer"
              positive={review.would_play_again === 'definitely'}
              neutral={review.would_play_again === 'maybe'}
            />
          </div>

          {review.comment && (
            <div className="mt-2 flex items-start gap-1.5 bg-white/[0.03] rounded-lg px-3 py-2">
              <MessageCircle size={11} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">{review.comment}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MiniStat({ icon: Icon, label, positive, neutral = false }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium
      ${positive ? 'bg-emerald-500/10 text-emerald-400' : neutral ? 'bg-white/5 text-slate-400' : 'bg-red-500/10 text-red-400'}`}>
      <Icon size={9} />
      {label}
    </span>
  );
}
