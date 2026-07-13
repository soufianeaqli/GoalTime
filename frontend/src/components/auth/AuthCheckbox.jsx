export default function AuthCheckbox({ checked, onChange, label }) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only peer"
                />
                <div className="w-4 h-4 rounded-lg border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#0B6E4F] peer-checked:border-[#0B6E4F] transition-all duration-200 flex items-center justify-center">
                    {checked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    )}
                </div>
            </div>
            <span className="text-[12px] text-white/30 group-hover:text-white/50 transition-colors">{label}</span>
        </label>
    );
}
