import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    Search,
    Check,
    X,
    Trash2,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Clock,
    XCircle,
    ShieldCheck,
    Filter,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Eye,
    Edit,
    CreditCard,
    Save,
    AlertCircle,
    Power,
    Calendar,
    Award,
    QrCode,
    Barcode
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function ManageMembers() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals state
    const [viewMember, setViewMember] = useState(null);
    const [editMember, setEditMember] = useState(null);
    const [pendingEditsMember, setPendingEditsMember] = useState(null);

    // Membership Card Modal State
    const [cardModalMember, setCardModalMember] = useState(null);
    const [subscriptionYears, setSubscriptionYears] = useState(1);
    const [customYearsInput, setCustomYearsInput] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, roles(role_name)')
                .order('created_at', { ascending: true }); // Ascending order for sequential HAMI-OBA-01, 02 generation

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error('Error fetching members:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Formats auto-incremented HAMI-OBA-XX Membership ID
    const getFormattedMemberId = (member) => {
        if (member.index_number) return member.index_number;

        // Find index position in ascending member list
        const index = members.findIndex(m => m.id === member.id);
        const sequenceNum = index >= 0 ? index + 1 : member.id;
        const paddedNum = String(sequenceNum).padStart(2, '0');
        return `HAMI-OBA-${paddedNum}`;
    };

    const handleApprove = async (id) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ approval_status: 'approved', approved_at: new Date() })
                .eq('id', id);

            if (error) throw error;

            setMembers(members.map(m => m.id === id ? { ...m, approval_status: 'approved' } : m));
            alert('Member account approved successfully!');
        } catch (err) {
            alert('Failed to approve member: ' + err.message);
        }
    };

    const handleReject = async (id) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ approval_status: 'rejected' })
                .eq('id', id);

            if (error) throw error;

            setMembers(members.map(m => m.id === id ? { ...m, approval_status: 'rejected' } : m));
            alert('Member registration rejected.');
        } catch (err) {
            alert('Failed to reject member: ' + err.message);
        }
    };

    // Approve Profile Edits Requested by Member
    const handleApproveEdits = async (member) => {
        setUpdating(true);
        try {
            const edits = member.pending_edits;
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: edits.full_name || member.full_name,
                    phone: edits.phone || member.phone,
                    batch_year: parseInt(edits.batch_year, 10) || member.batch_year,
                    occupation: edits.occupation || member.occupation,
                    company_name: edits.company_name || member.company_name,
                    country: edits.country || member.country,
                    address: edits.address || member.address,
                    profile_image_url: edits.profile_image_url || member.profile_image_url,
                    pending_edits: null // Clear pending edits after approval
                })
                .eq('id', member.id);

            if (error) throw error;

            alert('Member profile updates approved and applied!');
            setPendingEditsMember(null);
            fetchMembers();
        } catch (err) {
            alert('Failed to approve edits: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    // Reject Profile Edits Requested by Member
    const handleRejectEdits = async (memberId) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ pending_edits: null })
                .eq('id', memberId);

            if (error) throw error;

            alert('Pending profile edits rejected.');
            setPendingEditsMember(null);
            fetchMembers();
        } catch (err) {
            alert('Failed to reject edits: ' + err.message);
        }
    };

    // Activate / Issue Card with Custom Subscription Expiry Calculation
    const handleIssueOrActivateCard = async (member) => {
        setUpdating(true);
        try {
            const activeYears = customYearsInput ? parseInt(customYearsInput, 10) : parseInt(subscriptionYears, 10);

            if (isNaN(activeYears) || activeYears <= 0) {
                alert('Please enter a valid number of years.');
                setUpdating(false);
                return;
            }

            const issuedDate = new Date();
            const expiryDate = new Date();
            expiryDate.setFullYear(issuedDate.getFullYear() + activeYears);

            const autoMemberId = getFormattedMemberId(member);

            // Update card parameters
            const { error } = await supabase
                .from('users')
                .update({
                    card_status: 'issued',
                    index_number: autoMemberId,
                    card_issued_at: issuedDate,
                    card_expires_at: expiryDate,
                    card_subscription_years: activeYears
                })
                .eq('id', member.id);

            if (error) {
                // Fallback update if new date columns are missing
                console.warn("Date column update failed, fallback update:", error.message);
                const { error: fallbackErr } = await supabase
                    .from('users')
                    .update({ card_status: 'issued', index_number: autoMemberId })
                    .eq('id', member.id);

                if (fallbackErr) throw fallbackErr;
            }

            alert(`Digital Membership Card issued successfully! ID: ${autoMemberId} (Valid for ${activeYears} Year(s) until ${expiryDate.toLocaleDateString()})`);
            setCardModalMember(null);
            fetchMembers();
        } catch (err) {
            alert('Failed to issue membership card: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    // Deactivate Card Action
    const handleDeactivateCard = async (memberId) => {
        if (!window.confirm('Are you sure you want to deactivate this member\'s ID card?')) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ card_status: 'deactivated' })
                .eq('id', memberId);

            if (error) throw error;

            alert('Membership card deactivated successfully!');
            setCardModalMember(null);
            fetchMembers();
        } catch (err) {
            alert('Failed to deactivate card: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteMember = async (id) => {
        if (!window.confirm('Are you sure you want to delete this member from the database?')) return;

        try {
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (error) throw error;

            setMembers(members.filter(m => m.id !== id));
            alert('Member deleted successfully!');
        } catch (err) {
            alert('Failed to delete member: ' + err.message);
        }
    };

    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.country?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' || member.approval_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const activeYearsNum = customYearsInput ? parseInt(customYearsInput, 10) : parseInt(subscriptionYears, 10);
    const calcIssueDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const calcExpiryDate = (() => {
        if (cardModalMember?.card_expires_at && !customYearsInput && cardModalMember.card_subscription_years === subscriptionYears) {
            return new Date(cardModalMember.card_expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
        const d = new Date();
        d.setFullYear(d.getFullYear() + (isNaN(activeYearsNum) ? 1 : activeYearsNum));
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    })();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top Header Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/admin/dashboard"
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                Manage Alumni Members
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                View, approve registrations, verify profile edits, and issue or deactivate digital ID cards.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
                    <div className="relative w-full sm:w-80">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, phone..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400">
                            <Filter size={14} className="text-slate-500" />
                            <span>Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent text-white focus:outline-none font-medium cursor-pointer"
                            >
                                <option value="all" className="bg-slate-900">All Members</option>
                                <option value="approved" className="bg-slate-900">Approved</option>
                                <option value="pending" className="bg-slate-900">Pending</option>
                                <option value="rejected" className="bg-slate-900">Rejected</option>
                            </select>
                        </div>

                        <div className="text-xs text-slate-400">
                            Total: <span className="text-emerald-400 font-bold">{filteredMembers.length}</span>
                        </div>
                    </div>
                </div>

                {/* Members Table */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <Loader2 size={32} className="animate-spin text-emerald-500" />
                            <p className="text-xs">Loading members from database...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/50">
                                        <th className="py-4 px-4 font-semibold w-14 text-center">Photo</th>
                                        <th className="py-4 px-6 font-semibold">Member Info</th>
                                        <th className="py-4 px-4 font-semibold">Auto ID</th>
                                        <th className="py-4 px-4 font-semibold">Batch</th>
                                        <th className="py-4 px-4 font-semibold">Card Status</th>
                                        <th className="py-4 px-4 font-semibold">Status</th>
                                        <th className="py-4 px-6 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((member) => {
                                            const formattedId = getFormattedMemberId(member);

                                            return (
                                                <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-700 overflow-hidden mx-auto flex items-center justify-center shadow-md">
                                                            {member.profile_image_url ? (
                                                                <img src={member.profile_image_url} alt={member.full_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-emerald-400 font-bold text-xs uppercase">
                                                                    {member.full_name?.charAt(0) || 'U'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-6">
                                                        <div className="font-semibold text-white flex items-center gap-2">
                                                            <span>{member.full_name}</span>
                                                            {member.pending_edits && (
                                                                <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse flex items-center gap-1">
                                                                    <AlertCircle size={10} /> Edits Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                                                            <Mail size={11} className="text-slate-500" />
                                                            <span>{member.email}</span>
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-4 font-mono font-semibold text-emerald-400">
                                                        {formattedId}
                                                    </td>

                                                    <td className="py-4 px-4 font-medium text-slate-300">
                                                        {member.batch_year || 'N/A'}
                                                    </td>

                                                    <td className="py-4 px-4">
                                                        <button
                                                            onClick={() => {
                                                                setCardModalMember(member);
                                                                setSubscriptionYears(member.card_subscription_years || 1);
                                                                setCustomYearsInput('');
                                                            }}
                                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 border shadow-sm ${member.card_status === 'issued'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                                                : member.card_status === 'requested'
                                                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 animate-pulse'
                                                                    : member.card_status === 'deactivated'
                                                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                                                }`}
                                                        >
                                                            <CreditCard size={12} />
                                                            <span className="capitalize">
                                                                {member.card_status === 'issued'
                                                                    ? 'Active Card'
                                                                    : member.card_status === 'requested'
                                                                        ? 'Card Requested'
                                                                        : member.card_status === 'deactivated'
                                                                            ? 'Deactivated'
                                                                            : 'Issue Card'}
                                                            </span>
                                                        </button>
                                                    </td>

                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${member.approval_status === 'approved'
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                            }`}>
                                                            <span className="capitalize">{member.approval_status || 'Pending'}</span>
                                                        </span>
                                                    </td>

                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {member.pending_edits && (
                                                                <button
                                                                    onClick={() => setPendingEditsMember(member)}
                                                                    className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-[11px] font-bold transition-all flex items-center gap-1"
                                                                >
                                                                    <Edit size={12} /> Review Edits
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => setViewMember(member)}
                                                                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                                                                title="View Profile Details"
                                                            >
                                                                <Eye size={14} />
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteMember(member.id)}
                                                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                                title="Delete Member"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-slate-500">
                                                No members found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            {/* 1. OFFICIAL MEMBERSHIP CARD MODAL (WITH BARCODE & CUSTOM YEARS) */}
            {cardModalMember && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl relative animate-in fade-in">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <CreditCard size={18} className="text-emerald-400" />
                                Official Digital Membership ID Card
                            </h3>
                            <button onClick={() => setCardModalMember(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* OFFICIAL DESIGNED MEMBERSHIP CARD PREVIEW */}
                        <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-md">
                                        MH
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Majlisul Hamiyyeen</h4>
                                        <p className="text-[9px] text-emerald-400 font-semibold tracking-widest uppercase">Al Hamiya College OBA</p>
                                    </div>
                                </div>
                                <ShieldCheck size={22} className="text-emerald-400" />
                            </div>

                            {/* Card Body Info */}
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-slate-700 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                                    {cardModalMember.profile_image_url ? (
                                        <img src={cardModalMember.profile_image_url} alt={cardModalMember.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-emerald-400 font-bold text-2xl uppercase">
                                            {cardModalMember.full_name?.charAt(0)}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1 text-xs">
                                    <h3 className="text-sm font-bold text-white leading-snug">{cardModalMember.full_name}</h3>
                                    <p className="text-[11px] text-emerald-400 font-mono font-bold">
                                        ID No: {getFormattedMemberId(cardModalMember)}
                                    </p>
                                    <p className="text-[11px] text-slate-400"><strong className="text-slate-300">Batch:</strong> {cardModalMember.batch_year || 'N/A'}</p>
                                    <p className="text-[11px] text-slate-400"><strong className="text-slate-300">Country:</strong> {cardModalMember.country || 'Sri Lanka'}</p>
                                </div>
                            </div>

                            {/* Barcode Display Element */}
                            <div className="pt-2 flex flex-col items-center justify-center border-t border-slate-800/80 relative z-10">
                                <div className="bg-white px-4 py-1.5 rounded-lg flex flex-col items-center justify-center shadow-inner w-full max-w-[220px]">
                                    <Barcode className="w-full h-8 text-slate-950" />
                                    <span className="text-[9px] font-mono font-bold tracking-widest text-slate-950 -mt-1">
                                        {getFormattedMemberId(cardModalMember)}
                                    </span>
                                </div>
                            </div>

                            {/* Card Footer Dates & Status */}
                            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                                <div>
                                    <p>Issued: <span className="text-slate-200 font-semibold">{calcIssueDate}</span></p>
                                    <p>Expires: <span className="text-emerald-400 font-semibold">{calcExpiryDate}</span></p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${cardModalMember.card_status === 'issued'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                    }`}>
                                    {cardModalMember.card_status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* SUBSCRIPTION DURATION & CUSTOM YEARS INPUT */}
                        <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <label className="block font-semibold text-slate-300">
                                Select or Enter Subscription Duration:
                            </label>

                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 5].map((years) => (
                                    <button
                                        key={years}
                                        type="button"
                                        onClick={() => {
                                            setSubscriptionYears(years);
                                            setCustomYearsInput('');
                                        }}
                                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${!customYearsInput && parseInt(subscriptionYears, 10) === years
                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {years} Year{years > 1 ? 's' : ''}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Years Input Field */}
                            <div className="pt-1 flex items-center gap-2">
                                <span className="text-slate-400 text-[11px] whitespace-nowrap">Or Custom Years:</span>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 10"
                                    value={customYearsInput}
                                    onChange={(e) => setCustomYearsInput(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                                <Calendar size={12} className="text-emerald-400" /> Card will automatically be valid for <strong className="text-emerald-400">{isNaN(activeYearsNum) ? 1 : activeYearsNum} Year(s)</strong> until <strong className="text-emerald-400">{calcExpiryDate}</strong>
                            </p>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => handleIssueOrActivateCard(cardModalMember)}
                                disabled={updating}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {updating ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                                <span>{cardModalMember.card_status === 'issued' ? 'Update / Extend Card' : 'Issue & Activate Card'}</span>
                            </button>

                            {cardModalMember.card_status === 'issued' && (
                                <button
                                    onClick={() => handleDeactivateCard(cardModalMember.id)}
                                    disabled={updating}
                                    className="py-2.5 px-4 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                                    title="Deactivate Card"
                                >
                                    <Power size={14} /> Deactivate
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. REVIEW PENDING EDITS MODAL */}
            {pendingEditsMember && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-400" />
                                Review Profile Edits
                            </h3>
                            <button onClick={() => setPendingEditsMember(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <p className="text-slate-400 font-medium">Requested Changes by <strong className="text-white">{pendingEditsMember.full_name}</strong>:</p>

                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                                <div className="flex justify-between"><span className="text-slate-500">Full Name:</span> <span className="text-white">{pendingEditsMember.pending_edits.full_name}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="text-white">{pendingEditsMember.pending_edits.phone}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Batch Year:</span> <span className="text-white">{pendingEditsMember.pending_edits.batch_year}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Occupation:</span> <span className="text-white">{pendingEditsMember.pending_edits.occupation}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Country:</span> <span className="text-white">{pendingEditsMember.pending_edits.country}</span></div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleApproveEdits(pendingEditsMember)}
                                    disabled={updating}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={16} /> Approve Edits
                                </button>
                                <button
                                    onClick={() => handleRejectEdits(pendingEditsMember.id)}
                                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white font-semibold transition-all"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. VIEW PROFILE DETAILS MODAL */}
            {viewMember && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Member Profile Details</h3>
                            <button onClick={() => setViewMember(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-lg shrink-0">
                                {viewMember.profile_image_url ? (
                                    <img src={viewMember.profile_image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-emerald-400 uppercase">
                                        {viewMember.full_name?.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">{viewMember.full_name}</h4>
                                <p className="text-xs text-emerald-400 font-medium">Batch {viewMember.batch_year || 'N/A'}</p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Auto ID: {getFormattedMemberId(viewMember)}</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 text-xs divide-y divide-slate-800/80">
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Email:</span> <span className="text-white font-mono">{viewMember.email}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Phone:</span> <span className="text-white">{viewMember.phone || 'N/A'}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Occupation:</span> <span className="text-white">{viewMember.occupation || 'N/A'}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Country:</span> <span className="text-white">{viewMember.country || 'Sri Lanka'}</span></div>
                        </div>

                        <button onClick={() => setViewMember(null)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all">
                            Close Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}