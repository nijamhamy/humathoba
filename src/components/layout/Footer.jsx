import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-400 text-xs">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Col 1: Brand Info */}
                <div className="space-y-4 md:col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm">
                            MH
                        </div>
                        <span className="text-sm font-bold text-white">Majlisul Hamiyyeen</span>
                    </div>
                    <p className="leading-relaxed text-slate-400">
                        Al Hamiya Arabic College Old Boys Association (OBA). Uniting alumni around the globe.
                    </p>
                </div>

                {/* Col 2: Quick Links */}
                <div className="space-y-3">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">Quick Navigation</h4>
                    <ul className="space-y-2">
                        <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                        <li><Link to="/directory" className="hover:text-emerald-400 transition-colors">Alumni Directory</Link></li>
                        <li><Link to="/gallery" className="hover:text-emerald-400 transition-colors">Photo Gallery</Link></li>
                        <li><Link to="/blog" className="hover:text-emerald-400 transition-colors">News & Articles</Link></li>
                    </ul>
                </div>

                {/* Col 3: Portal Links */}
                <div className="space-y-3">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">Member Portal</h4>
                    <ul className="space-y-2">
                        <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Member Login</Link></li>
                        <li><Link to="/register" className="hover:text-emerald-400 transition-colors">New Registration</Link></li>
                        <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
                    </ul>
                </div>

                {/* Col 4: Copyright */}
                <div className="space-y-3 md:col-span-1">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">College Address</h4>
                    <p className="leading-relaxed">
                        Al Hamiya Arabic College,<br />
                        Sri Lanka.
                    </p>
                </div>

            </div>

            <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                <p>© {new Date().getFullYear()} Majlisul Hamiyyeen OBA. All rights reserved.</p>
                <p className="flex items-center gap-1">
                    <span>Developed with</span>
                    <Heart size={14} className="text-rose-500 fill-rose-500" />
                    <span>for Al Hamiya College Alumni</span>
                </p>
            </div>
        </footer>
    );
}