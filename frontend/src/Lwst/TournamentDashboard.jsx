import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Calendar, Target, Clock, ChevronRight, Edit3, Save, X,
  Loader2, AlertCircle, CheckCircle, Shield, Crown, Medal,
   ArrowLeft, Zap, TrendingUp, Goal, Timer, ListOrdered, Grid3X3
} from 'lucide-react';
import { smartTournamentService } from '../services/smartTournamentService';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', variant: 'slate', color: 'text-slate-400' },
  registering: { label: 'Inscriptions ouvertes', variant: 'success', color: 'text-emerald-400' },
  locked: { label: 'Inscriptions fermées', variant: 'amber', color: 'text-amber-400' },
  in_progress: { label: 'En cours', variant: 'primary', color: 'text-primary-light' },
  completed: { label: 'Terminé', variant: 'gold', color: 'text-gold' },
  finished: { label: 'Terminé', variant: 'gold', color: 'text-gold' },
  cancelled: { label: 'Annulé', variant: 'danger', color: 'text-red-400' },
};

const TABS = [
  { id: 'equipes', label: 'Équipes', icon: Users },
  { id: 'groupes', label: 'Groupes', icon: Grid3X3 },
  { id: 'calendrier', label: 'Calendrier', icon: Calendar },
  { id: 'classement', label: 'Classement', icon: ListOrdered },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function TournamentDashboard({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('equipes');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [groupModal, setGroupModal] = useState({ open: false });
  const [groupName, setGroupName] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);

  const [matchModal, setMatchModal] = useState({ open: false });
  const [matchForm, setMatchForm] = useState({ home_team_id: '', away_team_id: '', group_id: '', match_date: '', match_time: '10:00', round: '' });

  const [standingModal, setStandingModal] = useState({ open: false });
  const [standingForm, setStandingForm] = useState({ team_id: '', group_id: '', played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, position: 1 });

  const [resultModal, setResultModal] = useState({ open: false, match: null });
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [resultSaving, setResultSaving] = useState(false);

  const loadTournament = useCallback(async () => {
    try {
      setLoading(true);
      const data = await smartTournamentService.get(id);
      setTournament(data);
      if (data.matches) setMatches(data.matches);
      if (data.standings) setStandings(data.standings);
    } catch (err) {
      setToast({ message: err.message || 'Erreur lors du chargement', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadStandings = useCallback(async () => {
    try {
      const data = await smartTournamentService.getStandings(id);
      setStandings(data);
    } catch { /* ignore */ }
  }, [id]);

  const loadMatches = useCallback(async () => {
    try {
      const data = await smartTournamentService.getMatches(id);
      setMatches(data);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { loadTournament(); }, [loadTournament]);

  useEffect(() => {
    if (tournament && (tournament.status === 'finished' || tournament.status === 'completed')) {
      setActiveTab('classement');
    }
  }, [tournament?.status]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  };

  const handleAction = async (actionFn, successMsg) => {
    setActionLoading(true);
    try {
      await actionFn();
      showToast(successMsg);
      await loadTournament();
      await loadMatches();
      await loadStandings();
    } catch (err) {
      showToast(err.message || 'Une erreur est survenue', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRegistrations = () => handleAction(
    () => smartTournamentService.updateStatus(id, 'registering'),
    'Inscriptions ouvertes avec succès'
  );

  const handleCloseRegistrations = () => handleAction(
    () => smartTournamentService.closeRegistration(id),
    'Inscriptions fermées'
  );

  const handleStart = () => handleAction(
    () => smartTournamentService.updateStatus(id, 'in_progress'),
    'Tournoi démarré !'
  );

  const handleGenerateRound = () => handleAction(
    () => smartTournamentService.generateRound(id),
    'Matchs du tour générés'
  );

  const openResultModal = (match) => {
    setResultModal({ open: true, match });
    setHomeScore(match.home_score ?? '');
    setAwayScore(match.away_score ?? '');
  };

  const handleSaveResult = async () => {
    if (homeScore === '' || awayScore === '') {
      showToast('Veuillez entrer les scores', 'error');
      return;
    }
    setResultSaving(true);
    try {
      const data = {
        home_score: parseInt(homeScore, 10),
        away_score: parseInt(awayScore, 10),
      };
      await smartTournamentService.updateMatchResult(id, resultModal.match.id, data);
      showToast('Résultat enregistré');
      setResultModal({ open: false, match: null });
      await loadTournament();
      await loadMatches();
      await loadStandings();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setResultSaving(false);
    }
  };

  const teams = tournament?.teams || [];
  const groups = tournament?.groups || [];
  const computedStandings = Array.isArray(standings) ? standings : (standings?.groups || []);

  const totalGoals = matches.reduce((acc, m) => acc + (m.home_score || 0) + (m.away_score || 0), 0);
  const completedMatches = matches.filter(m => m.status === 'completed' || m.status === 'finished').length;

  const daysRemaining = (() => {
    if (!tournament?.end_date) return null;
    const end = new Date(tournament.end_date);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Chargement du tableau de bord...</p>
        </motion.div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Tournoi introuvable</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Ce tournoi n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate('/tournoi-smart')} icon={ArrowLeft}>Retour</Button>
        </motion.div>
      </div>
    );
  }

  const status = STATUS_CONFIG[tournament.status] || STATUS_CONFIG.draft;
  const hasGroups = groups.length > 0;
  const hasFixtures = matches.length > 0;
  const isKnockout = tournament.format === 'knockout';
  const isFinished = tournament.status === 'finished' || tournament.status === 'completed';
  const availableTeams = teams.filter((t) => !t.is_eliminated);
  const eliminatedTeams = teams.filter((t) => t.is_eliminated);
  const pendingMatches = matches.filter((m) => m.status !== 'finished');
  const allMatchesFinished = matches.length > 0 && pendingMatches.length === 0;
  const currentRound = matches.length > 0 ? Math.max(...matches.map((m) => m.round_number || 0)) : 0;

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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

          {/* HEADER */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-12 bg-gradient-to-b from-emerald-500 to-gold rounded-full" />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient">{tournament.name}</h1>
                  <Badge variant={status.variant} icon={Trophy}>{status.label}</Badge>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  {tournament.format || 'Format non spécifié'} · {tournament.location || 'Lieu non défini'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {tournament.status === 'draft' && (
                <Button variant="primary" icon={Zap} loading={actionLoading} onClick={handleOpenRegistrations}>
                  Ouvrir inscriptions
                </Button>
              )}
              {tournament.status === 'registering' && (
                <Button variant="secondary" icon={CheckCircle} loading={actionLoading} onClick={handleCloseRegistrations}>
                  Fermer inscriptions
                </Button>
              )}
              {tournament.status === 'locked' && (
                <Button variant="gold" icon={Zap} loading={actionLoading} onClick={handleStart}>
                  Démarrer
                </Button>
              )}
              <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/tournoi-smart')}>
                Retour
              </Button>
            </div>
          </motion.div>

          {/* STATS BAR */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Équipes inscrites', value: teams.length, sub: `/ ${tournament.num_teams || '?'}`, color: 'emerald' },
              { icon: CheckCircle, label: 'Matchs complétés', value: completedMatches, sub: `/ ${matches.length}`, color: 'blue' },
              { icon: Goal, label: 'Buts marqués', value: totalGoals, sub: 'total', color: 'gold' },
              { icon: Timer, label: 'Jours restants', value: daysRemaining !== null ? daysRemaining : '—', sub: daysRemaining !== null ? 'jours' : '', color: 'purple' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="glass-card rounded-2xl p-4 sm:p-5 group hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                    <stat.icon size={20} className={`text-${stat.color}-400`} />
                  </div>
                  <TrendingUp size={14} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stat.value}<span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1">{stat.sub}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* TABS */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-1 p-1 glass-card rounded-2xl overflow-x-auto scrollbar-hide">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const isHidden = (isKnockout && tab.id === 'groupes') || (isFinished && tab.id !== 'classement');
                if (isHidden) return null;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl shadow-lg shadow-emerald-500/25"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <tab.icon size={16} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* TAB CONTENT */}
          <AnimatePresence mode="wait">
            {/* ÉQUIPES */}
            {activeTab === 'equipes' && (
              <motion.div key="equipes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Users size={16} className="text-emerald-400" />
                    </div>
                    Équipes inscrites
                  </h2>
                  <Badge variant="success">{teams.length} équipe{teams.length !== 1 ? 's' : ''}</Badge>
                </div>
                {teams.length === 0 ? (
                  <div className="glass-card rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="text-emerald-400" size={28} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Aucune équipe inscrite</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Les équipes s'inscriront une fois les inscriptions ouvertes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {teams.map((team, idx) => (
                      <motion.div
                        key={team.id || idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="glass-card rounded-2xl p-5 group hover:scale-[1.02] transition-transform duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-gold/20 flex items-center justify-center text-lg font-extrabold text-emerald-400">
                              {team.name?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{team.name}</h3>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                {team.is_eliminated ? 'Éliminée' : team.status === 'confirmed' ? 'Confirmée' : team.status === 'pending' ? 'En attente' : team.status || 'Inscrite'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={team.is_eliminated ? 'danger' : team.status === 'confirmed' ? 'success' : team.status === 'pending' ? 'amber' : 'slate'} className="text-[10px]">
                            {team.is_eliminated ? 'Éliminée' : team.status === 'confirmed' ? 'Confirmée' : team.status === 'pending' ? 'En attente' : 'Inscrite'}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Crown size={12} className="text-gold" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Capitaine:</span> {team.captain || team.captain_name || '—'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Users size={12} className="text-emerald-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Joueurs:</span> {team.players_count || team.players || '—'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* GROUPES */}
            {activeTab === 'groupes' && (
              <motion.div key="groupes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Grid3X3 size={16} className="text-blue-400" />
                    </div>
                    Groupes
                  </h2>
                  <Button variant="primary" icon={Grid3X3} onClick={() => setGroupModal({ open: true })}>
                    Ajouter un groupe
                  </Button>
                </div>
                {!hasGroups ? (
                  <div className="glass-card rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                      <Grid3X3 className="text-blue-400" size={28} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Aucun groupe</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Créez un groupe et assignez-y des équipes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groups.map((group, gi) => (
                      <motion.div key={group.id || gi} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: gi * 0.08 }} className="glass-card rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center">
                              <span className="text-sm font-extrabold text-blue-400">{group.name || `Groupe ${gi + 1}`}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{group.name || `Groupe ${gi + 1}`}</h3>
                          </div>
                          <button onClick={async () => { if (!confirm('Supprimer ce groupe ?')) return; try { await smartTournamentService.deleteGroup(id, group.id); showToast('Groupe supprimé'); await loadTournament(); } catch (e) { showToast(e.message, 'error'); } }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(group.teams || []).map((t, ti) => (
                            <div key={t.id || ti} className="flex items-center justify-between p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400">{ti + 1}</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{t.team_name || t.name || t}</span>
                              </div>
                            </div>
                          ))}
                          {(!group.teams || group.teams.length === 0) && (
                            <p className="text-xs text-slate-400 text-center py-3">Aucune équipe dans ce groupe</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* CALENDRIER */}
            {activeTab === 'calendrier' && (
              <motion.div key="calendrier" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Calendar size={16} className="text-purple-400" />
                    </div>
                    {isKnockout ? `Tour ${currentRound || 1}` : 'Calendrier des matchs'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {isKnockout ? (
                      <>
                        {allMatchesFinished && availableTeams.length >= 2 && (
                          <Button variant="primary" icon={Zap} loading={actionLoading} onClick={handleGenerateRound}>
                            Tour suivant
                          </Button>
                        )}
                        {matches.length === 0 && (
                          <Button variant="primary" icon={Zap} loading={actionLoading} onClick={handleGenerateRound}>
                            Générer les matchs
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button variant="primary" icon={Calendar} onClick={() => setMatchModal({ open: true })}>
                        Ajouter un match
                      </Button>
                    )}
                  </div>
                </div>

                {/* Eliminated teams */}
                {isKnockout && eliminatedTeams.length > 0 && (
                  <div className="glass-card rounded-2xl p-4">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Équipes éliminées ({eliminatedTeams.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {eliminatedTeams.map((t) => (
                        <span key={t.id} className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 line-through">
                          {t.team_name || t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {matches.length === 0 ? (
                  <div className="glass-card rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="text-purple-400" size={28} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Aucun match planifié</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Ajoutez un match pour voir le calendrier.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match, idx) => {
                      const isCompleted = match.status === 'finished' || match.status === 'completed';
                      return (
                        <motion.div
                          key={match.id || idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isCompleted ? 'opacity-80' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {match.group_name && (
                                <Badge variant="blue" className="text-[10px]">{match.group_name}</Badge>
                              )}
                              {match.round && (
                                <Badge variant="purple" className="text-[10px]">{match.round}</Badge>
                              )}
                              <Badge variant={isCompleted ? 'success' : 'slate'} className="text-[10px]">
                                {isCompleted ? 'Terminé' : match.status === 'in_progress' ? 'En cours' : 'À jouer'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {match.home_team?.team_name || match.home_team?.name || 'Équipe A'}
                              </span>
                              {isCompleted ? (
                                <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                  <span className="text-lg font-extrabold text-emerald-500">{match.home_score}</span>
                                  <span className="text-xs text-slate-400">-</span>
                                  <span className="text-lg font-extrabold text-emerald-500">{match.away_score}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">vs</span>
                              )}
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {match.away_team?.team_name || match.away_team?.name || 'Équipe B'}
                              </span>
                            </div>
                            {match.match_date && (
                              <p className="text-[11px] text-slate-400 mt-1 ml-1">
                                {new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isCompleted && (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={Edit3}
                                onClick={() => openResultModal(match)}
                              >
                                Saisir le résultat
                              </Button>
                            )}
                            <button onClick={async () => { if (!confirm('Supprimer ce match ?')) return; try { await smartTournamentService.deleteMatch(id, match.id); showToast('Match supprimé'); await loadTournament(); await loadMatches(); } catch (e) { showToast(e.message, 'error'); } }} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all" title="Supprimer">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* CLASSEMENT */}
            {activeTab === 'classement' && (
              <motion.div key="classement" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
                      <Medal size={16} className="text-gold" />
                    </div>
                    Classement
                  </h2>
                  {!isKnockout && hasGroups && (
                    <Button variant="primary" icon={Medal} onClick={() => setStandingModal({ open: true })}>
                      Ajouter / Modifier
                    </Button>
                  )}
                </div>
                {isKnockout && knockoutRanking.length > 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-gold/10 border-b border-black/5 dark:border-white/5">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Medal size={16} className="text-gold" />
                        Classement final — Élimination directe
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/5">
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Équipe</th>
                            <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">MJ</th>
                            <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">BP</th>
                            <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">BC</th>
                            <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {knockoutRanking.map((row, ri) => (
                            <tr key={row.id} className={`border-b border-black/[0.03] dark:border-white/[0.03] transition-colors ${ri === 0 ? 'bg-gold/5' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}`}>
                              <td className="px-4 py-3">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${ri === 0 ? 'bg-gold/20 text-gold' : ri === 1 ? 'bg-slate-300/20 text-slate-300' : ri === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                                  {ri + 1}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                                <span className="flex items-center gap-2">
                                  {row.team_name}
                                  {row.is_champion && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">Champion</span>}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.matches_played}</td>
                              <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.goals_for}</td>
                              <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.goals_against}</td>
                              <td className="px-3 py-3 text-center text-[10px]">
                                {row.is_champion ? (
                                  <span className="text-gold font-bold">🏆 Champion</span>
                                ) : row.is_eliminated ? (
                                  <span className="text-slate-400">Éliminé (Tour {row.eliminated_in_round})</span>
                                ) : (
                                  <span className="text-emerald-400 font-medium">En lice</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : computedStandings.length === 0 ? (
                  <div className="glass-card rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <Medal className="text-gold" size={28} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Pas encore de classement</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Le classement sera disponible après les premiers matchs.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {computedStandings.map((group, gi) => (
                      <motion.div
                        key={group.group_name || gi}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: gi * 0.08 }}
                        className="glass-card rounded-2xl overflow-hidden"
                      >
                        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-gold/10 border-b border-black/5 dark:border-white/5">
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield size={16} className="text-emerald-400" />
                            {group.group_name || `Groupe ${gi + 1}`}
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-black/5 dark:border-white/5">
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Équipe</th>
                                <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">MJ</th>
                                <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">G</th>
                                <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">N</th>
                                <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">P</th>
                                <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">BP</th>
                                <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">BC</th>
                                <th className="px-3 py-3 text-center text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Pts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(group.standings || group.teams || []).map((row, ri) => (
                                <tr
                                  key={row.team_id || ri}
                                  className={`border-b border-black/[0.03] dark:border-white/[0.03] transition-colors ${
                                    ri === 0 ? 'bg-emerald-500/5' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                                  }`}
                                >
                                  <td className="px-4 py-3">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                      ri === 0 ? 'bg-gold/20 text-gold' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                                    }`}>
                                      {ri + 1}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{row.team_name || row.name}</td>
                                  <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.played ?? row.mp ?? 0}</td>
                                  <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.won ?? row.w ?? 0}</td>
                                  <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.drawn ?? row.d ?? 0}</td>
                                  <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.lost ?? row.l ?? 0}</td>
                                  <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.goals_for ?? row.gf ?? 0}</td>
                                  <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{row.goals_against ?? row.ga ?? 0}</td>
                                  <td className="px-3 py-3 text-center text-sm font-extrabold text-emerald-500">{row.points ?? row.pts ?? 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>

      {/* RESULT ENTRY MODAL */}
      <Modal
        isOpen={resultModal.open}
        onClose={() => setResultModal({ open: false, match: null })}
        title="Saisir le résultat"
        subtitle={resultModal.match ? `${resultModal.match.home_team?.team_name || resultModal.match.home_team?.name || 'Équipe A'} vs ${resultModal.match.away_team?.team_name || resultModal.match.away_team?.name || 'Équipe B'}` : ''}
      >
        {resultModal.match && (
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2 truncate">
                  {resultModal.match.home_team?.team_name || resultModal.match.home_team?.name || 'Équipe A'}
                </p>
                <input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-20 mx-auto text-center text-3xl font-extrabold bg-black/5 dark:bg-white/5 border border-emerald-500/30 rounded-xl py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="text-2xl font-bold text-slate-300 dark:text-slate-600">-</div>
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2 truncate">
                  {resultModal.match.away_team?.team_name || resultModal.match.away_team?.name || 'Équipe B'}
                </p>
                <input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-20 mx-auto text-center text-3xl font-extrabold bg-black/5 dark:bg-white/5 border border-emerald-500/30 rounded-xl py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setResultModal({ open: false, match: null })}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                icon={Save}
                loading={resultSaving}
                onClick={handleSaveResult}
                className="flex-1"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD GROUP MODAL */}
      <Modal isOpen={groupModal.open} onClose={() => setGroupModal({ open: false })} title="Ajouter un groupe" subtitle="Nom du groupe et assignation des équipes">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Nom du groupe</label>
            <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="Ex: Groupe A" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">Sélectionner les équipes</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {teams.map((team) => (
                <label key={team.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${selectedTeamIds.includes(team.id) ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:bg-black/[0.06] dark:hover:bg-white/[0.06]'}`}>
                  <input type="checkbox" checked={selectedTeamIds.includes(team.id)} onChange={(e) => { if (e.target.checked) setSelectedTeamIds([...selectedTeamIds, team.id]); else setSelectedTeamIds(selectedTeamIds.filter((id) => id !== team.id)); }} className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{team.team_name || team.name}</span>
                  {team.captain_name && <span className="text-xs text-slate-400 dark:text-slate-500">({team.captain_name})</span>}
                </label>
              ))}
              {teams.length === 0 && <p className="text-xs text-slate-400 text-center py-3">Aucune équipe inscrite</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setGroupModal({ open: false }); setGroupName(''); setSelectedTeamIds([]); }} className="flex-1">Annuler</Button>
            <Button variant="primary" loading={actionLoading} onClick={async () => {
              if (!groupName.trim() || selectedTeamIds.length < 2) { showToast('Nom requis et au moins 2 équipes', 'error'); return; }
              setActionLoading(true);
              try { await smartTournamentService.createGroup(id, { name: groupName.trim(), team_ids: selectedTeamIds }); showToast('Groupe créé'); setGroupModal({ open: false }); setGroupName(''); setSelectedTeamIds([]); await loadTournament(); } catch (e) { showToast(e.message, 'error'); } finally { setActionLoading(false); }
            }} className="flex-1">Créer</Button>
          </div>
        </div>
      </Modal>

      {/* ADD MATCH MODAL */}
      <Modal isOpen={matchModal.open} onClose={() => setMatchModal({ open: false })} title="Ajouter un match" subtitle="Choisir les équipes et la date">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Équipe à domicile</label>
            <select value={matchForm.home_team_id} onChange={(e) => setMatchForm({ ...matchForm, home_team_id: e.target.value })} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all">
              <option value="">Choisir...</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.team_name || t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Équipe à l'extérieur</label>
            <select value={matchForm.away_team_id} onChange={(e) => setMatchForm({ ...matchForm, away_team_id: e.target.value })} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all">
              <option value="">Choisir...</option>
              {teams.filter((t) => t.id != matchForm.home_team_id).map((t) => <option key={t.id} value={t.id}>{t.team_name || t.name}</option>)}
            </select>
          </div>
          {hasGroups && (
            <div>
              <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Groupe (optionnel)</label>
              <select value={matchForm.group_id} onChange={(e) => setMatchForm({ ...matchForm, group_id: e.target.value })} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all">
                <option value="">Aucun</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Date</label>
              <input type="date" value={matchForm.match_date} onChange={(e) => setMatchForm({ ...matchForm, match_date: e.target.value })} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Heure</label>
              <input type="time" value={matchForm.match_time} onChange={(e) => setMatchForm({ ...matchForm, match_time: e.target.value })} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Tour / Journée (optionnel)</label>
            <input type="text" value={matchForm.round} onChange={(e) => setMatchForm({ ...matchForm, round: e.target.value })} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="Ex: Journée 1" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setMatchModal({ open: false }); setMatchForm({ home_team_id: '', away_team_id: '', group_id: '', match_date: '', match_time: '10:00', round: '' }); }} className="flex-1">Annuler</Button>
            <Button variant="primary" loading={actionLoading} onClick={async () => {
              if (!matchForm.home_team_id || !matchForm.away_team_id || !matchForm.match_date) { showToast('Remplissez tous les champs requis', 'error'); return; }
              setActionLoading(true);
              try { await smartTournamentService.createMatch(id, { ...matchForm, group_id: matchForm.group_id || undefined }); showToast('Match ajouté'); setMatchModal({ open: false }); setMatchForm({ home_team_id: '', away_team_id: '', group_id: '', match_date: '', match_time: '10:00', round: '' }); await loadTournament(); } catch (e) { showToast(e.message, 'error'); } finally { setActionLoading(false); }
            }} className="flex-1">Ajouter</Button>
          </div>
        </div>
      </Modal>

      {/* ADD STANDING MODAL */}
      <Modal isOpen={standingModal.open} onClose={() => setStandingModal({ open: false })} title="Ajouter / Modifier classement">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Équipe</label>
              <select value={standingForm.team_id} onChange={(e) => setStandingForm({ ...standingForm, team_id: e.target.value })} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all">
                <option value="">Choisir...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.team_name || t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Groupe</label>
              <select value={standingForm.group_id} onChange={(e) => setStandingForm({ ...standingForm, group_id: e.target.value })} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all">
                <option value="">Choisir...</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[{ k: 'played', l: 'MJ' }, { k: 'won', l: 'G' }, { k: 'drawn', l: 'N' }, { k: 'lost', l: 'P' }].map(({ k, l }) => (
              <div key={k}>
                <label className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1 text-center">{l}</label>
                <input type="number" min="0" value={standingForm[k]} onChange={(e) => setStandingForm({ ...standingForm, [k]: parseInt(e.target.value) || 0 })} className="w-full px-2 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ k: 'goals_for', l: 'BP' }, { k: 'goals_against', l: 'BC' }, { k: 'points', l: 'Pts' }].map(({ k, l }) => (
              <div key={k}>
                <label className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1 text-center">{l}</label>
                <input type="number" min="0" value={standingForm[k]} onChange={(e) => setStandingForm({ ...standingForm, [k]: parseInt(e.target.value) || 0 })} className="w-full px-2 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1">Position</label>
            <input type="number" min="1" value={standingForm.position} onChange={(e) => setStandingForm({ ...standingForm, position: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setStandingModal({ open: false }); setStandingForm({ team_id: '', group_id: '', played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, position: 1 }); }} className="flex-1">Annuler</Button>
            <Button variant="primary" loading={actionLoading} onClick={async () => {
              if (!standingForm.team_id || !standingForm.group_id) { showToast('Équipe et groupe requis', 'error'); return; }
              setActionLoading(true);
              try { await smartTournamentService.createStanding(id, standingForm); showToast('Classement enregistré'); setStandingModal({ open: false }); await loadTournament(); await loadStandings(); } catch (e) { showToast(e.message, 'error'); } finally { setActionLoading(false); }
            }} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
