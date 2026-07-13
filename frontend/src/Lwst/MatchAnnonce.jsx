import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Clock, Users, Calendar, Zap, ChevronDown, Plus, X, Loader2, Trophy } from 'lucide-react';
import { getAnnouncements } from '../services/matchService';

const levelLabels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
const typeLabels = { amical: 'Amical', competitif: 'Compétitif' };
const statusLabels = { open: 'Ouvert', full: 'Complet', closed: 'Fermé' };

const levelBadge = {
  debutant: 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/30',
  intermediaire: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  avance: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30',
};

const typeBadge = {
  amical: 'bg-primary/10 text-primary border-primary/30',
  competitif: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
};

const statusBadge = {
  open: 'bg-primary/10 text-primary-light border-primary/30',
  full: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  closed: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function MatchAnnonce({ user }) {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '', level: '', match_type: '', date: '' });

  const fetchAnnouncements = async (p = 1) => {
    setLoading(true);
    try {
      const data = await getAnnouncements({ ...filters, page: p });
      setAnnouncements(p === 1 ? data.data : [...announcements, ...data.data]);
      setLastPage(data.last_page);
      setTotal(data.total);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(1); }, [filters]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ search: '', level: '', match_type: '', date: '' });
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-12 bg-gradient-to-b from-primary to-primary-light rounded-full" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient">Trouver des joueurs</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {total} annonce{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {user && (
            <Link to="/annonces/creer">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="btn-primary gap-2"
              >
                <Plus size={18} /> Créer une annonce
              </motion.button>
            </Link>
          )}
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card rounded-2xl p-4 sm:p-6 mb-8"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Rechercher une annonce..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-field !pl-11 !rounded-xl"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-primary/10 text-primary-light border-primary/30'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-dark-900 dark:hover:text-white'
              }`}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filtres</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-light" />}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-black/5 dark:border-white/8">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Niveau</label>
                    <select
                      value={filters.level}
                      onChange={(e) => handleFilterChange('level', e.target.value)}
                      className="input-field !rounded-xl appearance-none cursor-pointer"
                    >
                      <option value="">Tous les niveaux</option>
                      <option value="debutant">Débutant</option>
                      <option value="intermediaire">Intermédiaire</option>
                      <option value="avance">Avancé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Type</label>
                    <select
                      value={filters.match_type}
                      onChange={(e) => handleFilterChange('match_type', e.target.value)}
                      className="input-field !rounded-xl appearance-none cursor-pointer"
                    >
                      <option value="">Tous les types</option>
                      <option value="amical">Amical</option>
                      <option value="competitif">Compétitif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      value={filters.date}
                      onChange={(e) => handleFilterChange('date', e.target.value)}
                      className="input-field !rounded-xl cursor-pointer"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} /> Effacer les filtres
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Announcements Grid */}
        {loading && announcements.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary-light" size={40} />
          </div>
        ) : announcements.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-20 px-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-primary-light" size={32} />
            </div>
            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">Aucune annonce trouvée</h3>
            <p className="text-gray-500 dark:text-gray-400">Essayez de modifier vos filtres ou créez une nouvelle annonce.</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {announcements.map((a) => (
              <motion.div
                key={a.id}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => navigate(`/annonces/${a.id}`)}
                className="glass-card-hover group flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Gradient Accent Top */}
                <div className="h-1.5 bg-gradient-to-r from-primary via-primary-light to-primary-light shrink-0" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${levelBadge[a.level]}`}>
                      {levelLabels[a.level]}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${typeBadge[a.match_type]}`}>
                      {typeLabels[a.match_type]}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${statusBadge[a.status]}`}>
                      {statusLabels[a.status]}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-1.5 group-hover:text-primary-light transition-colors line-clamp-1">
                    {a.title}
                  </h3>

                  {a.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">{a.description}</p>
                  )}

                  {/* Info */}
                  <div className="space-y-2 text-sm mt-auto">
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar size={12} className="text-primary-light" />
                      </div>
                      <span>{new Date(a.match_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock size={12} className="text-primary-light" />
                      </div>
                      <span>{a.match_time} · {a.duration} min</span>
                    </div>
                    {a.terrain && (
                      <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin size={12} className="text-primary-light" />
                        </div>
                        <span className="truncate">{a.terrain.titre}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5 dark:border-white/8">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {a.creator?.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{a.creator?.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users size={14} className="text-primary-light" />
                      <span className="text-gray-500 dark:text-gray-400">
                        <span className="font-bold text-dark-900 dark:text-white">{a.players_joined}</span>
                        <span className="mx-0.5">/</span>
                        {a.players_needed}
                      </span>
                    </div>
                  </div>

                  {a.price_per_player > 0 && (
                    <div className="mt-3 flex items-center justify-end gap-1">
                      <span className="text-primary-light font-bold text-sm">{a.price_per_player} DH</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">/joueur</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load More */}
        {page < lastPage && (
          <div className="text-center mt-10">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => fetchAnnouncements(page + 1)}
              disabled={loading}
              className="btn-secondary gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Charger plus'}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
