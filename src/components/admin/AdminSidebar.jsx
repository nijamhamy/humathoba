import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
    const location = useLocation();
    const { logout } = useAuth();

    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Manage Members', path: '/admin/members', icon: Users },
        { label: 'News & Articles', path: '/admin/content', icon: FileText },
    ];

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col justify-between p-5 min-h-screen">
            <div className="space-y-8">
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        MH
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white leading-none">Majlisul Hamiyyeen</h2>
                        <p className="text-[10px] text-emerald-400 font-medium mt-1">Admin Control Panel</p>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-colors ${isActive
                                        ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                    }`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-800 space-y-2">
                <Link
                    to="/"
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Main Site</span>
                </Link>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}