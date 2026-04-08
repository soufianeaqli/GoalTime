import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, Menu, X, ChevronDown, Sun, Moon } from 'lucide-react';

function Header({ user, logout, isDarkMode, toggleTheme }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = () => {
        setIsLogoutModalOpen(false);
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

    const navLinks = [
        { path: '/accueil', label: 'Accueil' },
        { path: '/terrain', label: 'Terrains' },
        { path: '/tournoi', label: 'Tournois' },
        { path: '/reservation', label: 'Réservations' },
        { path: '/contact', label: 'Contact' },
    ];

    return (
        <header 
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                scrolled ? 'bg-black/70 backdrop-blur-md shadow-lg border-b border-black/5 dark:border-white/5 py-3' : 'bg-transparent py-5'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                <span className="text-slate-900 dark:text-white font-bold text-xl">G</span>
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors duration-300">
                                Goal<span className="text-emerald-400 font-light">Time</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-1">
                        {navLinks.map((link) => {
                            const isActive = location.pathname.startsWith(link.path);
                            return (
                                <Link 
                                    key={link.path} 
                                    to={link.path}
                                    className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
                                >
                                    <span className={`relative z-10 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white'}`}>
                                        {link.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute inset-0 bg-black/10 dark:bg-white/10 rounded-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Profile / Auth Area */}
                    <div className="hidden md:flex items-center">
                        {user ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 transition-all duration-200"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 dark:text-white font-semibold text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                                        {getInitials(user.username)}
                                    </div>
                                    <span className="text-sm font-medium text-slate-200">{user.username}</span>
                                    <ChevronDown size={14} className={`text-slate-600 dark:text-slate-400 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isProfileMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-3 w-56 rounded-xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden py-1"
                                        >
                                            <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name || user.username}</p>
                                                <p className="text-xs text-emerald-400 font-medium capitalize mt-0.5">{user.role}</p>
                                            </div>
                                            
                                            <Link 
                                                to="/parametres" 
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            >
                                                <Settings size={16} /> Mon Compte
                                            </Link>
                                            
                                            <div className="border-t border-black/5 dark:border-white/5 my-1"></div>
                                            
                                            <button 
                                                onClick={() => setIsLogoutModalOpen(true)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                                            >
                                                <LogOut size={16} /> Déconnexion
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-900 dark:text-white px-5 py-2 rounded-full font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                                >
                                    <User size={16} /> Connexion
                                </motion.button>
                            </Link>
                        )}

                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            className="ml-4 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/10 dark:border-white/10"
                            aria-label="Toggle Dark Mode"
                        >
                            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden overflow-hidden bg-black/95 backdrop-blur-xl border-b border-black/10 dark:border-white/10"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`block px-3 py-3 rounded-lg text-base font-medium ${
                                        location.pathname.startsWith(link.path) 
                                            ? 'bg-emerald-500/10 text-emerald-400' 
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 hover:text-slate-900 dark:text-white'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            
                            <div className="pt-4 border-t border-black/10 dark:border-white/10 mt-2">
                                {/* Mobile Theme Toggle */}
                                <button 
                                    onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-3 mb-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 hover:text-slate-900 dark:text-white"
                                >
                                    {isDarkMode ? <><Sun size={18} className="text-amber-400" /> Mode Clair</> : <><Moon size={18} className="text-slate-700" /> Mode Sombre</>}
                                </button>
                                
                                {user ? (
                                    <>
                                        <div className="flex items-center gap-3 px-3 py-2 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 dark:text-white font-bold">
                                                {getInitials(user.username)}
                                            </div>
                                            <div>
                                                <p className="text-slate-900 dark:text-white font-medium">{user.username}</p>
                                                <p className="text-emerald-400 text-xs">{user.role}</p>
                                            </div>
                                        </div>
                                        <Link
                                            to="/parametres"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 hover:text-slate-900 dark:text-white"
                                        >
                                            <Settings size={18} /> Paramètres
                                        </Link>
                                        <button
                                            onClick={() => setIsLogoutModalOpen(true)}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10"
                                        >
                                            <LogOut size={18} /> Déconnexion
                                        </button>
                                    </>
                                ) : (
                                    <Link 
                                        to="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-slate-900 dark:text-white px-4 py-3 rounded-xl font-medium mt-2"
                                    >
                                        <User size={18} /> Se Connecter
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {isLogoutModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsLogoutModalOpen(false)}
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-5 mx-auto">
                                <LogOut size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Déconnexion</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-center mb-8">Êtes-vous sûr de vouloir vous déconnecter de votre compte ?</p>
                            
                            <div className="flex gap-3">
                                <button 
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors font-medium"
                                    onClick={() => setIsLogoutModalOpen(false)}
                                >
                                    Annuler
                                </button>
                                <button 
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white transition-colors font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                    onClick={handleLogout}
                                >
                                    Déconnexion
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </header>
    );
}

export default Header;
