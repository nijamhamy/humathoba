import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Phone, Award } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export default function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-400 text-xs">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Col 1: Brand Info with Professional Logo */}
                <div className="space-y-4 md:col-span-1">
                    <Link to="/" className="flex items-center gap-3.5 group">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-emerald-950/50 overflow-hidden p-1 shrink-0">
                            <img
                                src={logoImg}
                                alt="Majlisul Hamiyyeen Logo"
                                className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                            />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-white tracking-tight block leading-tight group-hover:text-emerald-400 transition-colors">
                                Majlisul Hamiyyeen
                            </span>
                            <span className="text-[9px] text-emerald-400 font-bold tracking-wider uppercase">
                                Al Hamiya College OBA
                            </span>
                        </div>
                    </Link>
                    <p className="leading-relaxed text-slate-400 text-[11px]">
                        Al Hamiya Arabic College Old Boys Association (OBA). Uniting alumni around the globe to support our college and community.
                    </p>
                </div>

                {/* Col 2: Quick Links */}
                <div className="space-y-3">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">Quick Navigation</h4>
                    <ul className="space-y-2 text-[11px]">
                        <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                        <li><Link to="/directory" className="hover:text-emerald-400 transition-colors">Alumni Directory</Link></li>
                        <li><Link to="/gallery" className="hover:text-emerald-400 transition-colors">Photo Gallery</Link></li>
                        <li><Link to="/blog" className="hover:text-emerald-400 transition-colors">News & Articles</Link></li>
                    </ul>
                </div>

                {/* Col 3: Portal Links */}
                <div className="space-y-3">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">Member Portal</h4>
                    <ul className="space-y-2 text-[11px]">
                        <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Member Login</Link></li>
                        <li><Link to="/register" className="hover:text-emerald-400 transition-colors">New Registration</Link></li>
                        <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
                    </ul>
                </div>

                {/* Col 4: College Address */}
                <div className="space-y-3 md:col-span-1">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">College Address</h4>
                    <p className="leading-relaxed text-[11px]">
                        Al Hamiya Arabic College,<br />
                        Sri Lanka.
                    </p>
                </div>

            </div>

            {/* Bottom Copyright & Developer Credit Bar */}
            <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[11px]">
                <p>© {new Date().getFullYear()} Majlisul Hamiyyeen OBA. All rights reserved.</p>

                <div className="flex flex-col sm:flex-row items-center gap-2 text-slate-400">
                    <span className="flex items-center gap-1">
                        Developed with <Heart size={13} className="text-rose-500 fill-rose-500" /> by
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Award size={13} /> AM Nijam Hami <span className="text-slate-400 font-normal">(B.Sc. in Computer Science (Hons))</span>
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                        <Phone size={12} /> 0779977706
                    </span>
                </div>
            </div>
        </footer>
    );
}