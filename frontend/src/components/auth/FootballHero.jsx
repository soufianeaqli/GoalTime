import { motion } from 'framer-motion';

const floatingCards = [
    {
        iconImg: '/logo.jpg',
        title: 'Prochain Match',
        subtitle: 'Aujourd\'hui 19:00',
        color: 'from-[#0B6E4F]/20 to-[#0B6E4F]/5',
        border: 'border-[#0B6E4F]/20',
        delay: 0,
    },
    {
        icon: '🏟️',
        title: 'Terrains Disponibles',
        subtitle: '8 terrains libres',
        color: 'from-emerald-500/20 to-emerald-500/5',
        border: 'border-emerald-500/20',
        delay: 0.15,
    },
    {
        icon: '👥',
        title: 'Joueurs Actifs',
        subtitle: '2,500+ joueurs',
        color: 'from-green-600/20 to-green-600/5',
        border: 'border-green-600/20',
        delay: 0.3,
    },
    {
        icon: '🏆',
        title: 'Tournois',
        subtitle: '3 tournois en cours',
        color: 'from-emerald-400/20 to-emerald-400/5',
        border: 'border-emerald-400/20',
        delay: 0.45,
    },
];

function FieldLines() {
    return (
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer boundary */}
            <rect x="40" y="40" width="520" height="720" rx="8" stroke="white" strokeWidth="2"/>
            {/* Center line */}
            <line x1="40" y1="400" x2="560" y2="400" stroke="white" strokeWidth="2"/>
            {/* Center circle */}
            <circle cx="300" cy="400" r="80" stroke="white" strokeWidth="2"/>
            <circle cx="300" cy="400" r="4" fill="white"/>
            {/* Top penalty area */}
            <rect x="160" y="40" width="280" height="120" rx="4" stroke="white" strokeWidth="2"/>
            <rect x="220" y="40" width="160" height="50" rx="4" stroke="white" strokeWidth="2"/>
            <circle cx="300" cy="130" r="4" fill="white"/>
            {/* Bottom penalty area */}
            <rect x="160" y="640" width="280" height="120" rx="4" stroke="white" strokeWidth="2"/>
            <rect x="220" y="710" width="160" height="50" rx="4" stroke="white" strokeWidth="2"/>
            <circle cx="300" cy="670" r="4" fill="white"/>
            {/* Corner arcs */}
            <path d="M40 52 A12 12 0 0 1 52 40" stroke="white" strokeWidth="2"/>
            <path d="M548 40 A12 12 0 0 1 560 52" stroke="white" strokeWidth="2"/>
            <path d="M40 748 A12 12 0 0 1 52 760" stroke="white" strokeWidth="2"/>
            <path d="M548 760 A12 12 0 0 1 560 748" stroke="white" strokeWidth="2"/>
        </svg>
    );
}

function FloatingCard({ icon, iconImg, title, subtitle, color, border, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.8 + delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex items-center gap-3 p-3 pr-5 rounded-2xl bg-gradient-to-r ${color} backdrop-blur-xl border ${border}`}
        >
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                {iconImg ? <img src={iconImg} alt="" className="w-6 h-6 object-cover" /> : <span className="text-lg">{icon}</span>}
            </div>
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{title}</p>
                <p className="text-[11px] text-white/35">{subtitle}</p>
            </div>
        </motion.div>
    );
}

export default function FootballHero({ isLogin }) {
    return (
        <div className="relative h-full w-full overflow-hidden bg-[#050f0a]">
            {/* Layered gradient background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B6E4F]/[0.15] via-[#050f0a] to-[#10b981]/[0.08]" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-[#050f0a]" />
            </div>

            {/* Animated glow orbs */}
            <motion.div
                animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[15%] left-[20%] w-[350px] h-[350px] rounded-full bg-[#0B6E4F]/[0.08] blur-[100px]"
            />
            <motion.div
                animate={{ x: [0, -30, 40, 0], y: [0, 40, -20, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-emerald-500/[0.06] blur-[80px]"
            />

            {/* Field lines */}
            <FieldLines />

            {/* Stadium light beams */}
            <div className="absolute top-0 left-1/4 w-[2px] h-[40%] bg-gradient-to-b from-[#0B6E4F]/20 to-transparent rotate-12 origin-top" />
            <div className="absolute top-0 right-1/3 w-[2px] h-[35%] bg-gradient-to-b from-[#0B6E4F]/15 to-transparent -rotate-6 origin-top" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full p-10 lg:p-14">
                {/* Top: Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                        <img src="/logo.jpg" alt="GoalTime" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">
                        <span className="font-extrabold">Goal</span><span className="font-light opacity-40">Time</span>
                    </span>
                </motion.div>

                {/* Middle: Hero content */}
                <div className="flex-1 flex flex-col justify-center max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2 className="text-[2.5rem] lg:text-[3.2rem] font-extrabold text-white leading-[1.05] mb-4">
                            {isLogin ? (
                                <>Bienvenue<br /><span className="text-white/20">de retour.</span></>
                            ) : (
                                <>Rejoignez<br />le <span className="text-[#0B6E4F]">terrain.</span></>
                            )}
                        </h2>
                        <p className="text-[14px] text-white/30 leading-relaxed max-w-sm">
                            {isLogin
                                ? "Réservez votre prochain match, construisez votre équipe et affrontez les meilleurs."
                                : "Créez votre compte et commencez à jouer dès aujourd'hui."}
                        </p>
                    </motion.div>
                </div>

                {/* Bottom: Floating cards */}
                <div className="space-y-2.5">
                    {floatingCards.map((card, i) => (
                        <FloatingCard key={i} {...card} />
                    ))}
                </div>
            </div>

            {/* Grass texture overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B6E4F]/[0.04] to-transparent pointer-events-none" />
        </div>
    );
}
