import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Award, Target, Heart, BookOpen, Users } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">

                {/* Hero Title */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                        About Our Association
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                        Preserving Heritage, Inspiring the Future
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                        Majlisul Hamiyyeen is the Old Boys Association (OBA) of Al Hamiya Arabic College, dedicated to bringing together alumni from across the globe to foster brotherhood and educational advancement.
                    </p>
                </div>

                {/* Mission & Vision Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm space-y-4 shadow-xl">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Target size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Our Mission</h3>
                        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                            To build a global network of alumni who actively contribute to the growth of Al Hamiya Arabic College, provide career guidance to students, and support social welfare projects.
                        </p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm space-y-4 shadow-xl">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                            <Heart size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Our Vision</h3>
                        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                            To be a leading Islamic alumni association that empowers its members intellectually and spiritually while leaving a lasting positive impact on community development.
                        </p>
                    </div>
                </div>

                {/* Core Values Section */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-12 backdrop-blur-md space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-white">Our Core Pillars</h2>
                        <p className="text-xs text-slate-400">The values that drive our association forward.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                        <div className="space-y-3">
                            <Award size={32} className="mx-auto text-emerald-400" />
                            <h4 className="text-base font-bold text-white">Academic Excellence</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Supporting Islamic higher education and research initiatives.</p>
                        </div>

                        <div className="space-y-3">
                            <Users size={32} className="mx-auto text-teal-400" />
                            <h4 className="text-base font-bold text-white">Brotherhood</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Strengthening lifelong connections among college graduates.</p>
                        </div>

                        <div className="space-y-3">
                            <BookOpen size={32} className="mx-auto text-cyan-400" />
                            <h4 className="text-base font-bold text-white">Community Service</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Engaging in charitable and educational welfare activities.</p>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
}