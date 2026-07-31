import React from 'react';
import { Check, X, Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function MemberTable({ members, onApprove, onReject, onDelete }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/50">
                        <th className="py-3 px-4 font-semibold">Member Info</th>
                        <th className="py-3 px-4 font-semibold">Batch</th>
                        <th className="py-3 px-4 font-semibold">Occupation & Country</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {members.length > 0 ? (
                        members.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="font-semibold text-white">{m.full_name}</div>
                                    <div className="text-slate-400 text-[11px]">{m.email}</div>
                                </td>
                                <td className="py-3 px-4 font-medium text-emerald-400">{m.batch_year}</td>
                                <td className="py-3 px-4">
                                    <div className="text-slate-300">{m.occupation}</div>
                                    <div className="text-slate-500 text-[11px]">{m.country}</div>
                                </td>
                                <td className="py-3 px-4">
                                    <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${m.approval_status === 'approved'
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                : m.approval_status === 'pending'
                                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                            }`}
                                    >
                                        {m.approval_status === 'approved' && <CheckCircle2 size={12} />}
                                        {m.approval_status === 'pending' && <Clock size={12} />}
                                        {m.approval_status === 'rejected' && <XCircle size={12} />}
                                        <span className="capitalize">{m.approval_status || 'Pending'}</span>
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {onApprove && m.approval_status !== 'approved' && (
                                            <button
                                                onClick={() => onApprove(m.id)}
                                                className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
                                                title="Approve"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                        {onReject && m.approval_status !== 'rejected' && (
                                            <button
                                                onClick={() => onReject(m.id)}
                                                className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white transition-all"
                                                title="Reject"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(m.id)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-slate-500">
                                No members found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}