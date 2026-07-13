import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Zap, UserMinus, Trash2, X, Loader2, Crown, Phone, User, DollarSign, Shield, Target, Trophy, ExternalLink, Star } from 'lucide-react';
import { getAnnouncement, joinAnnouncement, leaveAnnouncement, kickPlayer, deleteAnnouncement } from '../services/matchService';
import { ToastFixed } from '../components/Toast';
import { ReputationBadgeInline } from '../components/ReputationBadge';
import { reputationService } from '../services/reputationService';
import ReviewModal from '../components/ReviewModal';

const levelLabels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
const typeLabels = { amical: 'Amical', competitif: 'Compétitif' };

const levelBadge = {
  debutant: 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/30',
  intermediaire: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  avance: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30',
};

const typeBadge = {
  amical: 'bg-primary/10 text-primary border-primary/30',
  competitif: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
};

const positions = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];

export default function AnnonceDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [joinForm, setJoinForm] = useState({ full_name: '', phone: '', position: '' });
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [repScores, setRepScores] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [reviewedPlayers, setReviewedPlayers] = useState(new Set());
  const [quickReviewLoading, setQuickReviewLoading] = useState(null);

  const isCaptain = user && announcement && user.id === announcement.user_id;
  const myPlayer = announcement?.accepted_players?.find(p => p.user_id === user?.id);
  const isPlayer = !!myPlayer;
  const spotsLeft = announcement ? announcement.players_needed - announcement.players_joined : 0;

  const fetchData = async () => {
    try {
      const data = await getAnnouncement(id, user?.id);
      setAnnouncement(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (!announcement) return;
    const loadRep = async () => {
      const ids = new Set();
      if (announcement.user_id) ids.add(announcement.user_id);
      if (announcement.accepted_players) {
        announcement.accepted_players.forEach(p => ids.add(p.user_id));
      }
      for (const uid of ids) {
        try {
          const data = await reputationService.getReputation(uid);
          if (data?.reputation) {
            setRepScores(prev => ({ ...prev, [uid]: data.reputation.score }));
          }
        } catch (e) {}
      }
    };
    loadRep();
  }, [announcement]);

  useEffect(() => {
    if (!announcement || !user) return;
    const loadReviewed = async () => {
      try {
        const data = await reputationService.getPendingReviews(user.id);
        const pending = data?.pending || [];
        const reviewedIds = new Set();
        pending.forEach(p => {
          if (p.announcement_id == announcement.id) {
            // These are PENDING (not yet reviewed)
          }
        });
        // Check which players on this announcement the user has already reviewed
        const allPlayers = [announcement.user_id, ...(announcement.accepted_players?.map(p => p.user_id) || [])];
        const uniqueIds = [...new Set(allPlayers)].filter(id => id !== user.id);
        
        for (const uid of uniqueIds) {
          try {
            const reviewsData = await reputationService.getReviews(uid);
            const reviews = reviewsData?.data || [];
            const hasReviewed = reviews.some(r => r.reviewer_id === user.id && r.announcement_id == announcement.id);
            if (hasReviewed) {
              reviewedIds.add(uid);
            }
          } catch (e) {}
        }
        setReviewedPlayers(reviewedIds);
      } catch (e) {}
    };
    loadReviewed();
  }, [announcement, user]);

  const handleReviewSubmit = async (form) => {
    if (!selectedPlayer || !user) return;
    await reputationService.submitReview({
      announcement_id: announcement.id,
      reviewer_id: user.id,
      reviewed_id: selectedPlayer.user_id,
      ...form,
    });
    setReviewedPlayers(prev => new Set([...prev, selectedPlayer.user_id]));
    try {
      const data = await reputationService.getReputation(selectedPlayer.user_id);
      if (data?.reputation) {
        setRepScores(prev => ({ ...prev, [selectedPlayer.user_id]: data.reputation.score }));
      }
    } catch (e) {}
  };

  const handleQuickReview = async (player, stars) => {
    if (!user || !announcement) return;
    setQuickReviewLoading(player.user_id);
    try {
      await reputationService.submitReview({
        announcement_id: announcement.id,
        reviewer_id: user.id,
        reviewed_id: player.user_id,
        attended: true,
        punctuality_rating: stars,
        paid: true,
        fair_play_rating: stars,
        communication_rating: stars,
        would_play_again: stars >= 4 ? 'definitely' : stars >= 2 ? 'maybe' : 'no',
        comment: '',
      });
      setReviewedPlayers(prev => new Set([...prev, player.user_id]));
      const data = await reputationService.getReputation(player.user_id);
      if (data?.reputation) {
        setRepScores(prev => ({ ...prev, [player.user_id]: data.reputation.score }));
      }
    } catch (e) {
      console.error(e);
    }
    setQuickReviewLoading(null);
  };

  const handleJoin = async () => {
    if (!user) return navigate('/login');
    setJoinForm({ full_name: user.name || user.username || '', phone: user.phone || '', position: '' });
    setShowJoinModal(true);
  };

  const handleConfirmJoin = async () => {
    if (!joinForm.full_name.trim() || !joinForm.phone.trim()) return;
    setJoinLoading(true);
    try {
      await joinAnnouncement(id, {
        user_id: user.id,
        full_name: joinForm.full_name.trim(),
        phone: joinForm.phone.trim(),
        position: joinForm.position || null,
      });
      setShowJoinModal(false);
      await fetchData();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async (playerId) => {
    if (!playerId) return;
    try {
      await leaveAnnouncement(id, { user_id: user.id, player_id: playerId });
      await fetchData();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleKick = async (playerId) => {
    if (!confirm('Retirer ce joueur ?')) return;
    try {
      await kickPlayer(id, { user_id: user.id, player_id: playerId });
      await fetchData();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette annonce ?')) return;
    setDeleteLoading(true);
    try {
      await deleteAnnouncement(id);
      navigate('/annonces');
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-light" size={40} />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-2xl p-12 text-center">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-3">Annonce non trouvée</h2>
          <Link to="/annonces" className="btn-primary gap-2 inline-flex">Retour aux annonces</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ToastFixed message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-light transition-colors mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Retour
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 glass-card rounded-2xl p-6 sm:p-8"
          >
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border ${levelBadge[announcement.level]}`}>
                <Target size={12} /> {levelLabels[announcement.level]}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border ${typeBadge[announcement.match_type]}`}>
                <Zap size={12} /> {typeLabels[announcement.match_type]}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white mb-4">{announcement.title}</h1>

            {announcement.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{announcement.description}</p>
            )}

            {/* Match Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-3 p-3.5 bg-light dark:bg-dark-800 rounded-xl border border-black/5 dark:border-white/8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-primary-light" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Date</p>
                  <p className="text-sm font-semibold text-dark-900 dark:text-white">
                    {new Date(announcement.match_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 bg-light dark:bg-dark-800 rounded-xl border border-black/5 dark:border-white/8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-primary-light" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Heure & Durée</p>
                  <p className="text-sm font-semibold text-dark-900 dark:text-white">{announcement.match_time} · {announcement.duration} min</p>
                </div>
              </div>
              {announcement.terrain && (
                <div className="flex items-center gap-3 p-3.5 bg-light dark:bg-dark-800 rounded-xl border border-black/5 dark:border-white/8">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-primary-light" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Terrain</p>
                    <p className="text-sm font-semibold text-dark-900 dark:text-white">{announcement.terrain.titre}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3.5 bg-light dark:bg-dark-800 rounded-xl border border-black/5 dark:border-white/8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users size={18} className="text-primary-light" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Places</p>
                  <p className="text-sm font-semibold text-dark-900 dark:text-white">
                    <span className="text-primary-light">{announcement.players_joined}</span>/{announcement.players_needed} joueurs
                  </p>
                </div>
              </div>
            </div>

            {/* Price */}
            {announcement.price_per_player > 0 && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
                <DollarSign className="text-gold" size={20} />
                <p className="text-primary-light font-bold text-lg">{announcement.price_per_player} DH</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">par joueur</p>
              </div>
            )}

            {/* Players List */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield size={16} className="text-primary-light" />
                </div>
                Joueurs inscrits
              </h3>
              {announcement.accepted_players && announcement.accepted_players.length > 0 ? (
                <div className="space-y-2.5">
                  {/* Captain */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-dark-900 font-bold text-sm shadow-md shrink-0">
                        {announcement.creator?.username?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-dark-900 dark:text-white flex items-center gap-1.5">
                          <span className="truncate">{announcement.creator?.username}</span>
                          <Crown size={14} className="text-gold shrink-0" />
                          {repScores[announcement.user_id] !== undefined && (
                            <ReputationBadgeInline score={repScores[announcement.user_id]} size="xs" />
                          )}
                        </p>
                        <p className="text-xs text-primary-light font-semibold">Capitaine</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {user && announcement.user_id !== user.id && (
                        <>
                          <Link to={`/profil/${announcement.user_id}`} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Voir le profil">
                            <ExternalLink size={14} />
                          </Link>
                          {announcement.status === 'closed' && !reviewedPlayers.has(announcement.user_id) && (
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(star => (
                                <button
                                  key={star}
                                  onClick={() => handleQuickReview({ user_id: announcement.user_id, full_name: announcement.creator?.username }, star)}
                                  disabled={quickReviewLoading === announcement.user_id}
                                  className="text-slate-600 dark:text-slate-500 hover:text-yellow-400 hover:scale-125 transition-all duration-150 disabled:opacity-50"
                                  title={`${star} étoile${star > 1 ? 's' : ''}`}
                                >
                                  <Star size={16} className={quickReviewLoading === announcement.user_id ? 'animate-pulse' : ''} />
                                </button>
                              ))}
                            </div>
                          )}
                          {reviewedPlayers.has(announcement.user_id) && (
                            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 flex items-center gap-0.5">
                              <Star size={9} className="fill-emerald-400" /> Noté
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Players */}
                  {announcement.accepted_players.map((p) => (
                    <div key={p.id} className="p-3.5 bg-light dark:bg-dark-800 rounded-xl border border-black/5 dark:border-white/8 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-dark-600 dark:bg-dark-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {p.full_name?.charAt(0)?.toUpperCase() || p.user?.username?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-dark-900 dark:text-white flex items-center gap-1.5">
                              <span className="truncate">{p.full_name || p.user?.username}</span>
                              {repScores[p.user_id] !== undefined && (
                                <ReputationBadgeInline score={repScores[p.user_id]} size="xs" />
                              )}
                            </p>
                            {p.position && (
                              <p className="text-xs text-primary-light font-medium flex items-center gap-1">
                                <Target size={10} /> {p.position}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {user && p.user_id !== user.id && (
                            <>
                              <Link to={`/profil/${p.user_id}`} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Voir le profil">
                                <ExternalLink size={14} />
                              </Link>

                              {/* 5 étoiles directes */}
                              {announcement.status === 'closed' && !reviewedPlayers.has(p.user_id) && (
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(star => (
                                    <button
                                      key={star}
                                      onClick={() => handleQuickReview(p, star)}
                                      disabled={quickReviewLoading === p.user_id}
                                      className="text-slate-600 dark:text-slate-500 hover:text-yellow-400 hover:scale-125 transition-all duration-150 disabled:opacity-50"
                                      title={`${star} étoile${star > 1 ? 's' : ''}`}
                                    >
                                      <Star size={16} className={quickReviewLoading === p.user_id ? 'animate-pulse' : ''} />
                                    </button>
                                  ))}
                                </div>
                              )}

                              {reviewedPlayers.has(p.user_id) && (
                                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 flex items-center gap-0.5">
                                  <Star size={9} className="fill-emerald-400" /> Noté
                                </span>
                              )}
                            </>
                          )}
                          {isCaptain && p.user_id !== user.id && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleKick(p.id)}
                              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <UserMinus size={14} />
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-light dark:bg-dark-800 rounded-xl text-center border border-black/5 dark:border-white/8">
                  Aucun joueur pour le moment.
                </p>
              )}
            </div>

            {/* Captain Actions */}
            {isCaptain && (
              <div className="flex flex-wrap gap-2 pt-5 border-t border-black/5 dark:border-white/8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowTeamModal(true)}
                  className="btn-secondary gap-2 !text-sm !px-4 !py-2.5"
                >
                  <Users size={16} /> Voir détails
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="btn-danger gap-2 !text-sm !px-4 !py-2.5"
                >
                  <Trash2 size={16} /> {deleteLoading ? '...' : 'Supprimer'}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-4"
          >
            {/* Join/Leave/Status Card */}
            <div className="glass-card rounded-2xl p-6 text-center">
              {isCaptain ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Crown className="text-dark-900" size={28} />
                  </div>
                  <p className="font-bold text-dark-900 dark:text-white text-lg">Vous êtes le capitaine</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez votre équipe</p>
                </>
              ) : isPlayer ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Trophy className="text-white" size={28} />
                  </div>
                  <p className="font-bold text-primary-light mb-3">Vous faites partie de cette équipe !</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLeave(myPlayer.id)}
                    className="w-full btn-danger gap-2"
                  >
                    <UserMinus size={16} /> Quitter l'équipe
                  </motion.button>
                </>
              ) : spotsLeft > 0 ? (
                <>
                  <div className="mb-3">
                    <span className="text-4xl font-extrabold text-primary-light">{spotsLeft}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      place{spotsLeft > 1 ? 's' : ''} disponible{spotsLeft > 1 ? 's' : ''}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleJoin}
                    disabled={joinLoading}
                    className="w-full btn-primary !py-3.5 !rounded-xl gap-2"
                  >
                    {joinLoading ? <Loader2 className="animate-spin" size={18} /> : <><Zap size={18} /> Rejoindre l'équipe</>}
                  </motion.button>
                  {!user && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      <Link to="/login" className="text-primary-light font-semibold hover:underline">Connectez-vous</Link> pour rejoindre
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-3">
                    <Users className="text-amber-500 dark:text-amber-400" size={28} />
                  </div>
                  <p className="font-bold text-amber-600 dark:text-amber-400">Équipe complète</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cette annonce n'a plus de places.</p>
                </>
              )}
            </div>

            {/* Captain Info */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Capitaine</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-dark-900 font-bold text-lg shadow-md">
                  {announcement.creator?.username?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-dark-900 dark:text-white flex items-center gap-1.5">
                    {announcement.creator?.username}
                    {repScores[announcement.user_id] !== undefined && (
                      <ReputationBadgeInline score={repScores[announcement.user_id]} size="xs" />
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{announcement.creator?.email}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Join Modal */}
        <AnimatePresence>
          {showJoinModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
                onClick={() => setShowJoinModal(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative glass-card rounded-2xl p-6 max-w-md w-full shadow-2xl"
              >
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-dark-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="text-white" size={24} />
                </div>

                <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-1">Rejoindre l'équipe</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Remplissez vos informations pour confirmer votre inscription.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Nom complet <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={joinForm.full_name}
                        onChange={(e) => setJoinForm({ ...joinForm, full_name: e.target.value })}
                        placeholder="Votre nom complet"
                        className="input-field !pl-10 !rounded-xl !text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Téléphone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={joinForm.phone}
                        onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                        placeholder="06XXXXXXXX"
                        className="input-field !pl-10 !rounded-xl !text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Poste préféré</label>
                    <select
                      value={joinForm.position}
                      onChange={(e) => setJoinForm({ ...joinForm, position: e.target.value })}
                      className="input-field !rounded-xl appearance-none cursor-pointer !text-sm"
                    >
                      <option value="">Pas de préférence</option>
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 btn-secondary !text-sm"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmJoin}
                    disabled={joinLoading || !joinForm.full_name.trim() || !joinForm.phone.trim()}
                    className="flex-1 btn-primary !text-sm"
                  >
                    {joinLoading ? <Loader2 className="animate-spin" size={18} /> : 'Confirmer'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Team Details Modal — Captain Only */}
        <AnimatePresence>
          {showTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
                onClick={() => setShowTeamModal(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative glass-card rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
              >
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-dark-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-4 shadow-lg">
                  <Users className="text-white" size={24} />
                </div>

                <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-1">Détails de l'équipe</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                  {announcement.accepted_players?.length || 0} joueur{announcement.accepted_players?.length > 1 ? 's' : ''} inscrit{announcement.accepted_players?.length > 1 ? 's' : ''}
                </p>

                <div className="space-y-4">
                  {/* Captain */}
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-dark-900 font-bold text-lg shadow-md">
                        {announcement.creator?.username?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-dark-900 dark:text-white flex items-center gap-1.5">
                          {announcement.creator?.username}
                          <Crown size={14} className="text-gold" />
                          {repScores[announcement.user_id] !== undefined && (
                            <ReputationBadgeInline score={repScores[announcement.user_id]} size="xs" />
                          )}
                        </p>
                        <p className="text-xs text-primary-light font-semibold">Capitaine</p>
                      </div>
                    </div>
                    <div className="ml-14 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                      {announcement.creator?.name && (
                        <p><span className="text-gray-400">Nom :</span> {announcement.creator.name}</p>
                      )}
                      {announcement.creator?.email && (
                        <p><span className="text-gray-400">Email :</span> {announcement.creator.email}</p>
                      )}
                      {announcement.creator?.phone && (
                        <p className="flex items-center gap-1"><span className="text-gray-400">Tél :</span> <Phone size={10} /> {announcement.creator.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Players */}
                  {announcement.accepted_players && announcement.accepted_players.length > 0 ? (
                    announcement.accepted_players.map((p) => (
                      <div key={p.id} className="p-4 bg-light dark:bg-dark-800 rounded-xl border border-black/5 dark:border-white/8 group/player">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-full bg-dark-600 dark:bg-dark-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                              {p.full_name?.charAt(0)?.toUpperCase() || p.user?.username?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-dark-900 dark:text-white flex items-center gap-1.5">
                                <span className="truncate">{p.full_name || 'Non renseigné'}</span>
                                {repScores[p.user_id] !== undefined && (
                                  <ReputationBadgeInline score={repScores[p.user_id]} size="xs" />
                                )}
                              </p>
                              {p.position && (
                                <p className="text-xs text-primary-light font-medium flex items-center gap-1">
                                  <Target size={10} /> {p.position}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {user && p.user_id !== user.id && (
                              <>
                                <Link to={`/profil/${p.user_id}`} onClick={() => setShowTeamModal(false)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Voir le profil">
                                  <ExternalLink size={13} />
                                </Link>
                                {announcement.status === 'closed' && !reviewedPlayers.has(p.user_id) && (
                                  <div className="flex items-center gap-0.5">
                                    {[1,2,3,4,5].map(star => (
                                      <button
                                        key={star}
                                        onClick={() => { handleQuickReview(p, star); setShowTeamModal(false); }}
                                        disabled={quickReviewLoading === p.user_id}
                                        className="text-slate-600 dark:text-slate-500 hover:text-yellow-400 hover:scale-125 transition-all duration-150"
                                        title={`${star} étoile${star > 1 ? 's' : ''}`}
                                      >
                                        <Star size={14} />
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {reviewedPlayers.has(p.user_id) && (
                                  <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10">Noté</span>
                                )}
                              </>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => { handleKick(p.id); setShowTeamModal(false); }}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover/player:opacity-100"
                            >
                              <UserMinus size={16} />
                            </motion.button>
                          </div>
                        </div>
                        <div className="ml-14 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                          {p.user?.username && <p><span className="text-gray-400">Compte :</span> @{p.user.username}</p>}
                          {p.user?.email && <p><span className="text-gray-400">Email :</span> {p.user.email}</p>}
                          {p.phone && (
                            <p className="flex items-center gap-1"><span className="text-gray-400">Tél :</span> <Phone size={10} /> {p.phone}</p>
                          )}
                          {p.user?.phone && p.user.phone !== p.phone && (
                            <p className="flex items-center gap-1"><span className="text-gray-400">Tél (compte) :</span> <Phone size={10} /> {p.user.phone}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 p-4 bg-light dark:bg-dark-800 rounded-xl border border-black/5 dark:border-white/8">
                      Aucun joueur inscrit pour le moment.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Review Modal */}
        {selectedPlayer && (
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => { setShowReviewModal(false); setSelectedPlayer(null); }}
            onSubmit={handleReviewSubmit}
            playerName={selectedPlayer.full_name || selectedPlayer.user?.username || 'Joueur'}
            matchTitle={announcement?.title || 'Match'}
          />
        )}

        <ToastFixed message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      </div>
    </div>
  );
}
