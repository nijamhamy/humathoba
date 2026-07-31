import React from 'react';
import { Quote, ShieldCheck, User } from 'lucide-react';

export default function PresidentMessage({ imageUrl, presidentName, title, message }) {
    return (
        <section className="py-20 bg-slate-950 font-sans selection:bg-emerald-500 selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 backdrop-blur-md relative overflow-hidden shadow-2xl">

                    {/* Background Decorative Quote */}
                    <div className="absolute -right-10 -bottom-10 text-slate-800/30 pointer-events-none z-0">
                        <Quote size={220} />
                    </div>

                    {/* Main Content Layout (Text Left + Styled Image Right) */}
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

                        {/* Left Side: Message Text */}
                        <div className="flex-1 space-y-6 text-center lg:text-left">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                President's Address
                            </span>

                            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
                                {title || '"Fostering Lifelong Ties & Serving Our Alma Mater"'}
                            </h2>

                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                                {message || '"Majlisul Hamiyyeen serves as a bridge between past memories and future aspirations. Through our collective effort, we strive to support Al Hamiya Arabic College and empower our brothers across the world."'}
                            </p>

                            <div className="pt-4 border-t border-slate-800/80">
                                <h4 className="text-sm font-bold text-white flex items-center justify-center lg:justify-start gap-1.5">
                                    <span>{presidentName || 'President, Majlisul Hamiyyeen'}</span>
                                    <ShieldCheck size={16} className="text-emerald-400" />
                                </h4>
                                <p className="text-xs text-emerald-400 font-medium mt-0.5">
                                    Al Hamiya College Old Boys Association
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Designed Profile Photo Badge */}
                        <div className="shrink-0 relative group">
                            {/* Outer Ambient Glow Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none" />

                            {/* Designed Avatar Box */}
                            <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full p-1.5 bg-gradient-to-b from-emerald-500 via-slate-800 to-slate-900 shadow-2xl">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 border-slate-900 relative flex items-center justify-center">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt="President Profile"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-emerald-400">
                                            <User size={64} className="opacity-80 mb-1" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                President
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Floating Executive Verification Badge */}
                                <div className="absolute bottom-2 right-2 bg-slate-950/90 border border-emerald-500/40 p-2 rounded-full shadow-lg backdrop-blur-md text-emerald-400">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </section>
    );
}