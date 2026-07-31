import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    Clock,
    Plus,
    X,
    Edit,
    Trash2,
    Loader2,
    ArrowLeft,
    LayoutDashboard,
    Users,
    FileText,
    Image as ImageIcon,
    Vote,
    Video,
    Globe,
    LogOut,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const CATEGORY_OPTIONS = ['Convention', 'Reunion', 'Meeting', 'Workshop', 'Ceremony', 'Sports', 'Other'];

const emptyEvent = {
    title: '',
    description: '',
    category: 'Convention',
    event_date: '',
    event_time: '',
    location: '',
};

export default function AdminEvents() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyEvent);

    // RSVP counts per event: { [eventId]: { attending: n, not_attending: n } }
    const [rsvpCounts, setRsvpCounts] = useState({});

    // Attendance modal: { event, attending: [], notAttending: [], loading }
    const [attendanceModal, setAttendanceModal] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);

            // Fetch RSVP counts for all events in one go
            const { data: rsvpData, error: rsvpErr } = await supabase
                .from('event_rsvps')
                .select('event_id, status');

            if (!rsvpErr) {
                const counts = {};
                (rsvpData || []).forEach((r) => {
                    if (!counts[r.event_id]) counts[r.event_id] = { attending: 0, not_attending: 0 };
                    if (r.status === 'attending') counts[r.event_id].attending += 1;
                    else counts[r.event_id].not_attending += 1;
                });
                setRsvpCounts(counts);
            }
        } catch (err) {
            console.error('Error loading events:', err);
        } finally {
            setLoading(false);
        }
    };

    // Open the modal showing everyone who has responded (attending / not attending)
    const openAttendanceModal = async (ev) => {
        setAttendanceModal({ event: ev, attending: [], notAttending: [], loading: true });
        try {
            const { data, error } = await supabase
                .from('event_rsvps')
                .select('status, users(full_name, email, batch_year, occupation)')
                .eq('event_id', ev.id)
                .order('responded_at', { ascending: false });

            if (error) throw error;

            const attending = (data || []).filter((r) => r.status === 'attending');
            const notAttending = (data || []).filter((r) => r.status === 'not_attending');
            setAttendanceModal({ event: ev, attending, notAttending, loading: false });
        } catch (err) {
            alert('Failed to load attendance list: ' + err.message);
            setAttendanceModal(null);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData(emptyEvent);
        setShowModal(true);
    };

    const openEditModal = (ev) => {
        setEditingId(ev.id);
        setFormData({
            title: ev.title || '',
            description: ev.description || '',
            category: ev.category || 'Convention',
            event_date: ev.event_date || '',
            event_time: ev.event_time || '',
            location: ev.location || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData(emptyEvent);
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const uniqueSuffix = Math.random().toString(36).substring(2, 7);
            const generatedSlug = (formData.title
                ? formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                : 'event') + '-' + uniqueSuffix;

            const payload = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                event_date: formData.event_date,
                event_time: formData.event_time,
                location: formData.location,
                slug: generatedSlug,
            };

            if (editingId) {
                const { error } = await supabase
                    .from('events')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                alert('Event updated successfully!');
            } else {
                const { error } = await supabase.from('events').insert([payload]);
                if (error) throw error;
                alert('Event created and published to member schedule!');
            }

            closeModal();
            fetchEvents();
        } catch (err) {
            alert('Failed to save event: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Delete this event? This will remove it from the member schedule too.')) return;
        try {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
            setEvents(events.filter((e) => e.id !== id));
        } catch (err) {
            alert('Failed to delete event: ' + err.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col justify-between p-5">
                <div className="space-y-8">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            MH
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white leading-none">Majlisul Hamiyyeen</h2>
                            <p className="text-[10px] text-emerald-400 font-medium mt-1">Admin Control Panel</p>
                        </div>
                    </Link>

                    <nav className="space-y-1.5">
                        <Link
                            to="/admin"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/admin/members"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                            <Users size={18} />
                            <span>Manage Members</span>
                        </Link>

                        <Link
                            to="/admin/content"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                            <FileText size={18} />
                            <span>News & Articles</span>
                        </Link>

                        <Link
                            to="/admin/images"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                            <ImageIcon size={18} />
                            <span>Manage Images</span>
                        </Link>

                        <Link
                            to="/admin/events"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 font-semibold transition-colors"
                        >
                            <Calendar size={18} />
                            <span>Events Schedule</span>
                        </Link>

                        <Link
                            to="/admin/polls"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                            <Vote size={18} />
                            <span>Voting & Polls</span>
                        </Link>

                        <Link
                            to="/admin/streams"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                            <Video size={18} />
                            <span>Live Streaming</span>
                        </Link>
                    </nav>
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-2">
                    <Link
                        to="/"
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
                    >
                        <Globe size={16} />
                        <span>Visit Website</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs font-medium transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <header className="bg-slate-900/60 border-b border-slate-800 p-4 sm:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <Link to="/admin" className="md:hidden text-slate-400 hover:text-white">
                            <ArrowLeft size={18} />
                        </Link>
                        <h1 className="text-lg font-bold text-white">Events Schedule</h1>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                    >
                        <Plus size={16} />
                        <span>Add New Event</span>
                    </button>
                </header>

                <main className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
                    <p className="text-xs text-slate-400">
                        Events added here appear instantly on every member's <strong className="text-slate-300">Events Schedule</strong> tab. Members can RSVP, and you can review who's coming below.
                    </p>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-emerald-500" />
                        </div>
                    ) : events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((ev) => {
                                const isPast = ev.event_date && ev.event_date < today;
                                const counts = rsvpCounts[ev.id] || { attending: 0, not_attending: 0 };
                                return (
                                    <div
                                        key={ev.id}
                                        className={`bg-slate-900/80 border rounded-3xl p-6 space-y-3 backdrop-blur-xl flex flex-col justify-between ${isPast ? 'border-slate-800/60 opacity-60' : 'border-slate-800'
                                            }`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                    {ev.category || 'Program'}
                                                </span>
                                                {isPast && (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                                        Past
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-base font-bold text-white">{ev.title}</h3>
                                            <p className="text-xs text-slate-400 line-clamp-3">{ev.description}</p>
                                        </div>

                                        <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-emerald-400" />
                                                {ev.event_date} at {ev.event_time}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={13} className="text-emerald-400" /> {ev.location}
                                            </div>
                                        </div>

                                        {/* RSVP Summary */}
                                        <div className="flex items-center gap-3 text-[11px] border-t border-slate-800/80 pt-3">
                                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                                <CheckCircle2 size={12} /> {counts.attending} attending
                                            </span>
                                            <span className="flex items-center gap-1 text-rose-400 font-semibold">
                                                <XCircle size={12} /> {counts.not_attending} can't come
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => openAttendanceModal(ev)}
                                            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <Users size={13} /> View Attendance List
                                        </button>

                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                onClick={() => openEditModal(ev)}
                                                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <Edit size={13} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEvent(ev.id)}
                                                className="flex-1 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-rose-500/30"
                                            >
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 space-y-3">
                            <Calendar size={40} className="text-slate-700 mx-auto" />
                            <p className="text-sm text-slate-500">No events scheduled yet.</p>
                            <button
                                onClick={openAddModal}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all"
                            >
                                <Plus size={16} /> Create your first event
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Add / Edit Event Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingId ? 'Edit Event' : 'Add New Event'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Event Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Annual Alumni Convention 2026"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Description *</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief details members will see on their schedule..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                                >
                                    {CATEGORY_OPTIONS.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Time *</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.event_time}
                                        onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Location *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Al Hamiya Arabic College Main Hall"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>{editingId ? 'Update Event' : 'Publish Event'}</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendance List Modal */}
            {attendanceModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white">{attendanceModal.event.title}</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Member RSVP responses</p>
                            </div>
                            <button onClick={() => setAttendanceModal(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {attendanceModal.loading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 size={28} className="animate-spin text-emerald-500" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Attending column */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                                        <CheckCircle2 size={14} /> Attending ({attendanceModal.attending.length})
                                    </h4>
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {attendanceModal.attending.length > 0 ? (
                                            attendanceModal.attending.map((r, i) => (
                                                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
                                                    <p className="font-semibold text-white">{r.users?.full_name || 'Unknown Member'}</p>
                                                    <p className="text-slate-400 text-[10px]">{r.users?.email}</p>
                                                    <p className="text-slate-500 text-[10px]">
                                                        Batch {r.users?.batch_year} {r.users?.occupation ? `• ${r.users.occupation}` : ''}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 text-xs">No confirmations yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Not attending column */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                                        <XCircle size={14} /> Not Attending ({attendanceModal.notAttending.length})
                                    </h4>
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {attendanceModal.notAttending.length > 0 ? (
                                            attendanceModal.notAttending.map((r, i) => (
                                                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
                                                    <p className="font-semibold text-white">{r.users?.full_name || 'Unknown Member'}</p>
                                                    <p className="text-slate-400 text-[10px]">{r.users?.email}</p>
                                                    <p className="text-slate-500 text-[10px]">
                                                        Batch {r.users?.batch_year} {r.users?.occupation ? `• ${r.users.occupation}` : ''}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 text-xs">No declines yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}