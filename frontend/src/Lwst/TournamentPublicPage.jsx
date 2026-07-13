import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { smartTournamentService } from '../services/smartTournamentService';
import Toast from '../components/Toast';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const iv = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(iv);
  }, [targetDate]);

  const pad = (n) => String(n).padStart(2, '0');
  const units = [
    { label: 'Jours', value: timeLeft.days },
    { label: 'Heures', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Secondes', value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-3 justify-center mt-4">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-2xl sm:text-3xl font-bold text-emerald-400">
            {pad(u.value)}
          </div>
          <span className="text-xs text-gray-400 mt-1">{u.label}</span>
        </div>
      ))}
    </div>
  );
};

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  registering: { label: 'Inscriptions ouvertes', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  locked: { label: 'Verrouillé', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  in_progress: { label: 'En cours', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  finished: { label: 'Terminé', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'teams', label: 'Équipes' },
  { id: 'groups', label: 'Groupes' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'standings', label: 'Classement' },
];

export default function TournamentPublicPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRegModal, setShowRegModal] = useState(false);
  const [regData, setRegData] = useState({ teamName: '', captainName: '', captainPhone: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [editingTournamentId, setEditingTournamentId] = useState(null);

  const loadTournament = useCallback(async () => {
    if (id) {
      try {
        const data = await smartTournamentService.get(id);
        setTournament(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const data = await smartTournamentService.list();
        setTournaments(Array.isArray(data) ? data : data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => { loadTournament(); }, [loadTournament]);

  useEffect(() => {
    if (tournament && (tournament.status === 'finished' || tournament.status === 'completed')) {
      setActiveTab('standings');
    }
  }, [tournament?.status]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegSubmitting(true);
    try {
      await smartTournamentService.registerTeam(id, {
        team_name: regData.teamName,
        captain_name: regData.captainName,
        captain_phone: regData.captainPhone,
        captain_id: user?.id,
      });
      setShowRegModal(false);
      setRegData({ teamName: '', captainName: '', captainPhone: '' });
      loadTournament();
    } catch (e) {
      console.error(e);
    } finally {
      setRegSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const openEdit = () => {
    setEditData({
      name: tournament.name || '',
      description: tournament.description || '',
      city: tournament.city || '',
      location: tournament.location || '',
      pitch_name: tournament.pitch_name || '',
      format: tournament.format || 'group_knockout',
      num_teams: tournament.num_teams || 16,
      start_date: tournament.start_date ? tournament.start_date.slice(0, 10) : '',
      end_date: tournament.end_date ? tournament.end_date.slice(0, 10) : '',
      status: tournament.status || 'draft',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      await smartTournamentService.update(id, editData);
      setToast({ message: 'Tournoi mis à jour', type: 'success' });
      setShowEditModal(false);
      loadTournament();
    } catch (e) {
      setToast({ message: e.message || 'Erreur', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (tid) => {
    try {
      await smartTournamentService.delete(tid || id);
      setToast({ message: 'Tournoi supprimé', type: 'success' });
      if (id) {
        setTimeout(() => navigate('/tournoi-smart'), 800);
      } else {
        loadTournament();
      }
    } catch (e) {
      setToast({ message: e.message || 'Erreur', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // LIST MODE (no id)
  if (!id) {
    return (
      <div className="min-h-screen text-white">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1">🏆 Tournois</h1>
              <p className="text-gray-400 text-sm">Découvrez et participez aux tournois</p>
            </div>
            {isAdmin && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/tournoi-smart/creer')} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all">
                + Créer un tournoi
              </motion.button>
            )}
          </div>

          {tournaments.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg shadow-black/30 mb-4">
                  <img src="/logo.jpg" alt="GoalTime" className="w-full h-full object-cover" />
                </div>
                <p className="text-gray-400 text-lg">Aucun tournoi pour le moment</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tournaments.map((t) => {
                const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.draft;
                return (
                  <motion.div key={t.id} whileHover={{ scale: 1.02, y: -4 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300" onClick={() => navigate(`/tournoi-smart/${t.id}`)}>
                    <div className="h-2 bg-gradient-to-r from-emerald-500 via-yellow-500 to-emerald-500" />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-white truncate flex-1">{t.name}</h3>
                        <span className={`shrink-0 ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-gray-400 text-xs mb-3 line-clamp-2">{t.description || 'Pas de description'}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                        {t.city && <span>📍 {t.city}</span>}
                        {t.format && <span>🎯 {t.format}</span>}
                        {t.num_teams && <span>👥 {t.num_teams} équipes max</span>}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(ev) => { ev.stopPropagation(); setEditData({ name: t.name, description: t.description || '', city: t.city || '', location: t.location || '', pitch_name: t.pitch_name || '', format: t.format || 'group_knockout', num_teams: t.num_teams || 16, start_date: t.start_date ? t.start_date.slice(0, 10) : '', end_date: t.end_date ? t.end_date.slice(0, 10) : '', status: t.status || 'draft' }); setEditingTournamentId(t.id); setShowEditModal(true); }} className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-semibold transition-all">✏️ Modifier</button>
                          <button onClick={(ev) => { ev.stopPropagation(); if (confirm('Supprimer ce tournoi ?')) handleDelete(t.id); }} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-all">🗑️ Supprimer</button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {showEditModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">✏️ Modifier le tournoi</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Nom</label>
                    <input type="text" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                    <textarea rows={3} value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Ville</label>
                      <input type="text" value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Lieu</label>
                      <input type="text" value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Terrain</label>
                      <input type="text" value={editData.pitch_name || ''} onChange={(e) => setEditData({ ...editData, pitch_name: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Format</label>
                      <select value={editData.format || 'group_knockout'} onChange={(e) => setEditData({ ...editData, format: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all">
                        <option value="group_knockout">Groupes + Knockout</option>
                        <option value="knockout">Élimination directe</option>
                        <option value="round_robin">Tournoi rotatif</option>
                        <option value="league">Ligue</option>
                        <option value="friendly">Amical</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Max équipes</label>
                      <input type="number" min={2} value={editData.num_teams || ''} onChange={(e) => setEditData({ ...editData, num_teams: parseInt(e.target.value) })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Statut</label>
                      <select value={editData.status || 'draft'} onChange={(e) => setEditData({ ...editData, status: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all">
                        <option value="draft">Brouillon</option>
                        <option value="registering">Inscriptions ouvertes</option>
                        <option value="locked">Verrouillé</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminé</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Date début</label>
                      <input type="date" value={editData.start_date || ''} onChange={(e) => setEditData({ ...editData, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Date fin</label>
                      <input type="date" value={editData.end_date || ''} onChange={(e) => setEditData({ ...editData, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm font-medium hover:bg-white/10 transition-all">Annuler</button>
                    <button onClick={async () => { setEditSaving(true); try { await smartTournamentService.update(editingTournamentId, editData); setToast({ message: 'Tournoi mis à jour', type: 'success' }); setShowEditModal(false); loadTournament(); } catch (e) { setToast({ message: e.message || 'Erreur', type: 'error' }); } finally { setEditSaving(false); } }} disabled={editSaving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50">
                      {editSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">
        Tournoi introuvable.
      </div>
    );
  }

  const status = STATUS_CONFIG[tournament.status] || STATUS_CONFIG.draft;
  const teams = tournament.teams || [];
  const groups = tournament.groups || [];
  const isKnockout = tournament.format === 'knockout';
  const isFinished = tournament.status === 'finished' || tournament.status === 'completed';
  const matches = tournament.matches || [];
  const standings = tournament.standings || [];

  const completedMatches = matches.filter((m) => m.status === 'completed' || m.status === 'finished' || m.winner).length;
  const totalGoals = matches.reduce((acc, m) => acc + (m.homeScore || 0) + (m.awayScore || 0), 0);

  const knockoutRanking = (() => {
    if (!isKnockout || teams.length === 0) return [];
    const finishedMatches = matches.filter((m) => m.status === 'finished' || m.status === 'completed');
    const eliminationRound = {};
    const matchCounts = {};
    const goalsFor = {};
    const goalsAgainst = {};

    finishedMatches.forEach((m) => {
      const loserId = m.winner_team_id == m.home_team_id ? m.away_team_id : m.home_team_id;
      if (loserId) eliminationRound[loserId] = m.round_number || 1;
      [m.home_team_id, m.away_team_id].forEach((tid) => {
        if (!tid) return;
        matchCounts[tid] = (matchCounts[tid] || 0) + 1;
        goalsFor[tid] = (goalsFor[tid] || 0) + (tid === m.home_team_id ? (m.home_score || 0) : (m.away_score || 0));
        goalsAgainst[tid] = (goalsAgainst[tid] || 0) + (tid === m.home_team_id ? (m.away_score || 0) : (m.home_score || 0));
      });
    });

    return teams.map((t) => ({
      id: t.id,
      team_name: t.team_name || t.name,
      is_eliminated: t.is_eliminated,
      is_champion: tournament.champion_team_id === t.id,
      eliminated_in_round: eliminationRound[t.id] || null,
      matches_played: matchCounts[t.id] || 0,
      goals_for: goalsFor[t.id] || 0,
      goals_against: goalsAgainst[t.id] || 0,
    })).sort((a, b) => {
      if (a.is_champion) return -1;
      if (b.is_champion) return 1;
      if (a.is_eliminated && b.is_eliminated) return (b.eliminated_in_round || 0) - (a.eliminated_in_round || 0);
      if (!a.is_eliminated && b.is_eliminated) return -1;
      if (a.is_eliminated && !b.is_eliminated) return 1;
      return 0;
    });
  })();

  const glassCard = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl';
  const glassCardHover = `${glassCard} hover:bg-white/10 transition-all duration-300`;

  const groupedMatches = matches.reduce((acc, m) => {
    const key = m.round || m.match_date || 'Autre';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 via-yellow-500/10 to-emerald-600/30" />

        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="mb-4">
              {tournament.logo ? (
                <img src={tournament.logo} alt="" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl object-cover border-2 border-emerald-500/30" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                  <img src="/logo.jpg" alt="GoalTime" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-400 bg-clip-text text-transparent mb-3">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3 text-gray-300 text-sm sm:text-base mb-4">
              {tournament.city && <span className="flex items-center gap-1">📍 {tournament.city}</span>}
              {tournament.pitch && <span className="flex items-center gap-1"><img src="/logo.jpg" alt="" className="w-4 h-4 rounded-sm object-cover" /> {tournament.pitch}</span>}
            </div>

            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${status.color}`}>
              {status.label}
            </span>

            {tournament.status === 'registering' && tournament.start_date && (
              <div className="mt-6">
                <p className="text-gray-400 text-sm mb-2">Début dans</p>
                <CountdownTimer targetDate={tournament.start_date} />
              </div>
            )}

            {tournament.status === 'registering' && (() => {
              if (!user) {
                return (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/login')} className="mt-8 px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300">
                    🔒 Connectez-vous pour vous inscrire
                  </motion.button>
                );
              }
              const isRegistered = teams.some((t) => t.captain_id === user?.id);
              return isRegistered ? (
                <div className="mt-8 flex items-center gap-2 px-8 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl">
                  <span>✅</span> Déjà inscrit
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRegModal(true)}
                  className="mt-8 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300"
                >
                  S'inscrire
                </motion.button>
              );
            })()}

            {isAdmin && (
              <div className="flex gap-3 justify-center mt-6">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openEdit} className="px-5 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-xl text-sm font-semibold transition-all">
                  ✏️ Modifier
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-all">
                  🗑️ Supprimer
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/tournoi-smart/${id}/admin`)} className="px-5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-all">
                  ⚙️ Gérer
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white/5 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-2 min-w-max">
            {TABS.filter((tab) => {
              if (isKnockout && tab.id === 'groups') return false;
              if (isFinished && tab.id !== 'standings' && tab.id !== 'overview') return false;
              return true;
            }).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>

            {/* Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {tournament.description && (
                  <div className={`${glassCard} p-6`}>
                    <h2 className="text-xl font-bold text-emerald-400 mb-3">Description</h2>
                    <p className="text-gray-300 leading-relaxed">{tournament.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: '👥', label: 'Équipes', value: `${teams.length} / ${tournament.num_teams || '—'}` },
                    { icon: null, iconImg: '/logo.jpg', label: 'Matchs', value: `${completedMatches} / ${matches.length}` },
                    { icon: '🎯', label: 'Format', value: tournament.format || '—' },
                    { icon: '📅', label: 'Dates', value: tournament.start_date ? `${new Date(tournament.start_date).toLocaleDateString('fr-FR')} — ${tournament.end_date ? new Date(tournament.end_date).toLocaleDateString('fr-FR') : '—'}` : '—' },
                  ].map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${glassCardHover} p-5 text-center`}>
                      <div className="text-3xl mb-2 flex items-center justify-center">{card.iconImg ? <img src={card.iconImg} alt="" className="w-8 h-8 rounded-lg object-cover" /> : card.icon}</div>
                      <div className="text-xs text-gray-400 mb-1">{card.label}</div>
                      <div className="text-lg font-bold text-white">{card.value}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Matchs joués', value: completedMatches, color: 'text-emerald-400' },
                    { label: 'Buts marqués', value: totalGoals, color: 'text-yellow-400' },
                    { label: 'Équipes inscrites', value: teams.length, color: 'text-blue-400' },
                  ].map((s, i) => (
                    <div key={i} className={`${glassCard} p-4 text-center`}>
                      <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Équipes */}
            {activeTab === 'teams' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.length === 0 && <p className="text-gray-400 col-span-full text-center py-10">Aucune équipe inscrite.</p>}
                {teams.map((t, i) => (
                  <motion.div key={t.id || i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={`${glassCardHover} p-5 ${t.is_eliminated ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-yellow-500/30 flex items-center justify-center text-xl font-bold text-white shrink-0">
                        {(t.team_name || t.name || '?').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white truncate">{t.team_name || t.name || 'Équipe'}</h3>
                          {t.is_eliminated && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Éliminée</span>}
                        </div>
                        <p className="text-xs text-gray-400">Capitaine : {t.captain_name || t.captain || '—'}</p>
                        {t.captain_phone && <p className="text-xs text-gray-500">📞 {t.captain_phone}</p>}
                        {t.group && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{t.group}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Groupes */}
            {activeTab === 'groups' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.length === 0 && <p className="text-gray-400 col-span-full text-center py-10">Aucun groupe défini.</p>}
                {groups.map((g, i) => (
                  <motion.div key={g.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${glassCard} p-6`}>
                    <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm">G</span>
                      {g.name || `Groupe ${i + 1}`}
                    </h3>
                    <div className="space-y-2">
                      {(g.teams || []).map((t, j) => (
                        <div key={j} className={`flex items-center justify-between px-3 py-2 rounded-lg ${j % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
                          <span className="text-sm text-white">{t.team_name || t.name || t}</span>
                          {t.seed && <span className="text-xs text-gray-500">Tête {t.seed}</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Calendrier */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                {Object.keys(groupedMatches).length === 0 && <p className="text-gray-400 text-center py-10">Aucun match programmé.</p>}
                {Object.entries(groupedMatches).map(([round, roundMatches], i) => (
                  <div key={round}>
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">{round}</h3>
                    <div className="space-y-2">
                      {roundMatches.map((m, j) => (
                        <motion.div key={m.id || j} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: j * 0.05 }} className={`${glassCardHover} p-4 flex flex-col sm:flex-row items-center justify-between gap-3`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className={`text-sm font-semibold truncate ${m.winner?.id === m.homeTeam?.id ? 'text-emerald-400' : 'text-white'}`}>
                              {m.homeTeam?.team_name || m.homeTeam?.name || 'TBD'}
                            </span>
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">VS</span>
                            <span className={`text-sm font-semibold truncate ${m.winner?.id === m.awayTeam?.id ? 'text-emerald-400' : 'text-white'}`}>
                              {m.awayTeam?.team_name || m.awayTeam?.name || 'TBD'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {(m.homeScore != null && m.awayScore != null) && (
                              <span className="text-lg font-extrabold text-yellow-400">{m.homeScore} — {m.awayScore}</span>
                            )}
                            {m.match_date && <span className="text-xs text-gray-500">{new Date(m.match_date).toLocaleDateString('fr-FR')}</span>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Classement */}
            {activeTab === 'standings' && (
              <div className="space-y-6">
                {isKnockout && knockoutRanking.length > 0 ? (
                  <div className={`${glassCard} overflow-hidden`}>
                    <div className="px-6 py-4 border-b border-white/10">
                      <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                        🏆 Classement final — Élimination directe
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 text-xs uppercase tracking-wider">
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Équipe</th>
                            <th className="px-4 py-3 text-center">MJ</th>
                            <th className="px-4 py-3 text-center">BP</th>
                            <th className="px-4 py-3 text-center">BC</th>
                            <th className="px-4 py-3 text-center">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {knockoutRanking.map((row, ri) => (
                            <tr key={row.id} className={`border-t border-white/5 ${ri === 0 ? 'bg-gold/5' : 'hover:bg-white/5'} transition-colors`}>
                              <td className="px-4 py-3">
                                <span className={`font-bold ${ri === 0 ? 'text-gold' : ri === 1 ? 'text-gray-300' : ri === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                                  {ri + 1}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-white">
                                <span className="flex items-center gap-2">
                                  {row.team_name}
                                  {row.is_champion && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">Champion</span>}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-300">{row.matches_played}</td>
                              <td className="px-4 py-3 text-center text-gray-300">{row.goals_for}</td>
                              <td className="px-4 py-3 text-center text-gray-300">{row.goals_against}</td>
                              <td className="px-4 py-3 text-center text-xs">
                                {row.is_champion ? (
                                  <span className="text-gold font-bold">🏆 Champion</span>
                                ) : row.is_eliminated ? (
                                  <span className="text-gray-400">Éliminé (Tour {row.eliminated_in_round})</span>
                                ) : (
                                  <span className="text-emerald-400 font-medium">En lice</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <>
                    {(groups.length > 0 ? groups : [{ name: 'Général', standings }]).map((g, gi) => {
                      const rows = g.standings || standings.filter((s) => !g.teams || g.teams.some((t) => (t.id || t) === (s.team?.id || s.team)));
                      if (rows.length === 0) return null;
                      return (
                        <div key={gi} className={`${glassCard} overflow-hidden`}>
                          <div className="px-6 py-4 border-b border-white/10">
                            <h3 className="font-bold text-emerald-400">{g.name || `Groupe ${gi + 1}`}</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                  <th className="px-4 py-3 text-left">#</th>
                                  <th className="px-4 py-3 text-left">Équipe</th>
                                  <th className="px-4 py-3 text-center">J</th>
                                  <th className="px-4 py-3 text-center">G</th>
                                  <th className="px-4 py-3 text-center">N</th>
                                  <th className="px-4 py-3 text-center">P</th>
                                  <th className="px-4 py-3 text-center">BP</th>
                                  <th className="px-4 py-3 text-center">BC</th>
                                  <th className="px-4 py-3 text-center">+/-</th>
                                  <th className="px-4 py-3 text-center font-bold text-emerald-400">Pts</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((r, ri) => (
                                  <tr key={ri} className={`border-t border-white/5 ${ri % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'} hover:bg-white/5 transition-colors`}>
                                    <td className="px-4 py-3 text-gray-500">{ri + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-white">{r.team?.name || r.team || '—'}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">{r.played ?? r.J ?? 0}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">{r.won ?? r.G ?? 0}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">{r.drawn ?? r.N ?? 0}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">{r.lost ?? r.P ?? 0}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">{r.goalsFor ?? r.BP ?? 0}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">{r.goalsAgainst ?? r.BC ?? 0}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">{r.goalDifference ?? ((r.BP ?? 0) - (r.BC ?? 0))}</td>
                                    <td className="px-4 py-3 text-center font-extrabold text-emerald-400">{r.points ?? r.Pts ?? 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                    {groups.length === 0 && standings.length === 0 && <p className="text-gray-400 text-center py-10">Aucun classement disponible.</p>}
                  </>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowRegModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-emerald-400 mb-1">Inscription au tournoi</h2>
              <p className="text-xs text-gray-400 mb-6">{tournament.name}</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nom de l'équipe</label>
                  <input
                    type="text"
                    required
                    value={regData.teamName}
                    onChange={(e) => setRegData({ ...regData, teamName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    placeholder="Ex: FC Étoile"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nom du capitaine</label>
                  <input
                    type="text"
                    required
                    value={regData.captainName}
                    onChange={(e) => setRegData({ ...regData, captainName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    placeholder="Ex: Ahmed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Téléphone du capitaine</label>
                  <input
                    type="tel"
                    required
                    value={regData.captainPhone}
                    onChange={(e) => setRegData({ ...regData, captainPhone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    placeholder="Ex: 0600000000"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRegModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm font-medium hover:bg-white/10 transition-all">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={regSubmitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regSubmitting ? 'Envoi...' : "S'inscrire"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">✏️ Modifier le tournoi</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nom</label>
                  <input type="text" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                  <textarea rows={3} value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Ville</label>
                    <input type="text" value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Lieu</label>
                    <input type="text" value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Terrain</label>
                    <input type="text" value={editData.pitch_name || ''} onChange={(e) => setEditData({ ...editData, pitch_name: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Format</label>
                    <select value={editData.format || 'group_knockout'} onChange={(e) => setEditData({ ...editData, format: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all">
                        <option value="group_knockout">Groupes + Knockout</option>
                        <option value="knockout">Élimination directe</option>
                        <option value="round_robin">Tournoi rotatif</option>
                        <option value="league">Ligue</option>
                        <option value="friendly">Amical</option>
                      </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Max équipes</label>
                    <input type="number" min={2} value={editData.num_teams || ''} onChange={(e) => setEditData({ ...editData, num_teams: parseInt(e.target.value) })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Statut</label>
                    <select value={editData.status || 'draft'} onChange={(e) => setEditData({ ...editData, status: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all">
                      <option value="draft">Brouillon</option>
                      <option value="registering">Inscriptions ouvertes</option>
                      <option value="locked">Verrouillé</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Date début</label>
                    <input type="date" value={editData.start_date || ''} onChange={(e) => setEditData({ ...editData, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Date fin</label>
                    <input type="date" value={editData.end_date || ''} onChange={(e) => setEditData({ ...editData, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm font-medium hover:bg-white/10 transition-all">Annuler</button>
                  <button onClick={handleSaveEdit} disabled={editSaving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50">
                    {editSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#111111]/95 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 w-full max-w-md text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Supprimer le tournoi ?</h3>
              <p className="text-gray-400 text-sm mb-6">Cette action est irréversible. Toutes les équipes, matchs et données seront supprimés.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm font-medium hover:bg-white/10 transition-all">Annuler</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/25 transition-all">Supprimer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
