import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, CheckCircle } from 'lucide-react';
import ReputationBadge from '../components/ReputationBadge';
import ReviewCard from '../components/ReviewCard';
import { reputationService } from '../services/reputationService';

export default function PublicProfile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = storedUser?.id ? storedUser : null;

  const [pendingMatches, setPendingMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    setPendingMatches([]);
    setSelectedMatch(null);
    setAlreadyReviewed(false);
    setMyRating(0);
    setHoverRating(0);
    setData(null);
    setLoading(true);
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await reputationService.getReputation(userId);
      setData(result);

      if (currentUser && userId != currentUser.id) {
        const pendingResult = await reputationService.getPendingReviews(currentUser.id);
        const allPending = pendingResult?.pending || [];
        const myPending = allPending.filter(p => p.user_id == userId);
        setPendingMatches(myPending);
        if (myPending.length === 1) setSelectedMatch(myPending[0]);

        const reviewsData = await reputationService.getReviews(userId);
        const reviews = reviewsData?.data || [];
        if (reviews.some(r => r.reviewer_id == currentUser.id)) setAlreadyReviewed(true);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!myRating || !currentUser) return;
    setSubmitting(true);
    try {
      const payload = {
        reviewer_id: currentUser.id,
        reviewed_id: userId,
        attended: true,
        punctuality_rating: myRating,
        paid: true,
        fair_play_rating: myRating,
        communication_rating: myRating,
        would_play_again: myRating >= 4 ? 'definitely' : myRating >= 2 ? 'maybe' : 'no',
        comment: '',
      };
      if (selectedMatch?.announcement_id) payload.announcement_id = selectedMatch.announcement_id;
      if (selectedMatch?.tournament_id) payload.tournament_id = selectedMatch.tournament_id;
      await reputationService.submitReview(payload);
      setSubmitted(true);
      setAlreadyReviewed(true);
      const result = await reputationService.getReputation(userId);
      setData(result);
      setTimeout(() => { setSubmitted(false); setMyRating(0); }, 2000);
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!data || !data.reputation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Profil non trouvé.</p>
        <Link to="/annonces" className="text-emerald-400 hover:underline mt-2 inline-block">Retour aux annonces</Link>
      </div>
    );
  }

  const { user: profileUser, reputation: rep, recent_reviews } = data;
  const userName = profileUser?.name || profileUser?.username || 'Joueur';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to={-1} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={16} />
        Retour
      </Link>

      {/* User Info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-emerald-600/40 via-emerald-500/20 to-blue-600/40 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative z-10">
          <div className="flex items-end gap-4 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl border-4 border-dark-900/80">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-extrabold text-white drop-shadow-lg">{userName}</h1>
              <ReputationBadge score={rep.score} size="md" showTooltip={false} />
              <p className="text-xs text-emerald-400/80 mt-1 font-medium">{rep.level}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {rep.is_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                ✅ Vérifié
              </span>
            )}
            {rep.is_captain && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                👑 Capitaine
              </span>
            )}
          </div>

          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">👤</span>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Nom complet</p>
                <p className="text-sm text-white font-semibold">{userName}</p>
              </div>
            </div>
            {profileUser?.email && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <span className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-sm">✉️</span>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-white font-semibold">{profileUser.email}</p>
                </div>
              </div>
            )}
            {profileUser?.phone && (
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm">📞</span>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Téléphone</p>
                  <p className="text-sm text-white font-semibold">{profileUser.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 5-Star Rating */}
      {currentUser && userId != currentUser.id && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-5 mb-6 border border-yellow-500/20">
          {alreadyReviewed && !submitted ? (
            <div className="flex items-center justify-center gap-2 py-3">
              <CheckCircle size={18} className="text-emerald-400" />
              <p className="text-xs text-slate-400">Vous avez déjà donné votre avis.</p>
            </div>
          ) : submitted ? (
            <div className="text-center py-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-2" />
              </motion.div>
              <p className="text-sm font-bold text-white">Merci !</p>
              <p className="text-xs text-slate-400">Votre avis a été enregistré.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-white">Évaluer {userName}</h3>
              </div>

              {pendingMatches.length > 1 && !selectedMatch && (
                <div className="mb-3">
                  <span className="text-xs text-slate-400 mb-1 block">Choisir le match :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {pendingMatches.map((m, i) => (
                      <button
                        key={m.announcement_id || m.tournament_id || i}
                        onClick={() => setSelectedMatch(m)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-[11px] text-slate-300 hover:bg-white/10 transition-colors font-medium"
                      >
                        {m.announcement_title} · {m.match_date}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMatch && (
                <p className="text-[11px] text-slate-500 mb-2">
                  Match : <span className="text-slate-300 font-medium">{selectedMatch.announcement_title}</span> · {selectedMatch.match_date}
                </p>
              )}

              <div className="flex items-center justify-center gap-2 py-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setMyRating(star)}
                    className="transition-all duration-150 hover:scale-125 active:scale-95 cursor-pointer"
                  >
                    <Star
                      size={40}
                      className={
                        star <= (hoverRating || myRating)
                          ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                          : 'text-white/10 hover:text-yellow-400/50'
                      }
                    />
                  </button>
                ))}
              </div>

              {myRating > 0 && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-center text-xs font-bold mb-3">
                  <span className={myRating >= 4 ? 'text-yellow-400' : myRating >= 2 ? 'text-blue-400' : 'text-red-400'}>
                    {myRating === 5 && '⭐ Excellent !'}
                    {myRating === 4 && '👍 Très bien'}
                    {myRating === 3 && '🤔 Correct'}
                    {myRating === 2 && '😐 Moyen'}
                    {myRating === 1 && '👎 Mauvais'}
                  </span>
                </motion.p>
              )}

              <button
                onClick={handleSubmitRating}
                disabled={!myRating || submitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                        {submitting ? 'Envoi...' : 'Envoyer'}
                      </button>
            </>
          )}
        </motion.div>
      )}

      {!currentUser && (
        <div className="glass-card rounded-2xl p-4 text-center mb-6">
          <Link to="/login" className="text-xs text-yellow-400 hover:underline font-medium">
            Connectez-vous pour donner votre avis
          </Link>
        </div>
      )}

      {/* Reviews */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="text-sm font-bold text-white mb-3">
          Avis ({recent_reviews?.length || 0})
        </h3>
        {recent_reviews?.length > 0 ? (
          <div className="space-y-3">
            {recent_reviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center">
            <p className="text-sm text-slate-400">Aucun avis pour le moment.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
