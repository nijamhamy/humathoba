import React from 'react';

export default function Card({ children, className = '', ...props }) {
    return (
        <div
            className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}