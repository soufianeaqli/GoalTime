import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MapPin, Phone, Send, Inbox, CheckCircle, Trash2, Clock } from 'lucide-react';
import * as contactService from '../services/contactService';
import LoginPrompt from './LoginPrompt';
import Toast from '../components/Toast';

function Contact({ user }) {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [contactMessages, setContactMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user && user.role === 'admin') fetchMessages();
    }, [user]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const messages = await contactService.getContactMessages();
            setContactMessages(messages);
            setError(null);
        } catch (error) {
            setError('Impossible de charger les messages.');
        } finally { setLoading(false); }
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await contactService.sendContactMessage(formData);
            setConfirmationMessage('Votre message a été envoyé avec succès !');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setError(null);
        } catch (error) {
            setError("Une erreur est survenue lors de l'envoi.");
            setConfirmationMessage('');
        } finally {
            setLoading(false);
            setTimeout(() => { setConfirmationMessage(''); setError(null); }, 5000);
        }
    };

    const markAsRead = async (id) => {
        try {
            setLoading(true);
            await contactService.markContactMessageAsRead(id);
            setContactMessages(contactMessages.map(msg => msg.id === id ? { ...msg, read: true } : msg));
            setError(null);
        } catch (error) { setError('Impossible de marquer le message comme lu.'); }
        finally { setLoading(false); }
    };

    const deleteMessage = async (id) => {
        try {
            setLoading(true);
            await contactService.deleteContactMessage(id);
            setContactMessages(contactMessages.filter(msg => msg.id !== id));
            setConfirmationMessage('Message supprimé.');
            setError(null);
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            setError('Impossible de supprimer le message.');
            setTimeout(() => setError(null), 3000);
        } finally { setLoading(false); }
    };

    if (!user) return <LoginPrompt />;

    const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50";

    return (
        <div className="w-full min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6">
                            <Toast message={error} type="error" onClose={() => setError('')} />
                        </motion.div>
                    )}
                    {confirmationMessage && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6">
                            <Toast message={confirmationMessage} onClose={() => setConfirmationMessage('')} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {user.role === 'admin' ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-12 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full" />
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Boîte de Réception</h1>
                                <p className="text-slate-400 mt-1 text-sm">Gérez les messages de vos clients</p>
                            </div>
                        </div>

                        {loading && contactMessages.length === 0 ? (
                            <div className="glass-card rounded-2xl flex flex-col items-center justify-center p-12">
                                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                                <p className="text-slate-400 text-sm">Chargement des messages...</p>
                            </div>
                        ) : contactMessages.length === 0 ? (
                            <div className="glass-card rounded-2xl flex flex-col items-center justify-center p-16 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5">
                                    <span className="text-3xl">📭</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Aucun message</h3>
                                <p className="text-sm text-slate-400">Vous n'avez reçu aucun message pour le moment</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {contactMessages.map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`glass-card rounded-2xl p-5 transition-all relative overflow-hidden ${!msg.read ? 'border-emerald-500/30' : ''}`}
                                    >
                                        {!msg.read && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-r" />}

                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <h3 className={`text-base font-bold ${!msg.read ? 'text-white' : 'text-slate-300'}`}>
                                                        {msg.subject}
                                                    </h3>
                                                    {!msg.read && (
                                                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Nouveau</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1"><Mail size={12} /> {msg.name} ({msg.email})</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(msg.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {!msg.read && (
                                                    <button onClick={() => markAsRead(msg.id)} disabled={loading} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1.5 transition-colors">
                                                        <CheckCircle size={13} /> Marquer lu
                                                    </button>
                                                )}
                                                <button onClick={() => deleteMessage(msg.id)} disabled={loading} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium flex items-center gap-1.5 transition-colors">
                                                    <Trash2 size={13} /> Supprimer
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] p-4 rounded-xl text-sm text-slate-300 leading-relaxed whitespace-pre-wrap border border-white/5">
                                            {msg.message}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-12 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full" />
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Contactez-nous</h1>
                                <p className="text-slate-400 mt-1 text-sm">Notre équipe est là pour vous aider.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Contact Info */}
                            <div className="lg:col-span-2 space-y-4">
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                                <MapPin size={20} className="text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white mb-0.5">Adresse</h3>
                                                <p className="text-sm text-slate-400">Bab Tizimi<br />Meknès, Maroc</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                                                <Phone size={20} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white mb-0.5">Téléphone</h3>
                                                <a href="tel:+212679224411" className="block text-sm text-slate-400 hover:text-emerald-400 transition-colors">+212 6 79224411</a>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                                <Mail size={20} className="text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white mb-0.5">Email</h3>
                                                <a href="mailto:soufianeaqli20@gmail.com" className="block text-sm text-slate-400 hover:text-emerald-400 transition-colors">soufianeaqli20@gmail.com</a>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-white/5 my-6" />

                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-3 text-center">Suivez-nous</h3>
                                        <div className="flex justify-center gap-3">
                                            <a href="https://www.facebook.com/profile.php?id=100039464749957" target="_blank" rel="noreferrer"
                                                className="w-10 h-10 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white flex items-center justify-center transition-all">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                            </a>
                                            <a href="https://www.instagram.com/soufiane.aqq/" target="_blank" rel="noreferrer"
                                                className="w-10 h-10 rounded-xl bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F] hover:text-white flex items-center justify-center transition-all">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Contact Form */}
                            <div className="lg:col-span-3 space-y-4">
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

                                    <h2 className="text-lg font-bold text-white mb-5 relative z-10">
                                        ✉️ Envoyez-nous un message
                                    </h2>

                                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nom complet</label>
                                                <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={loading} placeholder="Votre nom" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                                                <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={loading} placeholder="Votre email" className={inputClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Sujet</label>
                                            <input type="text" name="subject" value={formData.subject} onChange={handleChange} required disabled={loading} placeholder="Sujet du message" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Message</label>
                                            <textarea name="message" value={formData.message} onChange={handleChange} required disabled={loading} placeholder="Comment pouvons-nous vous aider ?" rows="5" className={`${inputClass} resize-none`} />
                                        </div>
                                        <button
                                            type="submit" disabled={loading}
                                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                                        >
                                            {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                                        </button>
                                    </form>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-3 overflow-hidden h-56 relative">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3311.788403964403!2d-5.570112485106394!3d33.89331013358611!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd9f8b321750f0f1%3A0x15146c8f9311c3df!2sBab%20Tizimi%2C%20Mekn%C3%A8s!5e0!3m2!1sfr!2sma!4v1621505845977!5m2!1sfr!2sma"
                                        width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"
                                        title="Localisation"
                                        className="rounded-xl grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Contact;