import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, ShieldCheck } from 'lucide-react';

export default function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-slate-950 font-sans">
            {/* Background Glowing Effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-lg shadow-emerald-950/50">
                    <ShieldCheck size={16} />
                    <span>Official Alumni Association of Al Hamiya Arabic College</span>
                </div>

                {/* Heading */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
                    Welcome to <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Majlisul Hamiyyeen</span>
                </h1>

                {/* Description */}
                <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
                    Connecting graduates worldwide, preserving academic excellence, and building a stronger community for the past students of Al Hamiya College.
                </p>

                {/* Call to Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link
                        to="/register"
                        className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-semibold shadow-xl shadow-emerald-900/40 hover:shadow-emerald-900/60 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>Register as Alumni</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                        to="/directory"
                        className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <Users size={16} className="text-emerald-400" />
                        <span>Explore Directory</span>
                    </Link>
                </div>

            </div>
        </section>
    );
}