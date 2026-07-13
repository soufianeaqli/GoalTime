import { useState } from 'react';

const EyeOpen = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const EyeClosed = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
);

export default function PasswordField({ label, error, icon, ...props }) {
    const [show, setShow] = useState(false);

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
                    type={show ? 'text' : 'password'}
                    {...props}
                    className={`w-full ${icon ? 'pl-11' : 'pl-4'} pr-12 py-3.5 rounded-2xl bg-white/[0.04] border text-[13px] text-white placeholder:text-white/15 focus:outline-none transition-all duration-300 ${
                        error
                            ? 'border-red-500/40 focus:border-red-500/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                            : 'border-white/[0.07] focus:border-[#0B6E4F]/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(11,110,79,0.1)]'
                    } ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors"
                    tabIndex={-1}
                >
                    {show ? <EyeClosed /> : <EyeOpen />}
                </button>
            </div>
            {error && (
                <p className="text-[11px] text-red-400 mt-1.5 ml-1">{error}</p>
            )}
        </div>
    );
}
