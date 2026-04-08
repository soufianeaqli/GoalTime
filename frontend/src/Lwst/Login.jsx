import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Phone, LogIn, UserPlus, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import * as authService from '../services/authService';

function Login({ setUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [userData, setUserData] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        document.title = isLogin ? 'Connexion | GoalTime' : 'Inscription | GoalTime';
        return () => { document.title = 'GoalTime'; };
    }, [isLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isLogin) {
                const data = await authService.login({ username, password });
                setUser(data);
                setUserData(data);
                
                if (data.role === 'admin') {
                    setSuccess(`Connexion administrateur réussie ! Bienvenue ${data.username}`);
                } else {
                    setSuccess('Connexion réussie !');
                }

                setTimeout(() => navigate('/accueil'), 2000);
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    setError('Veuillez entrer une adresse email valide.');
                    setLoading(false);
                    return;
                }

                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(phone)) {
                    setError('Veuillez entrer un numéro de téléphone valide (10 chiffres).');
                    setLoading(false);
                    return;
                }

                if (password.length < 6) {
                    setError('Le mot de passe doit contenir au moins 6 caractères.');
                    setLoading(false);
                    return;
                }

                const data = await authService.register({ name, username, email, password, phone });
                setUser(data);
                setUserData(data);
                setSuccess('Compte créé avec succès !');

                setTimeout(() => navigate('/accueil'), 2000);
            }
        } catch (error) {
            setError(error.message || (isLogin ? 'Échec de la connexion' : 'Échec de l\'inscription'));
        } finally {
            setLoading(false);
        }
    };

    const checkUsername = async (value) => {
        if (value.length < 3) return;
        try {
            const isAvailable = await authService.checkUsernameAvailable(value);
            if (!isAvailable && !isLogin) {
                setError('Ce nom d\'utilisateur existe déjà.');
            } else {
                setError('');
            }
        } catch (error) {}
    };

    useEffect(() => {
        if (!isLogin && username.length >= 3) {
            const timer = setTimeout(() => { checkUsername(username); }, 500);
            return () => clearTimeout(timer);
        }
    }, [username, isLogin]);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccess('');
        setUsername('');
        setPassword('');
        setName('');
        setEmail('');
        setPhone('');
    };

    // Variants for fluid height animation
    const contentVariants = {
        hidden: { opacity: 0, height: 0, overflow: 'hidden' },
        visible: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' } }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative"
            >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
                
                <div className="bg-white dark:bg-[#121212]/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Top Decorative Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 text-emerald-400">
                            {isLogin ? <ShieldCheck size={32} /> : <UserPlus size={32} />}
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{isLogin ? 'Bienvenue' : 'Créer un compte'}</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            {isLogin ? 'Entrez vos identifiants pour continuer' : 'Rejoignez la compétition dès maintenant'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 text-sm">
                                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                        {success && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm ${userData?.role === 'admin' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : ''}`}>
                                <ShieldCheck size={18} />
                                <span>{success}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Identifiant</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-3.5 text-slate-600 dark:text-slate-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="Votre identifiant"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {!isLogin && (
                                <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Nom complet</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-4 top-3.5 text-slate-600 dark:text-slate-400" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required={!isLogin}
                                                disabled={loading}
                                                className="w-full bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                                placeholder="Jean Dupont"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-4 top-3.5 text-slate-600 dark:text-slate-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required={!isLogin}
                                                disabled={loading}
                                                className="w-full bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                                placeholder="exemple@email.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Téléphone</label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-4 top-3.5 text-slate-600 dark:text-slate-400" />
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                required={!isLogin}
                                                disabled={loading}
                                                className="w-full bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                                placeholder="0600000000"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Mot de passe</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-3.5 text-slate-600 dark:text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3.5 mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-70"
                        >
                            {loading ? (
                                <><Loader2 size={20} className="animate-spin" /> {isLogin ? 'Connexion...' : 'Création du compte...'}</>
                            ) : isLogin ? (
                                <><LogIn size={20} /> Se connecter</>
                            ) : (
                                <><UserPlus size={20} /> Créer le compte</>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-slate-600 dark:text-slate-400 border-t border-black/5 dark:border-white/5 pt-6">
                        <p className="text-sm">
                            {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
                        </p>
                        <button 
                            onClick={toggleMode}
                            type="button"
                            className="mt-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                        >
                            {isLogin ? "Inscrivez-vous maintenant" : "Connectez-vous à votre compte"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default Login;