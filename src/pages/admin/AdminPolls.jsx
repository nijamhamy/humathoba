import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    CheckCircle2,
    Vote,
    Loader2,
    BarChart2,
    X,
    Clock,
    Radio,
    Users
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function AdminPolls() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Live vote tallies: { [pollId]: { counts: { [optionId]: number }, total: number } }
    const [voteTallies, setVoteTallies] = useState({});
    const [liveConnected, setLiveConnected] = useState(false);

    // New Poll Form State
    const [pollTitle, setPollTitle] = useState('');
    const [pollDesc, setPollDescription] = useState('');
    const [options, setOptions] = useState(['Option 1', 'Option 2']);

    // Keep a ref to the realtime channel so we can clean it up properly
    const channelRef = useRef(null);

    useEffect(() => {
        fetchPolls();
        fetchVoteTallies();

        // Subscribe to realtime changes on poll_votes so results update live
        // the instant a member casts a vote on the Member Dashboard.
        const channel = supabase
            .channel('admin-poll-votes-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'poll_votes' },
                () => {
                    fetchVoteTallies();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'polls' },
                () => {
                    fetchPolls();
                }
            )
            .subscribe((status) => {
                setLiveConnected(status === 'SUBSCRIBED');
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    const fetchPolls = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('polls')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPolls(data || []);
        } catch (err) {
            console.error('Error fetching polls:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch every vote row and aggregate counts per poll/option on the client.
    // Runs on load and re-runs automatically whenever the realtime channel
    // detects an insert/update/delete on poll_votes.
    const fetchVoteTallies = async () => {
        try {
            const { data, error } = await supabase
                .from('poll_votes')
                .select('poll_id, option_id');

            if (error) throw error;

            const tallies = {};
            (data || []).forEach((vote) => {
                if (!tallies[vote.poll_id]) {
                    tallies[vote.poll_id] = { counts: {}, total: 0 };
                }
                tallies[vote.poll_id].counts[vote.option_id] =
                    (tallies[vote.poll_id].counts[vote.option_id] || 0) + 1;
                tallies[vote.poll_id].total += 1;
            });

            setVoteTallies(tallies);
        } catch (err) {
            console.error('Error fetching vote tallies:', err.message);
        }
    };

    const handleAddOptionInput = () => {
        setOptions([...options, `Option ${options.length + 1}`]);
    };

    const handleRemoveOptionInput = (index) => {
        if (options.length <= 2) {
            alert('A poll must have at least 2 options.');
            return;
        }
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (text, index) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formattedOptions = options.map((optText, idx) => ({
                id: idx + 1,
                text: optText
            }));

            const { error } = await supabase.from('polls').insert([
                {
                    title: pollTitle,
                    description: pollDesc || null,
                    options: formattedOptions,
                    is_active: true
                }
            ]);

            if (error) throw error;

            alert('Voting poll created successfully!');
            setShowCreateModal(false);
            setPollTitle('');
            setPollDescription('');
            setOptions(['Option 1', 'Option 2']);
            fetchPolls();
        } catch (err) {
            alert('Failed to create poll: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePollStatus = async (pollId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('polls')
                .update({ is_active: !currentStatus })
                .eq('id', pollId);

            if (error) throw error;
            fetchPolls();
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    const handleDeletePoll = async (pollId) => {
        if (!window.confirm('Are you sure you want to delete this poll?')) return;
        try {
            const { error } = await supabase.from('polls').delete().eq('id', pollId);
            if (error) throw error;
            setPolls(polls.filter(p => p.id !== pollId));
        } catch (err) {
            alert('Failed to delete poll: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/admin/dashboard"
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                Alumni Voting & Polls Manager
                                <span
                                    className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${liveConnected
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                            : 'bg-slate-800 text-slate-500 border-slate-700'
                                        }`}
                                    title={liveConnected ? 'Live updates connected' : 'Connecting...'}
                                >
                                    <Radio size={10} className={liveConnected ? 'animate-pulse' : ''} />
                                    {liveConnected ? 'Live' : 'Connecting'}
                                </span>
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Create election polls and gather member decisions in real-time.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                    >
                        <Plus size={16} />
                        <span>Create New Poll</span>
                    </button>
                </div>

                {/* Polls Grid */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={32} className="animate-spin text-emerald-500" />
                        <p className="text-xs">Loading active polls...</p>
                    </div>
                ) : polls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {polls.map((poll) => {
                            const pollTally = voteTallies[poll.id] || { counts: {}, total: 0 };
                            const totalVotes = pollTally.total;

                            return (
                                <div key={poll.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 flex flex-col justify-between shadow-xl">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${poll.is_active
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                {poll.is_active ? 'Active Poll' : 'Closed'}
                                            </span>
                                            <button
                                                onClick={() => handleDeletePoll(poll.id)}
                                                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                                title="Delete Poll"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <h3 className="text-base font-bold text-white">{poll.title}</h3>
                                        {poll.description && <p className="text-xs text-slate-400">{poll.description}</p>}

                                        {/* Total votes counter */}
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
                                            <Users size={13} className="text-emerald-400" />
                                            <span>
                                                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast
                                            </span>
                                        </div>

                                        {/* Live results with progress bars */}
                                        <div className="space-y-2.5 pt-2">
                                            {poll.options?.map((opt) => {
                                                const optCount = pollTally.counts[opt.id] || 0;
                                                const pct = totalVotes > 0 ? Math.round((optCount / totalVotes) * 100) : 0;

                                                return (
                                                    <div key={opt.id} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-300 font-medium">{opt.text}</span>
                                                            <span className="text-slate-400 font-semibold">
                                                                {optCount} · {pct}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                                        <button
                                            onClick={() => handleTogglePollStatus(poll.id, poll.is_active)}
                                            className="text-xs text-slate-400 hover:text-white font-medium underline"
                                        >
                                            {poll.is_active ? 'Close Voting' : 'Re-open Poll'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                        <Vote size={40} className="mx-auto text-slate-600" />
                        <p className="text-sm font-medium">No polls or voting events created yet.</p>
                    </div>
                )}

            </div>

            {/* CREATE POLL MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Create Voting Poll</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePoll} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Poll Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={pollTitle}
                                    onChange={(e) => setPollTitle(e.target.value)}
                                    placeholder="e.g. Executive Committee Election 2026"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Description (Optional)</label>
                                <textarea
                                    rows="2"
                                    value={pollDesc}
                                    onChange={(e) => setPollDescription(e.target.value)}
                                    placeholder="Brief explanation..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-slate-300 font-medium">Voting Options *</label>
                                {options.map((optText, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={optText}
                                            onChange={(e) => handleOptionChange(e.target.value, index)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOptionInput(index)}
                                            className="text-slate-500 hover:text-rose-400 p-1"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddOptionInput}
                                    className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1 pt-1"
                                >
                                    <Plus size={14} /> Add Another Option
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <span>Publish Poll</span>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}