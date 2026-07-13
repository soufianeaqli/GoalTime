import { motion } from 'framer-motion';

export default function AuthButton({ children, loading, variant = 'primary', ...props }) {
    const base = 'w-full py-3.5 rounded-2xl text-[13px] font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-gradient-to-r from-[#0B6E4F] to-[#10b981] hover:from-[#0a8a60] hover:to-[#059669] text-white shadow-lg shadow-[#0B6E4F]/25 hover:shadow-xl hover:shadow-[#0B6E4F]/30 hover:-translate-y-[1px] active:translate-y-0',
        outline: 'bg-white/[0.04] border border-white/[0.07] text-white/50 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12]',
        ghost: 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]',
    };

    return (
        <button {...props} className={`${base} ${variants[variant]} ${props.className || ''}`}>
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Chargement...
                </span>
            ) : children}
        </button>
    );
}
