import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/Avatar';
import { ReputationBadgeInline } from '../components/ReputationBadge';
import { reputationService } from '../services/reputationService';

const navLinks = [
  { path: '/accueil', label: 'Accueil' },
  { path: '/terrain', label: 'Terrains' },
  { path: '/annonces', label: 'Joueurs' },
  { path: '/tournoi-smart', label: 'Tournois' },
  { path: '/reservation', label: 'Réservations', auth: true },
  { path: '/contact', label: 'Contact' },
];

export default function Header({ user, logout }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [reputationScore, setReputationScore] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenu(false); }, [location]);

  useEffect(() => {
    if (!user) return;
    const loadRep = async () => {
      try {
        const data = await reputationService.getReputation(user.id);
        if (data?.reputation) setReputationScore(data.reputation.score);
      } catch (e) {}
    };
    loadRep();
  }, [user]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleLogout = () => { logout(); setUserMenu(false); setShowLogoutConfirm(false); navigate('/login'); };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? 'py-3' : 'py-5'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className={`flex items-center justify-between h-14 px-6 rounded-full transition-all duration-700 ${isScrolled ? 'bg-black/60 backdrop-blur-2xl border border-white/[0.06]' : 'bg-transparent'}`}>

            {/* Logo */}
            <Link to="/accueil" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/[0.08]">
                <img src="/logo.jpg" alt="GoalTime" className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-lg tracking-tight">
                <span className="font-extrabold">Goal</span><span className="font-light opacity-60">Time</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.filter(l => !l.auth || user).map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'text-white bg-white/[0.08]'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenu(!userMenu)}
                    className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-white/[0.06] transition-all duration-300"
                  >
                    <Avatar name={user.username || user.name} size="sm" />
                    <span className="hidden sm:block text-[13px] font-medium text-white/70 max-w-[90px] truncate">{user.username}</span>
                    {reputationScore !== null && (
                      <ReputationBadgeInline score={reputationScore} size="xs" />
                    )}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-white/30 transition-transform duration-300 ${userMenu ? 'rotate-180' : ''}`}>
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <AnimatePresence>
                    {userMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-[#111] border border-white/[0.08] shadow-2xl shadow-black/50 py-2 z-50"
                        >
                          <div className="px-4 py-3 border-b border-white/[0.06]">
                            <p className="text-sm font-semibold text-white">{user.username}</p>
                            <p className="text-xs text-white/40 mt-0.5">{user.email}</p>
                            {reputationScore !== null && (
                              <div className="mt-2">
                                <ReputationBadgeInline score={reputationScore} size="xs" />
                              </div>
                            )}
                          </div>
                          <div className="py-1">
                            <Link to={`/profil/${user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                              Mon profil
                            </Link>
                            <Link to="/parametres" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                              Paramètres
                            </Link>
                            <Link to="/annonces/mes" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                              Mes annonces
                            </Link>
                            {user.role === 'admin' && (
                              <Link to="/reservation" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                                Admin
                              </Link>
                            )}
                          </div>
                          <div className="border-t border-white/[0.06] pt-1">
                            <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors">
                              Déconnexion
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="btn-primary !py-2 !px-5 !text-xs">
                  Connexion
                </Link>
              )}

              {/* Mobile Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-white/[0.06] transition-colors"
              >
                {mobileOpen ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 5L15 15M15 5L5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 6H17M3 10H17M3 14H17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-[#0a0a0a] border-l border-white/[0.06] z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-10">
                  <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="p-2 rounded-full hover:bg-white/[0.06]">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 4L14 14M14 4L4 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <nav className="space-y-1">
                  {navLinks.filter(l => !l.auth || user).map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                        isActive(link.path) ? 'text-white bg-white/[0.06]' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
                      }`}
                    >
                      {link.label}
                      <span className="text-white/20 text-xs">→</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-[360px] rounded-2xl bg-[#111] border border-white/[0.08] shadow-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <h3 className="text-white font-semibold text-base mb-1">Déconnexion</h3>
              <p className="text-white/40 text-sm mb-6">Voulez-vous vraiment vous déconnecter ?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}