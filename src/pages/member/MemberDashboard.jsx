import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User,
    CreditCard,
    Vote,
    Calendar,
    Video,
    Edit,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Camera,
    Save,
    MapPin,
    Briefcase,
    Mail,
    Phone,
    LogOut,
    Radio,
    ShieldCheck,
    QrCode,
    Star,
    BadgeCheck,
    Download,
    Award
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../supabaseClient';

export default function MemberDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [downloadingCard, setDownloadingCard] = useState(false);

    // Current User State
    const [currentUser, setCurrentUser] = useState(null);
    const [profileData, setProfileData] = useState({});

    // Profile Image Upload State
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);

    // Polls & Votes State
    const [polls, setPolls] = useState([]);
    const [userVotes, setUserVotes] = useState({});

    // Events State
    const [events, setEvents] = useState([]);

    // Event RSVP State (per-event: 'attending' | 'not_attending')
    const [eventRsvps, setEventRsvps] = useState({});
    const [rsvpLoading, setRsvpLoading] = useState(null); // holds the event id currently submitting

    // Live Stream State
    const [liveStreams, setLiveStreams] = useState([]);

    // Ref to the physical card element so we can capture it as an image
    const cardRef = useRef(null);

    useEffect(() => {
        fetchMemberData();
    }, []);

    const fetchMemberData = async () => {
        setLoading(true);
        try {
            // 1. Get logged in Auth User
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                navigate('/login');
                return;
            }

            // 2. Fetch User Profile from DB
            const { data: dbUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', authUser.email)
                .single();

            if (dbUser) {
                setCurrentUser(dbUser);
                setProfileData({
                    full_name: dbUser.full_name || '',
                    phone: dbUser.phone || '',
                    batch_year: dbUser.batch_year || '',
                    occupation: dbUser.occupation || '',
                    company_name: dbUser.company_name || '',
                    country: dbUser.country || 'Sri Lanka',
                    address: dbUser.address || '',
                });
                setImagePreview(dbUser.profile_image_url || null);
            }

            // 3. Fetch Polls & User Votes
            const { data: pollsData } = await supabase.from('polls').select('*').eq('is_active', true);
            setPolls(pollsData || []);

            if (dbUser) {
                const { data: votesData } = await supabase
                    .from('poll_votes')
                    .select('*')
                    .eq('user_id', dbUser.id);

                const votesMap = {};
                (votesData || []).forEach(v => { votesMap[v.poll_id] = v.option_id; });
                setUserVotes(votesMap);
            }

            // 4. Fetch Upcoming Events Schedule
            const { data: eventsData } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });
            setEvents(eventsData || []);

            // 4b. Fetch this member's RSVP responses for those events
            if (dbUser) {
                const { data: rsvpData } = await supabase
                    .from('event_rsvps')
                    .select('event_id, status')
                    .eq('user_id', dbUser.id);

                const rsvpMap = {};
                (rsvpData || []).forEach(r => { rsvpMap[r.event_id] = r.status; });
                setEventRsvps(rsvpMap);
            }

            // 5. Fetch Live Video Streams
            const { data: streamsData } = await supabase.from('live_streams').select('*');
            setLiveStreams(streamsData || []);

        } catch (err) {
            console.error('Error loading member dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    // Compress & Convert Image to Base64
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 400;

                if (width > height) {
                    if (width > maxDim) { height *= maxDim / width; width = maxDim; }
                } else {
                    if (height > maxDim) { width *= maxDim / height; height = maxDim; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                setImagePreview(compressed);
                setImageBase64(compressed);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Submit Profile Updates for Admin Approval
    const handleSaveProfileEdits = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const pendingEditsObj = {
                ...profileData,
                profile_image_url: imageBase64 || currentUser.profile_image_url,
                requested_at: new Date(),
            };

            const { error } = await supabase
                .from('users')
                .update({ pending_edits: pendingEditsObj })
                .eq('id', currentUser.id);

            if (error) throw error;

            alert('Profile update submitted! Changes are pending admin verification.');
            fetchMemberData();
        } catch (err) {
            alert('Failed to submit updates: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    // Apply for Membership Card
    const handleApplyMembershipCard = async () => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    card_status: 'requested',
                    card_requested_at: new Date(),
                })
                .eq('id', currentUser.id);

            if (error) throw error;

            alert('Membership card application submitted successfully!');
            fetchMemberData();
        } catch (err) {
            alert('Failed to apply for card: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    // Submit Vote
    const handleCastVote = async (pollId, optionId) => {
        try {
            const { error } = await supabase.from('poll_votes').insert([
                {
                    poll_id: pollId,
                    user_id: currentUser.id,
                    option_id: optionId,
                }
            ]);

            if (error) throw error;

            setUserVotes({ ...userVotes, [pollId]: optionId });
            alert('Vote submitted successfully!');
        } catch (err) {
            alert('Failed to submit vote: ' + err.message);
        }
    };

    // Submit / Update an Event RSVP ("Yes, I'll come" or "Sorry, I can't come")
    const handleRsvp = async (eventId, status) => {
        if (!currentUser) return;
        setRsvpLoading(eventId);
        try {
            const { error } = await supabase
                .from('event_rsvps')
                .upsert(
                    {
                        event_id: eventId,
                        user_id: currentUser.id,
                        status,
                        responded_at: new Date(),
                    },
                    { onConflict: 'event_id,user_id' }
                );

            if (error) throw error;

            setEventRsvps((prev) => ({ ...prev, [eventId]: status }));
        } catch (err) {
            alert('Failed to submit your response: ' + err.message);
        } finally {
            setRsvpLoading(null);
        }
    };

    // Download the Membership Card as a high-resolution PNG image
    const handleDownloadCard = async () => {
        if (!cardRef.current) return;
        setDownloadingCard(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#020617',
                scale: 3,
                useCORS: true,
                logging: false,
            });

            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Failed to generate card image. Please try again.');
                    setDownloadingCard(false);
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${memberIdString}-membership-card.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setDownloadingCard(false);
            }, 'image/png', 1.0);
        } catch (err) {
            console.error(err);
            alert('Failed to download card: ' + err.message);
            setDownloadingCard(false);
        }
    };

    // Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-center items-center gap-3 font-sans">
                <Loader2 size={36} className="animate-spin text-emerald-500" />
                <p className="text-xs font-medium text-slate-400">Loading Member Portal...</p>
            </div>
        );
    }

    const memberIdString = currentUser?.index_number || `HAMI-OBA-${String(currentUser?.id || 1).padStart(2, '0')}`;
    const formattedIssuedDate = currentUser?.card_issued_at ? new Date(currentUser.card_issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const formattedExpiryDate = currentUser?.card_expires_at ? new Date(currentUser.card_expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow space-y-8">

                {/* Top Profile Header */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                        <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-lg shrink-0">
                            {currentUser?.profile_image_url ? (
                                <img src={currentUser.profile_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-emerald-400 uppercase">
                                    {currentUser?.full_name?.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                                {currentUser?.full_name}
                            </h1>
                            <p className="text-xs text-emerald-400 font-medium mt-0.5">
                                Batch {currentUser?.batch_year} • {currentUser?.occupation || 'Member'}
                            </p>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border mt-2 capitalize ${currentUser?.approval_status === 'approved'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                }`}>
                                <CheckCircle2 size={12} />
                                {currentUser?.approval_status} Member
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>

                {/* Dashboard Tabs Navigation */}
                <div className="flex overflow-x-auto scrollbar-none gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
                    {[
                        { id: 'overview', label: 'Overview & Card', icon: CreditCard },
                        { id: 'edit-profile', label: 'Edit Profile', icon: Edit },
                        { id: 'polls', label: 'Voting & Polls', icon: Vote },
                        { id: 'events', label: 'Events Schedule', icon: Calendar },
                        { id: 'live', label: 'Live Stream', icon: Video },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: OVERVIEW & MEMBERSHIP CARD */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Official Premium Digital Membership ID Card */}
                        <div>
                            {/* Gold-foil outer frame */}
                            <div
                                ref={cardRef}
                                className="relative rounded-[28px] p-[3px] bg-gradient-to-br from-amber-300 via-yellow-600 to-amber-400 shadow-2xl"
                            >
                                <div className="relative rounded-[26px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-5 overflow-hidden">

                                    {/* Ambient glow */}
                                    <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                                    {/* Security watermark */}
                                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
                                        <div className="rotate-[-25deg] whitespace-nowrap text-slate-800/20 text-[11px] font-black tracking-[0.3em] leading-[2.4] uppercase">
                                            {Array(14).fill('OFFICIAL • MAJLISUL HAMIYYEEN • OFFICIAL ').join('')}
                                        </div>
                                    </div>

                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-md">
                                                MH
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider">Majlisul Hamiyyeen</h4>
                                                <p className="text-[9px] text-amber-400 font-semibold tracking-widest uppercase">Al Hamiya College OBA</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <ShieldCheck size={26} className="text-amber-400" />
                                            <span className="text-[7px] font-bold text-amber-400/80 tracking-widest uppercase">Premium</span>
                                        </div>
                                    </div>

                                    {/* Member Details + Photo */}
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-amber-500/50 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                                            {currentUser?.profile_image_url ? (
                                                <img src={currentUser.profile_image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-emerald-400 font-bold text-2xl uppercase">
                                                    {currentUser?.full_name?.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <h4 className="text-sm font-bold text-white leading-snug">{currentUser?.full_name}</h4>
                                            <p className="text-[11px] text-amber-400 font-mono font-bold">ID No: {memberIdString}</p>
                                            <p className="text-[11px] text-slate-400"><strong className="text-slate-300">Batch:</strong> {currentUser?.batch_year}</p>
                                            <p className="text-[11px] text-slate-400"><strong className="text-slate-300">Country:</strong> {currentUser?.country}</p>
                                        </div>
                                    </div>

                                    {/* Hologram seal + QR row */}
                                    <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-200 via-emerald-300 to-amber-500 flex items-center justify-center shadow-inner border border-white/40 [background-size:200%_200%]">
                                                <Star size={16} className="text-slate-900" fill="currentColor" />
                                            </div>
                                            <div className="leading-tight">
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                                                    <BadgeCheck size={11} className="text-emerald-400" /> Verified
                                                </p>
                                                <p className="text-[8px] text-slate-500">Security Hologram</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-1.5 rounded-lg shadow-inner">
                                            <QrCode size={44} className="text-slate-950" />
                                        </div>
                                    </div>

                                    {/* Validity + Status */}
                                    <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                                        <div>
                                            <p>Issued: <span className="text-slate-200 font-semibold">{formattedIssuedDate}</span></p>
                                            <p>Expires: <span className="text-amber-400 font-semibold">{formattedExpiryDate}</span></p>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${currentUser?.card_status === 'issued'
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                            }`}>
                                            {currentUser?.card_status === 'issued' ? 'ACTIVE CARD' : currentUser?.card_status || 'PENDING'}
                                        </span>
                                    </div>

                                    {/* Signature strip */}
                                    <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between relative z-10">
                                        <div>
                                            <p className="italic font-serif text-sm text-slate-200">{currentUser?.full_name}</p>
                                            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Member Signature</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-serif italic text-amber-400">Authorized</p>
                                            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Issuing Authority</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Application / Download Actions (outside captured card) */}
                            <div className="pt-4">
                                {currentUser?.card_status === 'none' && (
                                    <button
                                        onClick={handleApplyMembershipCard}
                                        disabled={updating}
                                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Award size={16} />
                                        <span>Apply for Membership Card</span>
                                    </button>
                                )}
                                {currentUser?.card_status === 'requested' && (
                                    <div className="w-full py-2 text-center text-amber-400 text-xs font-semibold bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-1.5">
                                        <Clock size={14} /> Card Application Pending Admin Review
                                    </div>
                                )}
                                {currentUser?.card_status === 'issued' && (
                                    <button
                                        onClick={handleDownloadCard}
                                        disabled={downloadingCard}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {downloadingCard ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Download size={16} />
                                        )}
                                        <span>{downloadingCard ? 'Preparing Card...' : 'Download Official Membership Card'}</span>
                                    </button>
                                )}
                                {currentUser?.card_status === 'deactivated' && (
                                    <div className="w-full py-2 text-center text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                        Membership Card Deactivated. Please contact admin.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Profile Updates Alert */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-xl">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Clock size={18} className="text-amber-400" />
                                Pending Profile Changes
                            </h3>
                            {currentUser?.pending_edits ? (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                                    <p className="font-semibold">You submitted profile edits for admin review:</p>
                                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                                        <li>Name: {currentUser.pending_edits.full_name}</li>
                                        <li>Phone: {currentUser.pending_edits.phone}</li>
                                        <li>Occupation: {currentUser.pending_edits.occupation}</li>
                                    </ul>
                                    <p className="text-[10px] text-slate-400 pt-1">Once approved by an admin, your public profile will automatically update.</p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400">No pending profile changes. Your profile is up to date.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: EDIT PROFILE */}
                {activeTab === 'edit-profile' && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto space-y-6 shadow-2xl">
                        <div className="border-b border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-white">Update Profile Details</h2>
                            <p className="text-xs text-slate-400 mt-1">Changes require admin verification before appearing publicly.</p>
                        </div>

                        <form onSubmit={handleSaveProfileEdits} className="space-y-4 text-xs">
                            {/* Photo Picker */}
                            <div className="flex flex-col items-center justify-center pb-2">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-slate-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-lg">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={26} className="text-slate-500" />
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <span className="text-[10px] text-slate-500 mt-2">Click photo to update picture</span>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                                <input type="text" required value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Phone / WhatsApp *</label>
                                    <input type="text" required value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Batch Year *</label>
                                    <input type="number" required value={profileData.batch_year} onChange={(e) => setProfileData({ ...profileData, batch_year: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Occupation *</label>
                                <input type="text" required value={profileData.occupation} onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Company (Optional)</label>
                                    <input type="text" value={profileData.company_name} onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Country *</label>
                                    <input type="text" required value={profileData.country} onChange={(e) => setProfileData({ ...profileData, country: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                            </div>

                            <button type="submit" disabled={updating} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-4">
                                {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>Submit Edits for Approval</span>
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 3: VOTING & POLLS */}
                {activeTab === 'polls' && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-white">Active Alumni Voting & Polls</h2>
                            <p className="text-xs text-slate-400 mt-1">Cast your vote on association decisions and elections.</p>
                        </div>

                        {polls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {polls.map((poll) => {
                                    const hasVoted = Boolean(userVotes[poll.id]);
                                    const selectedOptId = userVotes[poll.id];

                                    return (
                                        <div key={poll.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
                                            <h3 className="text-base font-bold text-white">{poll.title}</h3>
                                            {poll.description && <p className="text-xs text-slate-400">{poll.description}</p>}

                                            <div className="space-y-2 pt-2">
                                                {poll.options?.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => !hasVoted && handleCastVote(poll.id, opt.id)}
                                                        disabled={hasVoted}
                                                        className={`w-full p-3 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all ${selectedOptId === opt.id
                                                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                                                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                                            }`}
                                                    >
                                                        <span>{opt.text}</span>
                                                        {selectedOptId === opt.id && <CheckCircle2 size={16} className="text-emerald-400" />}
                                                    </button>
                                                ))}
                                            </div>

                                            {hasVoted && (
                                                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 pt-1">
                                                    <CheckCircle2 size={14} /> You have voted in this poll.
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 text-center py-12">No active polls or voting events at this time.</p>
                        )}
                    </div>
                )}

                {/* TAB 4: EVENTS SCHEDULE */}
                {activeTab === 'events' && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-white">Upcoming Events & Programs</h2>
                            <p className="text-xs text-slate-400 mt-1">Check out scheduled college conventions and reunions, and let us know if you're coming.</p>
                        </div>

                        {events.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {events.map((ev) => {
                                    const myRsvp = eventRsvps[ev.id];
                                    const isResponding = rsvpLoading === ev.id;

                                    return (
                                        <div key={ev.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 backdrop-blur-xl flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                    {ev.category || 'Program'}
                                                </span>
                                                <h3 className="text-base font-bold text-white">{ev.title}</h3>
                                                <p className="text-xs text-slate-400 line-clamp-3">{ev.description}</p>
                                            </div>

                                            <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 space-y-1">
                                                <div className="flex items-center gap-1.5"><Calendar size={13} className="text-emerald-400" /> {ev.event_date} at {ev.event_time}</div>
                                                <div className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-400" /> {ev.location}</div>
                                            </div>

                                            {/* RSVP Section */}
                                            <div className="border-t border-slate-800/80 pt-3">
                                                {myRsvp ? (
                                                    <div className="space-y-1.5">
                                                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${myRsvp === 'attending' ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}>
                                                            {myRsvp === 'attending' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                            {myRsvp === 'attending' ? "You're attending" : "You can't attend"}
                                                        </div>
                                                        <button
                                                            onClick={() => handleRsvp(ev.id, myRsvp === 'attending' ? 'not_attending' : 'attending')}
                                                            disabled={isResponding}
                                                            className="text-[10px] text-slate-500 hover:text-slate-300 underline disabled:opacity-50"
                                                        >
                                                            {isResponding ? 'Updating...' : 'Change my response'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-[11px] text-slate-400 font-medium">Will you attend?</p>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleRsvp(ev.id, 'attending')}
                                                                disabled={isResponding}
                                                                className="flex-1 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-colors disabled:opacity-50"
                                                            >
                                                                {isResponding ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                                                Yes, I'll come
                                                            </button>
                                                            <button
                                                                onClick={() => handleRsvp(ev.id, 'not_attending')}
                                                                disabled={isResponding}
                                                                className="flex-1 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-rose-500/30 transition-colors disabled:opacity-50"
                                                            >
                                                                {isResponding ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                                                                Sorry, can't
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 text-center py-12">No upcoming events scheduled right now.</p>
                        )}
                    </div>
                )}

                {/* TAB 5: LIVE VIDEO STREAMING */}
                {activeTab === 'live' && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Radio size={20} className="text-rose-500 animate-pulse" />
                                Live Video Stream
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Watch live coverage of college conventions and ceremonies.</p>
                        </div>

                        {liveStreams.length > 0 ? (
                            <div className="space-y-8 max-w-4xl mx-auto">
                                {liveStreams.map((stream) => (
                                    <div key={stream.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
                                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                                            <iframe src={stream.stream_url} title={stream.title} className="w-full h-full" allowFullScreen />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white">{stream.title}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 text-center py-12">No live stream is currently active.</p>
                        )}
                    </div>
                )}

            </main>

            <Footer />
        </div>
    );
}