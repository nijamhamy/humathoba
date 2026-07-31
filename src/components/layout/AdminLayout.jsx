import React from 'react';
import AdminSidebar from '../admin/AdminSidebar';

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <main className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}