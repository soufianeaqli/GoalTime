import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Users, Calendar, MapPin, Loader2, Plus, ChevronRight, Trophy, Clock } from 'lucide-react';
import { getMyAnnouncements } from '../services/matchService';

const statusBadge = {
  open: 'bg-primary/10 text-primary-light border-primary/30',
  full: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  closed: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30',
};

const statusLabels = { open: 'Ouvert', full: 'Complet', closed: 'Fermé' };

export default function CaptainDashboard({ user }) {
  const navigate = useNavigate();
  const [created, setCreated] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getMyAnnouncements(user.id)
      .then(data => { setCreated(data.created || []); setJoined(data.joined || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-light" size={40} />
      </div>
    );
  }

  const renderCard = (a, index, showStatus = true) => (
    <motion.div
      key={a.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/annonces/${a.id}`)}
      className="glass-card-hover rounded-2xl p-4 sm:p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {showStatus && (
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${statusBadge[a.status]}`}>
                {statusLabels[a.status]}
              </span>
            </div>
          )}
          <h3 className="font-bold text-dark-900 dark:text-white truncate group-hover:text-primary-light transition-colors">{a.title}</h3>
          {!showStatus && (
            <p className="text-xs text-primary-light mt-0.5 font-medium">Capitaine: {a.creator?.username}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                <Calendar size={10} className="text-primary-light" />
              </div>
              {new Date(a.match_date).toLocaleDateString('fr-FR')}
            </span>
            {a.terrain && (
              <span className="flex items-center gap-1">
                <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                  <MapPin size={10} className="text-primary-light" />
                </div>
                {a.terrain.titre}
              </span>
            )}
            <span className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                <Users size={10} className="text-primary-light" />
              </div>
              {a.players_joined}/{a.players_needed}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 shrink-0 mt-2 group-hover:text-primary-light transition-colors" />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-12 bg-gradient-to-b from-gold to-gold-light rounded-full" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient">Mon tableau de bord</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {created.length} annonce créée{created.length !== 1 ? 's' : ''} · {joined.length} rejointe{joined.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link to="/annonces/creer">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-primary gap-2"
            >
              <Plus size={18} /> Nouvelle annonce
            </motion.button>
          </Link>
        </motion.div>

        {/* Created Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center">
              <Crown size={16} className="text-gold" />
            </div>
            Mes annonces (capitaine)
          </h2>
          {created.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Trophy className="text-primary-light" size={24} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Vous n'avez encore créé aucune annonce.</p>
              <Link to="/annonces/creer" className="text-primary-light font-semibold hover:underline text-sm">
                Créer votre première annonce
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {created.map((a, i) => renderCard(a, i, true))}
            </div>
          )}
        </motion.div>

        {/* Joined Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users size={16} className="text-primary-light" />
            </div>
            Annonces rejointes
          </h2>
          {joined.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="text-primary-light" size={24} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Vous n'avez rejoint aucune annonce.</p>
              <Link to="/annonces" className="text-primary-light font-semibold hover:underline text-sm">
                Trouver des annonces
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {joined.map((a, i) => renderCard(a, i, false))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
