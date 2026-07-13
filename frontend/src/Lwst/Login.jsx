import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as authService from '../services/authService';
import { API_BASE_URL } from '../services/config';
import FootballHero from '../components/auth/FootballHero';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';
import PasswordField from '../components/auth/PasswordField';
import SocialButton, { GoogleIcon } from '../components/auth/SocialButton';
import AuthCheckbox from '../components/auth/AuthCheckbox';
import AuthDivider from '../components/auth/AuthDivider';

const Icons = {
    user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    pen: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    lock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

export default function Login({ setUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        document.title = isLogin ? 'Connexion | GoalTime' : 'Inscription | GoalTime';
        return () => { document.title = 'GoalTime'; };
    }, [isLogin]);

    useEffect(() => {
        const googleError = searchParams.get('error');
        if (googleError) {
            const messages = {
                'google_no_email': 'Impossible de récupérer votre email Google.',
                'google_failed': 'La connexion avec Google a échoué.',
                'google_parse_error': 'Erreur lors du traitement des données Google.',
            };
            setError(messages[googleError] || 'Erreur lors de la connexion Google.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        try {
            if (isLogin) {
                const data = await authService.login({ username, password });
                setUser(data);
                setSuccess('Connexion réussie !');
                setTimeout(() => navigate('/accueil'), 1200);
            } else {
                if (!acceptTerms) { setError('Veuillez accepter les conditions d\'utilisation.'); setLoading(false); return; }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email invalide.'); setLoading(false); return; }
                if (!/^[0-9]{10}$/.test(phone)) { setError('Téléphone invalide (10 chiffres).'); setLoading(false); return; }
                if (password.length < 6) { setError('Mot de passe minimum 6 caractères.'); setLoading(false); return; }

                const data = await authService.register({ name, username, email, password, phone });
                setUser(data);
                setSuccess('Compte créé avec succès !');
                setTimeout(() => navigate('/accueil'), 1200);
            }
        } catch (err) {
            setError(err.message || 'Erreur');
        } finally { setLoading(false); }
    };

    const checkUsername = async (value) => {
        if (value.length < 3 || isLogin) return;
        try {
            const ok = await authService.checkUsernameAvailable(value);
            if (!ok) setError("Ce nom d'utilisateur existe déjà.");
            else setError('');
        } catch {}
    };

    useEffect(() => {
        if (!isLogin && username.length >= 3) {
            const t = setTimeout(() => checkUsername(username), 500);
            return () => clearTimeout(t);
        }
    }, [username, isLogin]);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(''); setSuccess('');
        setUsername(''); setPassword(''); setName(''); setEmail(''); setPhone('');
        setPosition(''); setCity(''); setSkillLevel(''); setAcceptTerms(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* ═══ LEFT PANEL: Football Hero ═══ */}
            <div className="hidden lg:block lg:w-[55%] relative">
                <FootballHero isLogin={isLogin} />
            </div>

            {/* ═══ RIGHT PANEL: Auth Form ═══ */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative overflow-y-auto">
                {/* Ambient glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#0B6E4F]/[0.04] rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-[420px] relative z-10 my-4">

                    {/* Mobile Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:hidden text-center mb-8"
                    >
                        <div className="w-12 h-12 rounded-2xl overflow-hidden mx-auto mb-3 shadow-lg shadow-[#0B6E4F]/30">
                            <img src="/logo.jpg" alt="GoalTime" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">
                            <span className="font-extrabold">Goal</span><span className="font-light opacity-40">Time</span>
                        </span>
                    </motion.div>

                    {/* Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-[28px] bg-white/[0.04] backdrop-blur-[40px] border border-white/[0.06] p-7 sm:p-9 shadow-[0_32px_64px_rgba(0,0,0,0.3)] relative overflow-hidden"
                    >
                        {/* Top glow line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[#0B6E4F]/30 to-transparent" />

                        {/* Header */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? 'h-login' : 'h-register'}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3 }}
                                className="mb-7"
                            >
                                <h2 className="text-[22px] font-bold text-white mb-1">
                                    {isLogin ? 'Connexion' : 'Créer un compte'}
                                </h2>
                                <p className="text-[13px] text-white/30">
                                    {isLogin ? 'Entrez vos identifiants pour continuer' : 'Rejoignez la communauté GoalTime'}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Error / Success */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                                    <div className="px-4 py-3 rounded-2xl bg-red-500/[0.08] border border-red-500/20 text-[13px] text-red-400 text-center">{error}</div>
                                </motion.div>
                            )}
                            {success && (
                                <motion.div key="ok" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                                    <div className="px-4 py-3 rounded-2xl bg-[#0B6E4F]/[0.08] border border-[#0B6E4F]/20 text-[13px] text-emerald-400 text-center">{success}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ═══ FORM ═══ */}
                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {/* Common fields */}
                            <AuthInput
                                label="Identifiant"
                                icon={Icons.user}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="votre_identifiant"
                            />

                            <AnimatePresence>
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.35 }}
                                        className="space-y-3.5 overflow-hidden"
                                    >
                                        <AuthInput
                                            label="Nom complet"
                                            icon={Icons.pen}
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required={!isLogin}
                                            disabled={loading}
                                            placeholder="Jean Dupont"
                                        />
                                        <AuthInput
                                            label="Email"
                                            icon={Icons.mail}
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required={!isLogin}
                                            disabled={loading}
                                            placeholder="exemple@email.com"
                                        />
                                        <AuthInput
                                            label="Téléphone"
                                            icon={Icons.phone}
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required={!isLogin}
                                            disabled={loading}
                                            placeholder="0600000000"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <PasswordField
                                label="Mot de passe"
                                icon={Icons.lock}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="••••••••"
                            />

                            {/* Remember me / Forgot password */}
                            {isLogin && (
                                <div className="flex items-center justify-between pt-0.5">
                                    <AuthCheckbox
                                        checked={rememberMe}
                                        onChange={() => setRememberMe(!rememberMe)}
                                        label="Se souvenir"
                                    />
                                    <button type="button" className="text-[12px] text-[#0B6E4F] hover:text-emerald-400 transition-colors">
                                        Mot de passe oublié ?
                                    </button>
                                </div>
                            )}

                            {/* Accept terms (register only) */}
                            {!isLogin && (
                                <div className="pt-1">
                                    <AuthCheckbox
                                        checked={acceptTerms}
                                        onChange={() => setAcceptTerms(!acceptTerms)}
                                        label={<span>J'accepte les <button type="button" className="underline text-[#0B6E4F] hover:text-emerald-400">conditions</button></span>}
                                    />
                                </div>
                            )}

                            <div className="pt-1">
                                <AuthButton type="submit" disabled={loading} loading={loading}>
                                    {isLogin ? 'Se connecter' : 'Créer le compte'}
                                </AuthButton>
                            </div>
                        </form>

                        {/* Social login (login only) */}
                        {isLogin && (
                            <>
                                <AuthDivider />
                                <SocialButton
                                    provider="google"
                                    href={`${API_BASE_URL.replace('/api', '')}/auth/google/redirect`}
                                    icon={<GoogleIcon />}
                                >
                                    Continuer avec Google
                                </SocialButton>
                            </>
                        )}

                        {/* Toggle */}
                        <div className="mt-6 text-center">
                            <p className="text-[12px] text-white/20">
                                {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                            </p>
                            <button onClick={toggleMode} type="button" className="mt-1 text-[13px] font-semibold text-[#0B6E4F] hover:text-emerald-400 transition-colors">
                                {isLogin ? "Créer un compte" : "Se connecter"}
                            </button>
                        </div>
                    </motion.div>

                    {/* Terms */}
                    <p className="text-center text-[10px] text-white/10 mt-5 leading-relaxed">
                        En continuant, vous acceptez les conditions d'utilisation<br />et la politique de confidentialité de GoalTime.
                    </p>
                </div>
            </div>
        </div>
    );
}
