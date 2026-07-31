import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Video,
    Plus,
    Trash2,
    Radio,
    Loader2,
    X,
    Calendar,
    MapPin
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function AdminStreams() {
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // New Stream Form
    const [title, setTitle] = useState('');
    const [streamUrl, setStreamUrl] = useState('');

    useEffect(() => {
        fetchStreams();
    }, []);

    const fetchStreams = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('live_streams').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setStreams(data || []);
        } catch (err) {
            console.error('Error fetching streams:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Automatically cleans and converts YouTube URLs or <iframe> codes into Embed URLs
    const parseEmbedUrl = (input) => {
        if (!input) return '';
        try {
            let cleanInput = input.trim();

            // If the admin pasted the entire <iframe ... src="..." ...> tag
            if (cleanInput.includes('<iframe')) {
                const srcMatch = cleanInput.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                    cleanInput = srcMatch[1];
                }
            }

            // Check if it's already an embed URL
            if (cleanInput.includes('/embed/')) return cleanInput;

            let videoId = '';
            // Handle youtu.be/ID
            if (cleanInput.includes('youtu.be/')) {
                videoId = cleanInput.split('youtu.be/')[1]?.split('?')[0];
            }
            // Handle youtube.com/watch?v=ID or youtube.com/live/ID
            else if (cleanInput.includes('youtube.com')) {
                const urlObj = new URL(cleanInput);
                if (urlObj.searchParams.get('v')) {
                    videoId = urlObj.searchParams.get('v');
                } else {
                    const parts = urlObj.pathname.split('/');
                    videoId = parts[parts.length - 1];
                }
            }

            return videoId ? `https://www.youtube.com/embed/${videoId}` : cleanInput;
        } catch (e) {
            return input;
        }
    };

    const handleCreateStream = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formattedEmbedUrl = parseEmbedUrl(streamUrl);

            const { error } = await supabase.from('live_streams').insert([
                {
                    title,
                    stream_url: formattedEmbedUrl,
                    is_live: true
                }
            ]);

            if (error) throw error;

            alert('Live stream added successfully!');
            setShowModal(false);
            setTitle('');
            setStreamUrl('');
            fetchStreams();
        } catch (err) {
            alert('Failed to add live stream: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStream = async (id) => {
        if (!window.confirm('Are you sure you want to delete this live stream?')) return;
        try {
            const { error } = await supabase.from('live_streams').delete().eq('id', id);
            if (error) throw error;
            setStreams(streams.filter(s => s.id !== id));
        } catch (err) {
            alert('Failed to delete stream: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/dashboard" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Live Stream Manager</h1>
                            <p className="text-xs text-slate-400 mt-0.5">Embed YouTube or Vimeo live video streams for members.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                    >
                        <Plus size={16} />
                        <span>Add Live Stream</span>
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={32} className="animate-spin text-emerald-500" />
                        <p className="text-xs">Loading streams...</p>
                    </div>
                ) : streams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {streams.map((s) => (
                            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
                                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                                    <iframe src={s.stream_url} title={s.title} className="w-full h-full" allowFullScreen />
                                </div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                                    <button onClick={() => handleDeleteStream(s.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                        <Video size={40} className="mx-auto text-slate-600" />
                        <p className="text-sm font-medium">No live video streams published yet.</p>
                    </div>
                )}

            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Add Live Stream Embed</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateStream} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Stream Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Annual Convention Live Stream"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">YouTube URL or &lt;iframe&gt; Code *</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={streamUrl}
                                    onChange={(e) => setStreamUrl(e.target.value)}
                                    placeholder='Paste YouTube URL or full <iframe ...> code here'
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">You can paste either a standard video link or the full YouTube embed code.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <span>Publish Stream</span>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}