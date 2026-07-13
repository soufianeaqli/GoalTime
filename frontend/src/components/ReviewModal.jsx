import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import StarRating from './StarRating';

export default function ReviewModal({ isOpen, onClose, onSubmit, playerName, matchTitle }) {
  const [form, setForm] = useState({
    attended: true,
    punctuality_rating: 5,
    paid: true,
    fair_play_rating: 5,
    communication_rating: 5,
    would_play_again: 'definitely',
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(form);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({
          attended: true, punctuality_rating: 5, paid: true,
          fair_play_rating: 5, communication_rating: 5,
          would_play_again: 'definitely', comment: '',
        });
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg glass-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {submitted ? (
            <div className="py-16 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <CheckCircle size={64} className="text-emerald-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-1">Merci !</h3>
              <p className="text-sm text-slate-400">Votre évaluation a été envoyée.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Évaluer {playerName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{matchTitle}</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <ToggleRow
                  label="Le joueur a-t-il assisté au match ?"
                  value={form.attended}
                  onChange={v => setForm(f => ({ ...f, attended: v }))}
                  activeLabel="Oui"
                  inactiveLabel="Non"
                />

                <StarRating
                  label="Ponctualité"
                  value={form.punctuality_rating}
                  onChange={v => setForm(f => ({ ...f, punctuality_rating: v }))}
                />

                <ToggleRow
                  label="Le joueur a-t-il payé sa part ?"
                  value={form.paid}
                  onChange={v => setForm(f => ({ ...f, paid: v }))}
                  activeLabel="Oui"
                  inactiveLabel="Non"
                />

                <StarRating
                  label="Fair Play"
                  value={form.fair_play_rating}
                  onChange={v => setForm(f => ({ ...f, fair_play_rating: v }))}
                />

                <StarRating
                  label="Communication"
                  value={form.communication_rating}
                  onChange={v => setForm(f => ({ ...f, communication_rating: v }))}
                />

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-400">Rejoueriez-vous avec ce joueur ?</span>
                  <div className="flex gap-2">
                    {[
                      { value: 'definitely', label: 'Définitivement', icon: '💪', color: 'from-emerald-500 to-emerald-600' },
                      { value: 'maybe', label: 'Peut-être', icon: '🤔', color: 'from-white/10 to-white/5' },
                      { value: 'no', label: 'Non', icon: '👎', color: 'from-red-500/20 to-red-500/10' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, would_play_again: opt.value }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200
                          ${form.would_play_again === opt.value
                            ? `bg-gradient-to-r ${opt.color} text-white shadow-lg ring-1 ring-white/20`
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                      >
                        <span className="block text-base mb-0.5">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-400">Commentaire (optionnel)</span>
                  <textarea
                    value={form.comment}
                    onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Excellent joueur, très fair-play..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
                >
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ToggleRow({ label, value, onChange, activeLabel, inactiveLabel }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <div className="flex bg-white/5 rounded-xl overflow-hidden">
        <button
          onClick={() => onChange(true)}
          className={`px-3 py-1.5 text-xs font-bold transition-all ${
            value ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {activeLabel}
        </button>
        <button
          onClick={() => onChange(false)}
          className={`px-3 py-1.5 text-xs font-bold transition-all ${
            !value ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {inactiveLabel}
        </button>
      </div>
    </div>
  );
}
