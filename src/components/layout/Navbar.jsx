import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 font-sans shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 sm:h-24">

                    {/* Professional Responsive Brand Logo */}
                    <Link to="/" className="flex items-center gap-3.5 group">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shadow-xl shadow-emerald-950/50 overflow-hidden p-1.5 transition-transform duration-300 group-hover:scale-105 shrink-0">
                            <img
                                src={logoImg}
                                alt="Majlisul Hamiyyeen Logo"
                                className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug group-hover:text-emerald-400 transition-colors">
                                Majlisul Hamiyyeen
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold tracking-widest uppercase">
                                Al Hamiya Arabic College OBA
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
                        <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
                        <Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link>
                        <Link to="/directory" className="hover:text-emerald-400 transition-colors">Directory</Link>
                        <Link to="/gallery" className="hover:text-emerald-400 transition-colors">Gallery</Link>
                        <Link to="/blog" className="hover:text-emerald-400 transition-colors">News & Articles</Link>
                        <Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
                    </nav>

                    {/* User Auth & Portal Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                {isAdmin ? (
                                    <Link
                                        to="/admin/dashboard"
                                        className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all shadow-md"
                                    >
                                        <ShieldCheck size={16} />
                                        <span>Admin Panel</span>
                                    </Link>
                                ) : (
                                    <Link
                                        to="/member/dashboard"
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition-all"
                                    >
                                        <LayoutDashboard size={16} />
                                        <span>Member Portal</span>
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors shadow-inner"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
                                >
                                    <LogIn size={15} />
                                    <span>Login</span>
                                </Link>

                                <Link
                                    to="/register"
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all"
                                >
                                    Join OBA
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-6 pt-3 pb-6 space-y-3 text-sm font-medium animate-in fade-in">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">Home</Link>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">About Us</Link>
                    <Link to="/directory" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">Directory</Link>
                    <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">Gallery</Link>
                    <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">News & Articles</Link>
                    <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">Contact</Link>

                    <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
                        {user ? (
                            <>
                                {isAdmin ? (
                                    <Link
                                        to="/admin/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full py-3 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={16} />
                                        <span>Admin Dashboard</span>
                                    </Link>
                                ) : (
                                    <Link
                                        to="/member/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full py-3 text-center rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
                                    >
                                        <LayoutDashboard size={16} />
                                        <span>Member Portal</span>
                                    </Link>
                                )}

                                <button
                                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                    className="w-full py-3 text-center rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-3 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-3 text-center rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}