import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import * as userService from '../services/userService';
import Toast from '../components/Toast';

function Parametres({ user, setUser }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        username: '', name: '', email: '', phone: '',
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!user) { navigate('/login'); return; }
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [user, navigate]);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '', name: user.name || '',
                email: user.email || '', phone: user.phone || '',
                currentPassword: '', newPassword: '', confirmPassword: ''
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSuccessMessage(''); setErrorMessage('');
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => /^[0-9]{10}$/.test(phone);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setErrorMessage(''); setSuccessMessage('');
        if (!formData.username.trim()) { setErrorMessage("Le nom d'utilisateur est requis"); return; }
        if (!formData.name.trim()) { setErrorMessage("Le nom complet est requis"); return; }
        if (!validateEmail(formData.email)) { setErrorMessage("L'adresse email n'est pas valide"); return; }
        if (formData.phone && !validatePhone(formData.phone)) { setErrorMessage("Le numéro de téléphone n'est pas valide (10 chiffres)"); return; }

        setIsSubmitting(true);
        try {
            const updatedUser = await userService.updateProfile({
                id: user.id, username: formData.username, name: formData.name,
                email: formData.email, phone: formData.phone
            });
            setUser(prev => ({
                ...prev, username: updatedUser.username, name: updatedUser.name,
                email: updatedUser.email, phone: updatedUser.phone
            }));
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...storedUser, username: updatedUser.username, name: updatedUser.name,
                email: updatedUser.email, phone: updatedUser.phone
            }));
            setSuccessMessage('Profil mis à jour avec succès !');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage(error.message || 'Erreur lors de la mise à jour du profil');
        } finally { setIsSubmitting(false); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setErrorMessage(''); setSuccessMessage('');
        if (!formData.currentPassword) { setErrorMessage('Le mot de passe actuel est requis'); return; }
        if (formData.newPassword.length < 6) { setErrorMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'); return; }
        if (formData.newPassword !== formData.confirmPassword) { setErrorMessage('Les mots de passe ne correspondent pas'); return; }

        setIsSubmitting(true);
        try {
            await userService.updatePassword({
                id: user.id, current_password: formData.currentPassword, new_password: formData.newPassword
            });
            setSuccessMessage('Mot de passe modifié avec succès !');
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage(error.message || 'Erreur lors de la modification du mot de passe');
        } finally { setIsSubmitting(false); }
    };

    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Chargement...</p>
                </motion.div>
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profil', emoji: '👤' },
        { id: 'security', label: 'Sécurité', emoji: '🔒' },
    ];

    return (
        <div className="w-full min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1.5 h-12 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full" />
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Paramètres</h1>
                            <p className="text-slate-400 mt-1 text-sm">Gérez vos informations personnelles</p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:w-56 flex-shrink-0">
                        <div className="glass-card rounded-2xl p-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <span className="text-base">{tab.emoji}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Main Content */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1">
                        <Toast message={successMessage} onClose={() => setSuccessMessage('')} />
                        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage('')} />

                        <div className="glass-card rounded-2xl p-6 sm:p-8">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                    <h2 className="text-xl font-bold text-white mb-6">Informations du profil</h2>
                                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nom d'utilisateur</label>
                                            <input
                                                type="text" name="username" value={formData.username} onChange={handleInputChange}
                                                placeholder="Votre nom d'utilisateur" required disabled={isSubmitting}
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nom complet</label>
                                            <input
                                                type="text" name="name" value={formData.name} onChange={handleInputChange}
                                                placeholder="Votre nom complet" required disabled={isSubmitting}
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                                            <input
                                                type="email" name="email" value={formData.email} onChange={handleInputChange}
                                                placeholder="Votre email" required disabled={isSubmitting}
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Téléphone</label>
                                            <input
                                                type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                                placeholder="0600000000" pattern="[0-9]{10}" disabled={isSubmitting}
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <button
                                            type="submit" disabled={isSubmitting}
                                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                                        >
                                            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                    <h2 className="text-xl font-bold text-white mb-6">Changer le mot de passe</h2>
                                    <form onSubmit={handlePasswordChange} className="space-y-5">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Mot de passe actuel</label>
                                            <input
                                                type="password" name="currentPassword" value={formData.currentPassword} onChange={handleInputChange}
                                                placeholder="••••••••" required disabled={isSubmitting}
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nouveau mot de passe</label>
                                            <input
                                                type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange}
                                                placeholder="••••••••" minLength="6" required disabled={isSubmitting}
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Confirmer le mot de passe</label>
                                            <input
                                                type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                                                placeholder="••••••••" minLength="6" required disabled={isSubmitting}
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <button
                                            type="submit" disabled={isSubmitting}
                                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                                        >
                                            {isSubmitting ? 'Modification en cours...' : 'Changer le mot de passe'}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Parametres;