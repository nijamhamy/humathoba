import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary', // primary | secondary | danger | outline
    size = 'md',        // sm | md | lg
    loading = false,
    disabled = false,
    className = '',
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40',
        secondary: 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800',
        danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40',
        outline: 'bg-transparent border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-[11px]',
        md: 'px-5 py-2.5 text-xs',
        lg: 'px-7 py-3.5 text-sm',
    };

    return (
        <button
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading && <Loader2 size={16} className="animate-spin mr-2" />}
            {children}
        </button>
    );
}