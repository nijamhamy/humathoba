import React from 'react';
import { Users, GraduationCap, Globe, BookOpen } from 'lucide-react';

export default function QuickStats() {
    const stats = [
        { label: 'Registered Alumni', value: '1,500+', icon: Users, color: 'text-emerald-400' },
        { label: 'Alumni Batches', value: '45+', icon: GraduationCap, color: 'text-teal-400' },
        { label: 'Countries Represented', value: '15+', icon: Globe, color: 'text-cyan-400' },
        { label: 'Years of Legacy', value: '50+', icon: BookOpen, color: 'text-amber-400' },
    ];

    return (
        <section className="py-12 bg-slate-950/60 border-y border-slate-800/80 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3 backdrop-blur-sm hover:border-slate-700 transition-all"
                            >
                                <div className={`w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto ${item.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                    {item.value}
                                </div>
                                <div className="text-xs text-slate-400 font-medium">{item.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}