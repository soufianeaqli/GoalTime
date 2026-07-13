import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, ArrowRight, Trophy, Shield, Zap, RefreshCw,
  BarChart3, Heart, MapPin, FileText, Users, Clock, Calendar,
  Award, CheckCircle, Loader2, Info, Sparkles, Star, Hash
} from 'lucide-react';
import { smartTournamentService } from '../services/smartTournamentService';

const FORMATS = [
  {
    id: 'group_knockout',
    label: 'Groupes + Knockout',
    icon: Shield,
    color: 'from-primary to-primary-light',
    desc: 'Phase de groupes suivie d\'une phase à élimination directe'
  },
  {
    id: 'knockout',
    label: 'Élimination Directe',
    icon: Zap,
    color: 'from-red-500 to-orange-400',
    desc: 'Arbre à élimination directe, un seul match éliminatoire'
  },
  {
    id: 'round_robin',
    label: 'Tournoi Rotatif',
    icon: RefreshCw,
    color: 'from-blue-500 to-cyan-400',
    desc: 'Chaque équipe joue contre toutes les autres'
  },
  {
    id: 'league',
    label: 'Ligue',
    icon: BarChart3,
    color: 'from-purple-500 to-pink-400',
    desc: 'Championnat avec classement et matches aller-retour'
  },
  {
    id: 'friendly',
    label: 'Coupe Amicale',
    icon: Heart,
    color: 'from-gold to-gold-light',
    desc: 'Tournoi décontracté entre amis'
  }
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 300 : -300, opacity: 0 })
};

const toastVariants = {
  initial: { opacity: 0, y: -40, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -40, scale: 0.9 }
};

