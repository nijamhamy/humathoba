import React from 'react';

export default function PageHeader({ badge, title, description }) {
    return (
        <div className="text-center space-y-3 max-w-2xl mx-auto font-sans">
            {badge && (
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                    {badge}
                </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {title}
            </h1>
            {description && (
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    {description}
                </p>
            )}
        </div>
    );
}