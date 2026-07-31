import React from 'react';

export default function StatsCard({ title, value, subtext, icon: Icon, color = 'emerald' }) {
    const colorStyles = {
        emerald: 'bg-emerald-500/10 text-emerald-400',
        amber: 'bg-amber-500/10 text-amber-400',
        teal: 'bg-teal-500/10 text-teal-400',
        cyan: 'bg-cyan-500/10 text-cyan-400',
    };

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{title}</span>
                {Icon && (
                    <div className={`p-2.5 rounded-xl ${colorStyles[color] || colorStyles.emerald}`}>
                        <Icon size={20} />
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-white mt-3">{value}</div>
            {subtext && <span className="text-[11px] text-slate-400 mt-1 inline-block">{subtext}</span>}
        </div>
    );
}