export default function TournamentWizard({ user, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    pitch_name: '',
    num_teams: 8,
    num_groups: 2,
    teams_per_group: 4,
    match_duration: 60,
    points_win: 3,
    points_draw: 1,
    points_loss: 0,
    format: 'group_knockout',
    start_date: '',
    end_date: '',
    match_start_time: '18:00',
    daily_match_limit: 4,
    break_minutes: 15,
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const totalSteps = 5;

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.city.trim() && form.pitch_name.trim();
    if (step === 2) return form.num_teams >= 2 && form.num_teams <= 32;
    if (step === 3) return !!form.format;
    if (step === 4) return form.start_date && form.end_date;
    return true;
  };

  const goNext = () => { if (canNext() && step < totalSteps) { setDirection(1); setStep(s => s + 1); } };
  const goBack = () => { if (step > 1) { setDirection(-1); setStep(s => s - 1); } };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        pitch_name: form.pitch_name.trim(),
        num_teams: parseInt(form.num_teams),
        num_groups: parseInt(form.num_groups),
        teams_per_group: parseInt(form.teams_per_group),
        match_duration: parseInt(form.match_duration),
        points_win: parseInt(form.points_win),
        points_draw: parseInt(form.points_draw),
        points_loss: parseInt(form.points_loss),
        format: form.format,
        start_date: form.start_date,
        end_date: form.end_date,
        match_start_time: form.match_start_time,
        daily_match_limit: parseInt(form.daily_match_limit),
        break_minutes: parseInt(form.break_minutes),
        user_id: user?.id,
      };
      const result = await smartTournamentService.create(data);
      showToast('Tournoi créé avec succès !');
      setTimeout(() => onCreated?.(result), 1200);
    } catch (err) {
      showToast(err.message || 'Erreur lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Infos Générales', 'Paramètres', 'Format', 'Dates', 'Résumé'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl font-semibold text-sm shadow-2xl flex items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-red-500/90 text-white'
                : 'bg-primary/90 text-white'
            }`}
            style={{ backdropFilter: 'blur(12px)' }}
          >
            {toast.type === 'error' ? <X size={16} /> : <CheckCircle size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl glass-card relative"
        style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.35), 0 0 60px rgba(11,110,79,0.1)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-dark-700/50 text-gray-400 hover:text-white hover:bg-dark-600 transition-all"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-8 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-11 bg-gradient-to-b from-primary to-primary-light rounded-full" />
            <div>
              <h1 className="text-2xl font-extrabold text-gradient">Créer un Smart Tournoi</h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Configurez votre tournoi en quelques étapes</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-2">
            {stepLabels.map((label, i) => {
              const num = i + 1;
              const active = num === step;
              const done = num < step;
              return (
                <React.Fragment key={num}>
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      animate={{
                        scale: active ? 1.15 : 1,
                        background: done
                          ? 'linear-gradient(135deg, #0B6E4F, #10b981)'
                          : active
                          ? 'linear-gradient(135deg, #0B6E4F, #10b981)'
                          : 'rgba(255,255,255,0.08)'
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        done || active
                          ? 'border-primary-light text-white'
                          : 'border-white/10 text-gray-500'
                      }`}
                    >
                      {done ? <CheckCircle size={16} /> : num}
                    </motion.div>
                    <span className={`text-[10px] font-medium hidden sm:block ${active ? 'text-primary-light' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                  {i < totalSteps - 1 && (
                    <div className="flex-1 mx-1 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', marginTop: '-18px' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: num < step ? '100%' : '0%' }}
                        transition={{ duration: 0.4 }}
                        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="px-8 pb-4 min-h-[340px] overflow-y-auto" style={{ maxHeight: '52vh' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {step === 1 && (
                <div className="space-y-5 pt-2">
                  <StepTitle icon={FileText} label="Informations Générales" sub="Décrivez votre tournoi" />

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Trophy size={14} className="text-primary-light" /> Nom du tournoi *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Ex: Coupe de l'Amitié 2026"
                      className="input-field !rounded-xl w-full"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Info size={14} className="text-primary-light" /> Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                      rows={3}
                      placeholder="Décrivez le thème, les règles, le niveau..."
                      className="input-field !rounded-xl resize-none w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <MapPin size={14} className="text-primary-light" /> Ville *
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={e => set('city', e.target.value)}
                        placeholder="Casablanca"
                        className="input-field !rounded-xl w-full"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Star size={14} className="text-primary-light" /> Nom du terrain *
                      </label>
                      <input
                        type="text"
                        value={form.pitch_name}
                        onChange={e => set('pitch_name', e.target.value)}
                        placeholder="Terrain Royal"
                        className="input-field !rounded-xl w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5 pt-2">
                  <StepTitle icon={Users} label="Paramètres du Tournoi" sub="Configurez les règles" />

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Users size={14} className="text-primary-light" /> Nombre d'équipes
                    </label>
                    <select
                      value={form.num_teams}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        set('num_teams', v);
                        set('num_groups', Math.min(parseInt(form.num_groups), v));
                        set('teams_per_group', Math.min(parseInt(form.teams_per_group), v));
                      }}
                      className="input-field !rounded-xl appearance-none cursor-pointer w-full"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 2).map(n => (
                        <option key={n} value={n}>{n} équipes</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Hash size={14} className="text-primary-light" /> Groupes
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, Math.floor(form.num_teams / 2))}
                        value={form.num_groups}
                        onChange={e => set('num_groups', Math.max(1, parseInt(e.target.value) || 1))}
                        className="input-field !rounded-xl w-full"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Users size={14} className="text-primary-light" /> Équipes / Groupe
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={form.num_teams}
                        value={form.teams_per_group}
                        onChange={e => set('teams_per_group', Math.max(2, parseInt(e.target.value) || 2))}
                        className="input-field !rounded-xl w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Clock size={14} className="text-primary-light" /> Durée du match (minutes)
                    </label>
                    <div className="flex items-center gap-3">
                      {[30, 45, 60, 75, 90].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => set('match_duration', d)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            form.match_duration === d
                              ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/20'
                              : 'bg-white/5 dark:bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                          }`}
                        >
                          {d}min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Award size={14} className="text-gold" /> Points
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="glass-card !rounded-xl p-3 text-center">
                        <span className="text-[10px] uppercase tracking-wider text-primary-light font-bold block mb-1">Victoire</span>
                        <input
                          type="number"
                          min={0}
                          value={form.points_win}
                          onChange={e => set('points_win', parseInt(e.target.value) || 0)}
                          className="w-full text-center text-xl font-extrabold bg-transparent outline-none text-dark-800 dark:text-white"
                        />
                      </div>
                      <div className="glass-card !rounded-xl p-3 text-center">
                        <span className="text-[10px] uppercase tracking-wider text-gold font-bold block mb-1">Nul</span>
                        <input
                          type="number"
                          min={0}
                          value={form.points_draw}
                          onChange={e => set('points_draw', parseInt(e.target.value) || 0)}
                          className="w-full text-center text-xl font-extrabold bg-transparent outline-none text-dark-800 dark:text-white"
                        />
                      </div>
                      <div className="glass-card !rounded-xl p-3 text-center">
                        <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold block mb-1">Défaite</span>
                        <input
                          type="number"
                          min={0}
                          value={form.points_loss}
                          onChange={e => set('points_loss', parseInt(e.target.value) || 0)}
                          className="w-full text-center text-xl font-extrabold bg-transparent outline-none text-dark-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 pt-2">
                  <StepTitle icon={Sparkles} label="Format du Tournoi" sub="Choisissez le format de compétition" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FORMATS.map(f => {
                      const Icon = f.icon;
                      const selected = form.format === f.id;
                      return (
                        <motion.button
                          key={f.id}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => set('format', f.id)}
                          className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                            selected
                              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                              : 'border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/8'
                          }`}
                        >
                          {selected && (
                            <motion.div
                              layoutId="format-check"
                              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center"
                            >
                              <CheckCircle size={14} className="text-white" />
                            </motion.div>
                          )}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3`}>
                            <Icon size={20} className="text-white" />
                          </div>
                          <h3 className="font-bold text-dark-800 dark:text-white text-sm">{f.label}</h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{f.desc}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5 pt-2">
                  <StepTitle icon={Calendar} label="Dates & Horaires" sub="Planifiez votre tournoi" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar size={14} className="text-primary-light" /> Date de début *
                      </label>
                      <input
                        type="date"
                        value={form.start_date}
                        onChange={e => set('start_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="input-field !rounded-xl w-full cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar size={14} className="text-gold" /> Date de fin *
                      </label>
                      <input
                        type="date"
                        value={form.end_date}
                        onChange={e => set('end_date', e.target.value)}
                        min={form.start_date || new Date().toISOString().split('T')[0]}
                        className="input-field !rounded-xl w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Clock size={14} className="text-primary-light" /> Heure de début des matches
                    </label>
                    <input
                      type="time"
                      value={form.match_start_time}
                      onChange={e => set('match_start_time', e.target.value)}
                      className="input-field !rounded-xl w-full cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <BarChart3 size={14} className="text-primary-light" /> Matches / jour max
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={form.daily_match_limit}
                        onChange={e => set('daily_match_limit', Math.max(1, parseInt(e.target.value) || 1))}
                        className="input-field !rounded-xl w-full"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Clock size={14} className="text-gold" /> Pause entre matches
                      </label>
                      <select
                        value={form.break_minutes}
                        onChange={e => set('break_minutes', parseInt(e.target.value))}
                        className="input-field !rounded-xl appearance-none cursor-pointer w-full"
                      >
                        {[5, 10, 15, 20, 30].map(m => (
                          <option key={m} value={m}>{m} minutes</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5 pt-2">
                  <StepTitle icon={Trophy} label="Résumé du Tournoi" sub="Vérifiez vos choix avant de créer" />

                  <div className="space-y-3">
                    <SummaryRow icon={Trophy} label="Nom" value={form.name} />
                    {form.description && <SummaryRow icon={FileText} label="Description" value={form.description} />}
                    <div className="grid grid-cols-2 gap-3">
                      <SummaryRow icon={MapPin} label="Ville" value={form.city} />
                      <SummaryRow icon={Star} label="Terrain" value={form.pitch_name} />
                    </div>

                    <div className="h-px bg-white/10 my-3" />

                    <div className="grid grid-cols-3 gap-3">
                      <SummaryRow icon={Users} label="Équipes" value={`${form.num_teams}`} />
                      <SummaryRow icon={Hash} label="Groupes" value={`${form.num_groups}`} />
                      <SummaryRow icon={Users} label="Par groupe" value={`${form.teams_per_group}`} />
                    </div>

                    <div className="h-px bg-white/10 my-3" />

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${FORMATS.find(f => f.id === form.format)?.color || 'from-primary to-primary-light'} flex items-center justify-center`}>
                        {React.createElement(FORMATS.find(f => f.id === form.format)?.icon || Shield, { size: 18, className: 'text-white' })}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block">Format</span>
                        <span className="text-sm font-bold text-dark-800 dark:text-white">{FORMATS.find(f => f.id === form.format)?.label}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <SummaryRow icon={Calendar} label="Début" value={form.start_date} />
                      <SummaryRow icon={Calendar} label="Fin" value={form.end_date} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <SummaryRow icon={Clock} label="Heure" value={form.match_start_time} />
                      <SummaryRow icon={BarChart3} label="Matchs/jour" value={`${form.daily_match_limit}`} />
                      <SummaryRow icon={Clock} label="Pause" value={`${form.break_minutes}min`} />
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20">
                      <Award size={20} className="text-gold flex-shrink-0" />
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-bold text-gold">{form.points_win}</span> pts victoire / <span className="font-bold text-gold">{form.points_draw}</span> pts nul / <span className="font-bold text-gold">{form.points_loss}</span> pts défaite
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer buttons */}
        <div className="px-8 py-5 border-t border-white/5">
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              >
                <ArrowLeft size={16} /> Retour
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                disabled={!canNext()}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-light shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              >
                Suivant <ArrowRight size={16} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-gold to-gold-light shadow-lg shadow-gold/25 disabled:opacity-60 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Création...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Générer le tournoi
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StepTitle({ icon: Icon, label, sub }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <h2 className="text-lg font-extrabold text-dark-800 dark:text-white">{label}</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
      <Icon size={16} className="text-primary-light flex-shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block">{label}</span>
        <span className="text-sm font-bold text-dark-800 dark:text-white truncate block">{value}</span>
      </div>
    </div>
  );
}
