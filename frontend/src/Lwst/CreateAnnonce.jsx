import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle, Trophy, MapPin, Calendar, Clock, Users, Zap, Target, DollarSign } from 'lucide-react';
import { createAnnouncement } from '../services/matchService';
import { API_BASE_URL } from '../services/config';
import { ToastFixed } from '../components/Toast';

export default function CreateAnnonce({ user }) {
  const navigate = useNavigate();
  const [terrains, setTerrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    terrain_id: '',
    match_date: '',
    match_time: '',
    duration: 60,
    level: 'intermediaire',
    players_needed: 5,
    price_per_player: '',
    match_type: 'amical',
  });
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetch(`${API_BASE_URL}/terrains`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setTerrains(Array.isArray(data) ? data : data.data || []))
      .catch(() => {});
  }, []);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        user_id: user.id,
        terrain_id: parseInt(form.terrain_id),
        players_needed: parseInt(form.players_needed),
        duration: parseInt(form.duration),
        price_per_player: form.price_per_player ? parseFloat(form.price_per_player) : null,
      };
      const result = await createAnnouncement(data);
      setSuccess(true);
      setTimeout(() => navigate(`/annonces/${result.id}`), 1500);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="glass-card text-center py-16 px-12 rounded-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <CheckCircle className="mx-auto text-primary-light mb-4" size={64} />
          </motion.div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Annonce créée !</h2>
          <p className="text-gray-500 dark:text-gray-400">Redirection en cours...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ToastFixed message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-light transition-colors mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Retour
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 sm:p-8"
        >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-1.5 h-12 bg-gradient-to-b from-primary to-primary-light rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient">Créer une annonce</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Trouvez des joueurs pour votre match</p>
              </div>
            </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Trophy size={14} className="text-primary-light" /> Titre de l'annonce *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="Ex: Match amical samedi soir"
                className="input-field !rounded-xl"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Décrivez le match, le style de jeu, les règles..."
                className="input-field !rounded-xl resize-none"
              />
            </div>

            {/* Terrain */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <MapPin size={14} className="text-primary-light" /> Terrain *
              </label>
              <select
                name="terrain_id"
                value={form.terrain_id}
                onChange={handleChange}
                required
                className="input-field !rounded-xl appearance-none cursor-pointer"
              >
                <option value="">Choisir un terrain</option>
                {terrains.map(t => (
                  <option key={t.id} value={t.id}>{t.titre}</option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar size={14} className="text-primary-light" /> Date *
                </label>
                <input
                  type="date"
                  name="match_date"
                  value={form.match_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field !rounded-xl cursor-pointer"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Clock size={14} className="text-primary-light" /> Heure *
                </label>
                <select
                  name="match_time"
                  value={form.match_time}
                  onChange={handleChange}
                  required
                  className="input-field !rounded-xl cursor-pointer"
                >
                  <option value="" disabled>Choisir une heure</option>
                  {["10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00","00:00"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration & Players */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Clock size={14} className="text-primary-light" /> Durée (min)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  min={30}
                  max={180}
                  className="input-field !rounded-xl"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Users size={14} className="text-primary-light" /> Joueurs recherchés *
                </label>
                <input
                  type="number"
                  name="players_needed"
                  value={form.players_needed}
                  onChange={handleChange}
                  min={1}
                  max={30}
                  className="input-field !rounded-xl"
                />
              </div>
            </div>

            {/* Level & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Target size={14} className="text-primary-light" /> Niveau *
                </label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  className="input-field !rounded-xl appearance-none cursor-pointer"
                >
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Zap size={14} className="text-primary-light" /> Type *
                </label>
                <select
                  name="match_type"
                  value={form.match_type}
                  onChange={handleChange}
                  className="input-field !rounded-xl appearance-none cursor-pointer"
                >
                  <option value="amical">Amical</option>
                  <option value="competitif">Compétitif</option>
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign size={14} className="text-primary-light" /> Prix par joueur (DH, optionnel)
              </label>
              <input
                type="number"
                name="price_per_player"
                value={form.price_per_player}
                onChange={handleChange}
                min={0}
                step="0.5"
                placeholder="Laisser vide si gratuit"
                className="input-field !rounded-xl"
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full btn-primary !py-3.5 !rounded-xl text-sm mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><Zap size={18} /> Publier l'annonce</>}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
