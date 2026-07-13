export default function AuthDivider({ text = 'ou' }) {
    return (
        <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">{text}</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
    );
}
