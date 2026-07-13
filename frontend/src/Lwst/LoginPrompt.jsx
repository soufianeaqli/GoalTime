import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function LoginPrompt() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-md"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B6E4F]/20 via-transparent to-emerald-500/10 rounded-3xl blur-xl pointer-events-none" />

                <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-10 sm:p-12 text-center overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#0B6E4F]/10 blur-[60px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg shadow-black/20">
                            <img src="/logo.jpg" alt="GoalTime" className="w-full h-full object-cover" />
                        </div>

                        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">Accès Restreint</h2>
                        <p className="text-sm text-white/40 mb-8 leading-relaxed">
                            Connectez-vous pour accéder à cette page.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0B6E4F] to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white text-sm font-bold transition-all duration-300 shadow-lg shadow-[#0B6E4F]/20 hover:shadow-[#0B6E4F]/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Se connecter
                                <span className="text-base">→</span>
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3.5 px-6 rounded-2xl border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.12] text-sm font-medium transition-all duration-300"
                            >
                                Retour
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default LoginPrompt;
