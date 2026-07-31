import React from 'react';

export default function SkeletonLoader({ className = '' }) {
    return (
        <div
            className={`animate-pulse bg-slate-800/60 rounded-2xl ${className}`}
        />
    );
}