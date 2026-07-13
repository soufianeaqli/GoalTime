import { motion } from 'framer-motion';

export default function AuthInput({ label, icon, error, ...props }) {
    return (
        <div>
            <label className="text-[11px] font-semibold text-white/25 uppercase tracking-[0.15em] block mb-2">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    className={`w-full ${icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 rounded-2xl bg-white/[0.04] border text-[13px] text-white placeholder:text-white/15 focus:outline-none transition-all duration-300 ${
                        error
                            ? 'border-red-500/40 focus:border-red-500/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                            : 'border-white/[0.07] focus:border-[#0B6E4F]/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(11,110,79,0.1)]'
                    } ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
            </div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-red-400 mt-1.5 ml-1"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}
