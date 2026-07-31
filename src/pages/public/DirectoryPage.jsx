import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    GraduationCap,
    Briefcase,
    MapPin,
    Mail,
    Phone,
    Users,
    Loader2,
    X,
    Building2
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../supabaseClient';

export default function DirectoryPage() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('All');
    const [selectedCountry, setSelectedCountry] = useState('All');

    // Selected member state for Modal View
    const [selectedMemberModal, setSelectedMemberModal] = useState(null);

    useEffect(() => {
        fetchApprovedMembers();
    }, []);

    // Fetch approved members from real Supabase DB
    const fetchApprovedMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('approval_status', 'approved')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error('Error fetching members directory:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Dynamically get unique Batches and Countries from real member data
    const batchOptions = [
        'All',
        ...new Set(
            members
                .map((m) => m.batch_year)
                .filter(Boolean)
                .sort((a, b) => b - a)
        )
    ];

    const countryOptions = [
        'All',
        ...new Set(members.map((m) => m.country).filter(Boolean))
    ];

    // Real Search & Filter Logic
    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.country?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesBatch =
            selectedBatch === 'All' || String(member.batch_year) === String(selectedBatch);

        const matchesCountry =
            selectedCountry === 'All' || member.country === selectedCountry;

        return matchesSearch && matchesBatch && matchesCountry;
    });

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">

                {/* Page Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    <span className="text-emerald-400 text-xs sm:text-sm font-semibold tracking-wider uppercase bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                        OBA Directory
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                        Alumni Member Directory
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                        Discover and connect with verified alumni of Al Hamiya Arabic College around the globe.
                    </p>
                </div>

                {/* Filter & Search Controls Bar */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-xl mb-10 shadow-2xl space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">

                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, occupation, or country..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Batch Filter */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-44">
                            <select
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-2xl px-4 py-3 focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer"
                            >
                                {batchOptions.map((batch) => (
                                    <option key={batch} value={batch} className="bg-slate-900">
                                        {batch === 'All' ? 'All Batches' : `${batch} Batch`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Country Filter */}
                        <div className="relative w-full sm:w-44">
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-2xl px-4 py-3 focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer"
                            >
                                {countryOptions.map((country) => (
                                    <option key={country} value={country} className="bg-slate-900">
                                        {country === 'All' ? 'All Countries' : country}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                </div>

                {/* Results Counter */}
                <div className="flex items-center justify-between mb-6 px-2 text-xs text-slate-400">
                    <span>Showing members: <strong className="text-emerald-400 font-bold">{filteredMembers.length}</strong></span>
                </div>

                {/* Members Cards Grid / Loader */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={36} className="animate-spin text-emerald-500" />
                        <p className="text-xs font-medium">Loading member directory...</p>
                    </div>
                ) : filteredMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                onClick={() => setSelectedMemberModal(member)}
                                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between group cursor-pointer"
                            >
                                <div>
                                    {/* Avatar Photo & Name */}
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                                            {member.profile_image_url ? (
                                                <img
                                                    src={member.profile_image_url}
                                                    alt={member.full_name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xl uppercase">
                                                    {member.full_name?.charAt(0) || 'M'}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                                                {member.full_name}
                                            </h3>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mt-1.5">
                                                <GraduationCap size={14} />
                                                <span>Batch {member.batch_year || 'N/A'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details List */}
                                    <div className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                                        <div className="flex items-center gap-2.5">
                                            <Briefcase size={15} className="text-emerald-400 shrink-0" />
                                            <span className="truncate">{member.occupation || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <MapPin size={15} className="text-emerald-400 shrink-0" />
                                            <span>{member.country || 'Sri Lanka'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Actions */}
                                <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                                    <a
                                        href={`mailto:${member.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="py-2 rounded-xl bg-slate-950 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500 transition-all text-xs font-medium flex items-center justify-center gap-1.5"
                                    >
                                        <Mail size={14} />
                                        <span>Email</span>
                                    </a>
                                    <a
                                        href={`tel:${member.phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="py-2 rounded-xl bg-slate-950 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500 transition-all text-xs font-medium flex items-center justify-center gap-1.5"
                                    >
                                        <Phone size={14} />
                                        <span>Call</span>
                                    </a>
                                </div>

                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                        <Users size={48} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-base font-medium">No members found matching your search criteria.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedBatch('All'); setSelectedCountry('All'); }}
                            className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

            </main>

            {/* FULL MEMBER DETAILS MODAL */}
            {selectedMemberModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative animate-in fade-in">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Member Profile Details</h3>
                            <button
                                onClick={() => setSelectedMemberModal(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-lg flex-shrink-0">
                                {selectedMemberModal.profile_image_url ? (
                                    <img src={selectedMemberModal.profile_image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-emerald-400 uppercase">
                                        {selectedMemberModal.full_name?.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">{selectedMemberModal.full_name}</h4>
                                <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                                    Batch {selectedMemberModal.batch_year || 'N/A'}
                                </p>
                                {selectedMemberModal.index_number && (
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                        Student ID: {selectedMemberModal.index_number}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 text-xs divide-y divide-slate-800/80">
                            <div className="pt-2 flex justify-between">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                    <Mail size={14} className="text-slate-500" /> Email:
                                </span>
                                <span className="text-white font-mono">{selectedMemberModal.email}</span>
                            </div>

                            <div className="pt-2 flex justify-between">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                    <Phone size={14} className="text-slate-500" /> Phone:
                                </span>
                                <span className="text-white">{selectedMemberModal.phone || 'N/A'}</span>
                            </div>

                            <div className="pt-2 flex justify-between">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                    <Briefcase size={14} className="text-slate-500" /> Occupation:
                                </span>
                                <span className="text-white">{selectedMemberModal.occupation || 'N/A'}</span>
                            </div>

                            {selectedMemberModal.company_name && (
                                <div className="pt-2 flex justify-between">
                                    <span className="text-slate-400 flex items-center gap-1.5">
                                        <Building2 size={14} className="text-slate-500" /> Company:
                                    </span>
                                    <span className="text-white">{selectedMemberModal.company_name}</span>
                                </div>
                            )}

                            <div className="pt-2 flex justify-between">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-500" /> Country:
                                </span>
                                <span className="text-white">{selectedMemberModal.country || 'Sri Lanka'}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedMemberModal(null)}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all mt-2"
                        >
                            Close Profile
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}