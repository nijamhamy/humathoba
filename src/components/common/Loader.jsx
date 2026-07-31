import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ text = 'Loading...' }) {
    return (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3 font-sans">
            <Loader2 size={32} className="animate-spin text-emerald-500" />
            <p className="text-xs font-medium">{text}</p>
        </div>
    );
}