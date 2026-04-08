import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, MapPin, Phone, Send, Inbox, 
    CheckCircle, XCircle, Trash2, Clock, 
    Loader2, MessageSquare, PhoneCall
} from 'lucide-react';
import * as contactService from '../services/contactService';
import LoginPrompt from './LoginPrompt';

function Contact({ user }) {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [contactMessages, setContactMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Load messages if admin
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
            setError('Impossible de charger les messages. Veuillez réessayer plus tard.');
        } finally {
            setLoading(false);
        }
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
            setError('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
            setConfirmationMessage('');
        } finally {
            setLoading(false);
            setTimeout(() => {
                setConfirmationMessage('');
                setError(null);
            }, 5000);
        }
    };
    
    const markAsRead = async (id) => {
        try {
            setLoading(true);
            await contactService.markContactMessageAsRead(id);
            setContactMessages(contactMessages.map(msg => msg.id === id ? { ...msg, read: true } : msg));
            setError(null);
        } catch (error) {
            setError('Impossible de marquer le message comme lu.');
        } finally {
            setLoading(false);
        }
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
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <LoginPrompt />;

    // Animations
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="w-full">
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                        <XCircle size={20} className="text-red-400" />
                        {error}
                    </motion.div>
                )}
                {confirmationMessage && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                        <CheckCircle size={20} className="text-emerald-400" />
                        {confirmationMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {user.role === 'admin' ? (
                // Admin View: Messages List
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <div className="mb-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2">
                            Boîte de Réception
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">Gérez les messages de vos clients.</p>
                    </div>

                    {loading && contactMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-emerald-500">
                            <Loader2 size={48} className="animate-spin mb-4" />
                            <p className="text-slate-600 dark:text-slate-400">Chargement des messages...</p>
                        </div>
                    ) : contactMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 rounded-3xl text-center">
                            <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Inbox size={48} className="text-slate-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucun message</h3>
                            <p className="text-slate-600 dark:text-slate-400">Vous n'avez reçu aucun message pour le moment.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {contactMessages.map(msg => (
                                <motion.div 
                                    key={msg.id} 
                                    variants={itemVariants}
                                    className={`bg-white dark:bg-[#121212] border ${!msg.read ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-black/5 dark:border-white/5'} rounded-2xl p-6 transition-all relative overflow-hidden`}
                                >
                                    {!msg.read && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>}
                                    
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className={`text-xl font-bold ${!msg.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {msg.subject}
                                                </h3>
                                                {!msg.read && (
                                                    <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Nouveau</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5"><Mail size={14} /> {msg.name} ({msg.email})</div>
                                                <div className="flex items-center gap-1.5"><Clock size={14} /> {new Date(msg.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!msg.read && (
                                                <button onClick={() => markAsRead(msg.id)} disabled={loading} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-medium flex items-center gap-2 transition-colors text-sm">
                                                    <CheckCircle size={16} /> Marquer lu
                                                </button>
                                            )}
                                            <button onClick={() => deleteMessage(msg.id)} disabled={loading} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium flex items-center gap-2 transition-colors text-sm">
                                                <Trash2 size={16} /> Supprimer
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {msg.message}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            ) : (
                // User View: Contact Form & Info
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-12">
                    <div className="text-center max-w-2xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-4">
                            Contactez-nous
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Notre équipe est là pour vous aider. N'hésitez pas à nous écrire pour toute question ou demande de réservation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Contact Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div variants={itemVariants} className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 rounded-3xl p-8 shadow-xl">
                                <div className="space-y-8">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Notre Adresse</h3>
                                            <p className="text-slate-600 dark:text-slate-400">Bab Tizimi<br />Meknès, Maroc</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-400">
                                            <PhoneCall size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Téléphone</h3>
                                            <a href="tel:+212612345678" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors mb-1">+212 6 12 34 56 78</a>
                                            <a href="tel:+212522334455" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">+212 5 22 33 44 55</a>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-400">
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Email</h3>
                                            <a href="mailto:contact@terrainsport.com" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors mb-1">contact@terrainsport.com</a>
                                            <a href="mailto:info@terrainsport.com" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">info@terrainsport.com</a>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-black/10 dark:border-white/10 my-8" />
                                
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">Suivez-nous</h3>
                                    <div className="flex justify-center gap-4">
                                        <a href="https://www.facebook.com/profile.php?id=100039464749957" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-slate-900 dark:text-white flex items-center justify-center transition-all">
                                            <i className="fab fa-facebook-f text-2xl"></i>
                                        </a>
                                        <a href="https://www.instagram.com/soufiane.aqq/" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F] hover:text-slate-900 dark:text-white flex items-center justify-center transition-all">
                                            <i className="fab fa-instagram text-2xl"></i>
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-3 space-y-6">
                            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                                
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                    <MessageSquare className="text-emerald-400" />
                                    Envoyez-nous un message
                                </h2>
                                
                                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom complet</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={loading} placeholder="Votre nom" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={loading} placeholder="Votre email" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sujet</label>
                                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} required disabled={loading} placeholder="Sujet de votre message" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                                        <textarea name="message" value={formData.message} onChange={handleChange} required disabled={loading} placeholder="Comment pouvons-nous vous aider ?" rows="5" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 resize-none"></textarea>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 group">
                                        {loading ? <><Loader2 size={20} className="animate-spin" /> Envoi en cours...</> : <><Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Envoyer le message</>}
                                    </button>
                                </form>
                            </motion.div>

                            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 rounded-3xl p-4 shadow-xl overflow-hidden h-64 relative">
                                <iframe 
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3311.788403964403!2d-5.570112485106394!3d33.89331013358611!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd9f8b321750f0f1%3A0x15146c8f9311c3df!2sBab%20Tizimi%2C%20Mekn%C3%A8s!5e0!3m2!1sfr!2sma!4v1621505845977!5m2!1sfr!2sma" 
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    allowFullScreen="" 
                                    loading="lazy" 
                                    title="Localisation de terrain à Meknès"
                                    className="rounded-2xl grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                                ></iframe>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default Contact;