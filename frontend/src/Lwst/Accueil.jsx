import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, CalendarClock, ArrowRight } from 'lucide-react';

function Accueil({ user }) {
    // Variants for stagger animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 10 }
        }
    };

    return (
        <div className="min-h-[85vh] flex flex-col justify-center items-center text-center px-4">
            
            <motion.div 
                className="max-w-4xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Badge */}
                <motion.div variants={itemVariants} className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
                        <Trophy size={16} />
                        L'expérience Ultimate du Mini-Foot
                    </div>
                </motion.div>

                {/* Main Heading */}
                <motion.h1 
                    variants={itemVariants}
                    className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight"
                >
                    Jouez sur les meilleurs terrains, <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500">
                        sans compromis.
                    </span>
                </motion.h1>

                {/* Description */}
                <motion.p 
                    variants={itemVariants}
                    className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed"
                >
                    Profitez de nos infrastructures premium pour vos matchs entre amis ou en compétition. 
                    Réservation simple, instantanée et disponibilité en temps réel.
                </motion.p>

                {/* Call to Actions */}
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row justify-center gap-4"
                >
                    <Link to={'/terrain'}>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                        >
                            <CalendarClock size={22} />
                            {user?.role === 'admin' ? 'Gérer les Terrains' : 'Réserver Maintenant'}
                        </motion.button>
                    </Link>
                    
                    <Link to={'/tournoi'}>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-semibold text-lg backdrop-blur-sm transition-all"
                        >
                            Voir les Tournois
                            <ArrowRight size={20} className="text-slate-600 dark:text-slate-400" />
                        </motion.button>
                    </Link>
                </motion.div>
                
                {/* Small Stats / Info */}
                <motion.div 
                    variants={itemVariants}
                    className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-black/10 dark:border-white/10 pt-8"
                >
                    {[
                        { label: "Terrains 5v5 & 7v7", value: "Premium" },
                        { label: "Ouvert tous les jours", value: "24/7" },
                        { label: "Joueurs Actifs", value: "10,000+" },
                        { label: "Tournois Mensuels", value: "5+" }
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>
                
            </motion.div>
        </div>
    );
}

export default Accueil;