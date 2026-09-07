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
    Award,
    Bell,
    Newspaper,
    Send,
    PlusCircle,
    Upload,
    LinkIcon,
    X,
    Images,
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

    // Notifications & Announcements State
    const [notifications, setNotifications] = useState([]);

    // Article Submission State
    const [myArticles, setMyArticles] = useState([]);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [submittingArticle, setSubmittingArticle] = useState(false);
    const [articleData, setArticleData] = useState({
        title: '',
        content: '',
    });

    // Multi-photo state for the article being composed.
    // Each entry: { id, source: 'file' | 'url', file?, url?, previewUrl }
    // pendingArticleImages[0] is always the cover photo.
    const [pendingArticleImages, setPendingArticleImages] = useState([]);
    const [articleImageUrlInput, setArticleImageUrlInput] = useState('');
    const articleFileInputRef = useRef(null);

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

            // 6. Fetch System Notifications / Announcements
            const { data: notifData, error: notifErr } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (!notifErr) setNotifications(notifData || []);

            // 7. Fetch this member's own submitted articles
            if (dbUser) {
                const { data: articlesData, error: articlesErr } = await supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('user_id', dbUser.id)
                    .order('created_at', { ascending: false });

                if (!articlesErr) setMyArticles(articlesData || []);
            }

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

    // --- Multi-photo helpers for the article submission modal ---

    const convertFileToBase64Async = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleArticleFilesSelected = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newEntries = files.map((file) => ({
            id: crypto.randomUUID(),
            source: 'file',
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        setPendingArticleImages((prev) => [...prev, ...newEntries]);
        if (articleFileInputRef.current) articleFileInputRef.current.value = '';
    };

    const handleAddArticleImageUrl = () => {
        const trimmed = articleImageUrlInput.trim();
        if (!trimmed) return;

        setPendingArticleImages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), source: 'url', url: trimmed, previewUrl: trimmed },
        ]);
        setArticleImageUrlInput('');
    };

    const handleRemoveArticleImage = (id) => {
        setPendingArticleImages((prev) => {
            const target = prev.find((p) => p.id === id);
            if (target && target.source === 'file' && target.previewUrl) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter((p) => p.id !== id);
        });
    };

    const handleMakeArticleCover = (id) => {
        setPendingArticleImages((prev) => {
            const index = prev.findIndex((p) => p.id === id);
            if (index <= 0) return prev;
            const copy = [...prev];
            const [item] = copy.splice(index, 1);
            copy.unshift(item);
            return copy;
        });
    };

    const resetArticleForm = () => {
        pendingArticleImages.forEach((p) => {
            if (p.source === 'file' && p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        setPendingArticleImages([]);
        setArticleImageUrlInput('');
        setArticleData({ title: '', content: '' });
    };

    const closeArticleModal = () => {
        setShowArticleModal(false);
        resetArticleForm();
    };

    // Submit a New Article for Admin Review
    const handleSubmitArticle = async (e) => {
        e.preventDefault();
        setSubmittingArticle(true);
        try {
            const generatedSlug = `${articleData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '')}-${Date.now()}`;

            // Resolve every pending photo (file -> base64, url -> as-is).
            // pendingArticleImages[0] is always the cover photo.
            const resolvedImages = [];
            for (const item of pendingArticleImages) {
                if (item.source === 'file') {
                    resolvedImages.push(await convertFileToBase64Async(item.file));
                } else {
                    resolvedImages.push(item.url);
                }
            }

            const { error } = await supabase.from('blog_posts').insert([
                {
                    title: articleData.title,
                    slug: generatedSlug,
                    content: articleData.content,
                    images: resolvedImages,
                    featured_image_url: resolvedImages[0] || null,
                    author_name: currentUser.full_name,
                    user_id: currentUser.id,
                    status: 'pending',
                },
            ]);

            if (error) throw error;

            alert('Article submitted successfully! It will appear once approved by an admin.');
            closeArticleModal();
            fetchMemberData();
        } catch (err) {
            alert('Failed to submit article: ' + err.message);
        } finally {
            setSubmittingArticle(false);
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

    // Helper: get the image list for a saved article, falling back to the
    // legacy single featured_image_url for older articles.
    const getArticleImages = (article) => {
        if (Array.isArray(article.images) && article.images.length > 0) return article.images;
        if (article.featured_image_url) return [article.featured_image_url];
        return [];
    };

    if (loading) {
        return (
            <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-center items-center gap-3 font-sans px-4 text-center">
                <Loader2 size={36} className="animate-spin text-emerald-500" />
                <p className="text-xs font-medium text-slate-400">Loading Member Portal...</p>
            </div>
        );
    }

    const memberIdString = currentUser?.index_number || `HAMI-OBA-${String(currentUser?.id || 1).padStart(2, '0')}`;
    const formattedIssuedDate = currentUser?.card_issued_at ? new Date(currentUser.card_issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const formattedExpiryDate = currentUser?.card_expires_at ? new Date(currentUser.card_expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
            <Navbar />

            <main className="pt-24 sm:pt-28 pb-16 sm:pb-20 px-3 xs:px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow space-y-5 sm:space-y-8">

                {/* Top Profile Header */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left w-full sm:w-auto min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-lg shrink-0">
                            {currentUser?.profile_image_url ? (
                                <img src={currentUser.profile_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl sm:text-3xl font-bold text-emerald-400 uppercase">
                                    {currentUser?.full_name?.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0 max-w-full">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white break-words">
                                {currentUser?.full_name}
                            </h1>
                            <p className="text-[11px] sm:text-xs text-emerald-400 font-medium mt-0.5 break-words">
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
                        className="w-full sm:w-auto shrink-0 px-4 py-2.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>

                {/* Dashboard Tabs Navigation */}
                <div className="-mx-3 xs:-mx-4 sm:mx-0 px-3 xs:px-4 sm:px-1.5">
                    <div className="flex overflow-x-auto scrollbar-none gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md snap-x snap-mandatory">
                        {[
                            { id: 'overview', label: 'Overview & Card', icon: CreditCard },
                            { id: 'edit-profile', label: 'Edit Profile', icon: Edit },
                            { id: 'polls', label: 'Voting & Polls', icon: Vote },
                            { id: 'events', label: 'Events Schedule', icon: Calendar },
                            { id: 'live', label: 'Live Stream', icon: Video },
                            { id: 'articles', label: 'My Articles', icon: Newspaper },
                            { id: 'notifications', label: 'Notifications', icon: Bell },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`snap-start shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon size={16} className="shrink-0" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* TAB 1: OVERVIEW & MEMBERSHIP CARD */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        {/* Official Premium Digital Membership ID Card */}
                        <div>
                            {/* Gold-foil outer frame */}
                            <div
                                ref={cardRef}
                                className="relative rounded-2xl sm:rounded-[28px] p-[3px] bg-gradient-to-br from-amber-300 via-yellow-600 to-amber-400 shadow-2xl max-w-full"
                            >
                                <div className="relative rounded-[18px] sm:rounded-[26px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 xs:p-5 sm:p-8 space-y-4 sm:space-y-5 overflow-hidden">

                                    {/* Ambient glow */}
                                    <div className="absolute top-0 right-0 w-32 h-32 sm:w-44 sm:h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 w-28 h-28 sm:w-40 sm:h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                                    {/* Security watermark */}
                                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
                                        <div className="rotate-[-25deg] whitespace-nowrap text-slate-800/20 text-[9px] sm:text-[11px] font-black tracking-[0.3em] leading-[2.4] uppercase">
                                            {Array(14).fill('OFFICIAL • MAJLISUL HAMIYYEEN • OFFICIAL ').join('')}
                                        </div>
                                    </div>

                                    {/* Header */}
                                    <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3 relative z-10">
                                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md shrink-0">
                                                MH
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider truncate">Majlisul Hamiyyeen</h4>
                                                <p className="text-[8px] sm:text-[9px] text-amber-400 font-semibold tracking-widest uppercase truncate">Al Hamiya College OBA</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                                            <ShieldCheck size={22} className="sm:w-[26px] sm:h-[26px] text-amber-400" />
                                            <span className="text-[6.5px] sm:text-[7px] font-bold text-amber-400/80 tracking-widest uppercase">Premium</span>
                                        </div>
                                    </div>

                                    {/* Member Details + Photo */}
                                    <div className="flex items-center gap-3.5 sm:gap-5 relative z-10">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-amber-500/50 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                                            {currentUser?.profile_image_url ? (
                                                <img src={currentUser.profile_image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-emerald-400 font-bold text-xl sm:text-2xl uppercase">
                                                    {currentUser?.full_name?.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-xs min-w-0">
                                            <h4 className="text-[13px] sm:text-sm font-bold text-white leading-snug truncate">{currentUser?.full_name}</h4>
                                            <p className="text-[10px] sm:text-[11px] text-amber-400 font-mono font-bold truncate">ID No: {memberIdString}</p>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate"><strong className="text-slate-300">Batch:</strong> {currentUser?.batch_year}</p>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate"><strong className="text-slate-300">Country:</strong> {currentUser?.country}</p>
                                        </div>
                                    </div>

                                    {/* Hologram seal + QR row */}
                                    <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-amber-500/20 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-200 via-emerald-300 to-amber-500 flex items-center justify-center shadow-inner border border-white/40 [background-size:200%_200%] shrink-0">
                                                <Star size={15} className="text-slate-900" fill="currentColor" />
                                            </div>
                                            <div className="leading-tight">
                                                <p className="text-[8.5px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                                                    <BadgeCheck size={11} className="text-emerald-400 shrink-0" /> Verified
                                                </p>
                                                <p className="text-[7.5px] sm:text-[8px] text-slate-500">Security Hologram</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-1.5 rounded-lg shadow-inner shrink-0">
                                            <QrCode size={38} className="sm:w-11 sm:h-11 text-slate-950" />
                                        </div>
                                    </div>

                                    {/* Validity + Status */}
                                    <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2 flex-wrap text-[9.5px] sm:text-[10px] text-slate-400 relative z-10">
                                        <div>
                                            <p>Issued: <span className="text-slate-200 font-semibold">{formattedIssuedDate}</span></p>
                                            <p>Expires: <span className="text-amber-400 font-semibold">{formattedExpiryDate}</span></p>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border whitespace-nowrap ${currentUser?.card_status === 'issued'
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                            }`}>
                                            {currentUser?.card_status === 'issued' ? 'ACTIVE CARD' : currentUser?.card_status || 'PENDING'}
                                        </span>
                                    </div>

                                    {/* Signature strip */}
                                    <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-3 relative z-10">
                                        <div className="min-w-0">
                                            <p className="italic font-serif text-[13px] sm:text-sm text-slate-200 truncate">{currentUser?.full_name}</p>
                                            <p className="text-[7.5px] sm:text-[8px] text-slate-500 uppercase tracking-widest">Member Signature</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[8.5px] sm:text-[9px] font-serif italic text-amber-400">Authorized</p>
                                            <p className="text-[7.5px] sm:text-[8px] text-slate-500 uppercase tracking-widest">Issuing Authority</p>
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
                                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {updating ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
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
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 space-y-4 backdrop-blur-xl">
                            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                <Clock size={18} className="text-amber-400 shrink-0" />
                                Pending Profile Changes
                            </h3>
                            {currentUser?.pending_edits ? (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                                    <p className="font-semibold">You submitted profile edits for admin review:</p>
                                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 break-words">
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
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 max-w-2xl mx-auto space-y-6 shadow-2xl">
                        <div className="border-b border-slate-800 pb-4">
                            <h2 className="text-base sm:text-lg font-bold text-white">Update Profile Details</h2>
                            <p className="text-xs text-slate-400 mt-1">Changes require admin verification before appearing publicly.</p>
                        </div>

                        <form onSubmit={handleSaveProfileEdits} className="space-y-4 text-xs">
                            {/* Photo Picker */}
                            <div className="flex flex-col items-center justify-center pb-2">
                                <div className="relative group">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-lg">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={26} className="text-slate-500" />
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <span className="text-[10px] text-slate-500 mt-2 text-center">Click photo to update picture</span>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                                <input type="text" required value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:py-2 text-white focus:outline-none focus:border-emerald-500" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Phone / WhatsApp *</label>
                                    <input type="text" required value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:py-2 text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Batch Year *</label>
                                    <input type="number" required value={profileData.batch_year} onChange={(e) => setProfileData({ ...profileData, batch_year: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:py-2 text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Occupation *</label>
                                <input type="text" required value={profileData.occupation} onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:py-2 text-white focus:outline-none focus:border-emerald-500" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Company (Optional)</label>
                                    <input type="text" value={profileData.company_name} onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:py-2 text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Country *</label>
                                    <input type="text" required value={profileData.country} onChange={(e) => setProfileData({ ...profileData, country: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:py-2 text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                            </div>

                            <button type="submit" disabled={updating} className="w-full py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
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
                            <h2 className="text-base sm:text-lg font-bold text-white">Active Alumni Voting & Polls</h2>
                            <p className="text-xs text-slate-400 mt-1">Cast your vote on association decisions and elections.</p>
                        </div>

                        {polls.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {polls.map((poll) => {
                                    const hasVoted = Boolean(userVotes[poll.id]);
                                    const selectedOptId = userVotes[poll.id];

                                    return (
                                        <div key={poll.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 backdrop-blur-xl">
                                            <h3 className="text-sm sm:text-base font-bold text-white break-words">{poll.title}</h3>
                                            {poll.description && <p className="text-xs text-slate-400 break-words">{poll.description}</p>}

                                            <div className="space-y-2 pt-2">
                                                {poll.options?.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => !hasVoted && handleCastVote(poll.id, opt.id)}
                                                        disabled={hasVoted}
                                                        className={`w-full p-3 rounded-xl border text-xs font-semibold text-left flex items-center justify-between gap-2 transition-all ${selectedOptId === opt.id
                                                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                                                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                                            }`}
                                                    >
                                                        <span className="break-words">{opt.text}</span>
                                                        {selectedOptId === opt.id && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
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
                            <h2 className="text-base sm:text-lg font-bold text-white">Upcoming Events & Programs</h2>
                            <p className="text-xs text-slate-400 mt-1">Check out scheduled college conventions and reunions, and let us know if you're coming.</p>
                        </div>

                        {events.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {events.map((ev) => {
                                    const myRsvp = eventRsvps[ev.id];
                                    const isResponding = rsvpLoading === ev.id;

                                    return (
                                        <div key={ev.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-3 backdrop-blur-xl flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-block">
                                                    {ev.category || 'Program'}
                                                </span>
                                                <h3 className="text-sm sm:text-base font-bold text-white break-words">{ev.title}</h3>
                                                <p className="text-xs text-slate-400 line-clamp-3 break-words">{ev.description}</p>
                                            </div>

                                            <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 space-y-1">
                                                <div className="flex items-center gap-1.5"><Calendar size={13} className="text-emerald-400 shrink-0" /> <span className="break-words">{ev.event_date} at {ev.event_time}</span></div>
                                                <div className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-400 shrink-0" /> <span className="break-words">{ev.location}</span></div>
                                            </div>

                                            {/* RSVP Section */}
                                            <div className="border-t border-slate-800/80 pt-3">
                                                {myRsvp ? (
                                                    <div className="space-y-1.5">
                                                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${myRsvp === 'attending' ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}>
                                                            {myRsvp === 'attending' ? <CheckCircle2 size={14} className="shrink-0" /> : <XCircle size={14} className="shrink-0" />}
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
                                                                className="flex-1 py-2 sm:py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-colors disabled:opacity-50"
                                                            >
                                                                {isResponding ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                                                <span className="whitespace-nowrap">Yes, I'll come</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleRsvp(ev.id, 'not_attending')}
                                                                disabled={isResponding}
                                                                className="flex-1 py-2 sm:py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-rose-500/30 transition-colors disabled:opacity-50"
                                                            >
                                                                {isResponding ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                                                                <span className="whitespace-nowrap">Sorry, can't</span>
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
                            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                <Radio size={20} className="text-rose-500 animate-pulse shrink-0" />
                                Live Video Stream
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Watch live coverage of college conventions and ceremonies.</p>
                        </div>

                        {liveStreams.length > 0 ? (
                            <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
                                {liveStreams.map((stream) => (
                                    <div key={stream.id} className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6">
                                        <div className="aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                                            <iframe src={stream.stream_url} title={stream.title} className="w-full h-full" allowFullScreen />
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-bold text-white break-words">{stream.title}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 text-center py-12">No live stream is currently active.</p>
                        )}
                    </div>
                )}

                {/* TAB 6: MY ARTICLES */}
                {activeTab === 'articles' && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                    <Newspaper size={20} className="text-cyan-400 shrink-0" />
                                    My Articles
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Submit news or stories for the association blog. Admin review is required before publishing.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowArticleModal(true)}
                                className="shrink-0 px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                            >
                                <PlusCircle size={16} />
                                <span>Submit New Article</span>
                            </button>
                        </div>

                        {myArticles.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {myArticles.map((article) => {
                                    const isPublished = article.status === 'published';
                                    const isRejected = article.status === 'rejected';
                                    const articleImages = getArticleImages(article);
                                    const formattedDate = article.created_at
                                        ? new Date(article.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })
                                        : '';

                                    return (
                                        <div
                                            key={article.id}
                                            className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-3 backdrop-blur-xl"
                                        >
                                            {articleImages.length > 0 && (
                                                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                                                    <img
                                                        src={articleImages[0]}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {articleImages.length > 1 && (
                                                        <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 border border-slate-800 flex items-center gap-1">
                                                            <Images size={11} />
                                                            <span>{articleImages.length} photos</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm sm:text-base font-bold text-white break-words">
                                                    {article.title}
                                                </h3>
                                                <span
                                                    className={`shrink-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize whitespace-nowrap ${isPublished
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                        : isRejected
                                                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                        }`}
                                                >
                                                    {article.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 line-clamp-3 break-words">
                                                {article.content}
                                            </p>
                                            <p className="text-[10px] text-slate-500">Submitted {formattedDate}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 space-y-2">
                                <Newspaper size={28} className="text-slate-700 mx-auto" />
                                <p className="text-xs text-slate-500">You haven't submitted any articles yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 7: NOTIFICATIONS & ANNOUNCEMENTS */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-800 pb-4">
                            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                <Bell size={20} className="text-amber-400 shrink-0" />
                                Notifications & Announcements
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Official updates and announcements from the association.
                            </p>
                        </div>

                        {notifications.length > 0 ? (
                            <div className="space-y-4 max-w-3xl mx-auto">
                                {notifications.map((notif) => {
                                    const formattedDate = notif.created_at
                                        ? new Date(notif.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })
                                        : '';

                                    return (
                                        <div
                                            key={notif.id}
                                            className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="text-sm sm:text-base font-bold text-white break-words flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                                    {notif.title}
                                                </h3>
                                                <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0 mt-0.5">
                                                    {formattedDate}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 break-words leading-relaxed pl-4">
                                                {notif.message}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 space-y-2">
                                <Bell size={28} className="text-slate-700 mx-auto" />
                                <p className="text-xs text-slate-500">No notifications or announcements yet.</p>
                            </div>
                        )}
                    </div>
                )}

            </main>

            {/* Submit New Article Modal */}
            {showArticleModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Newspaper size={18} className="text-cyan-400" />
                                Submit New Article
                            </h3>
                            <button
                                onClick={closeArticleModal}
                                className="text-slate-400 hover:text-white"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <p className="text-[11px] text-slate-400 -mt-1">
                            Your article will be reviewed by an admin before it appears on the public blog.
                        </p>

                        <form onSubmit={handleSubmitArticle} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Article Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={articleData.title}
                                    onChange={(e) => setArticleData({ ...articleData, title: e.target.value })}
                                    placeholder="e.g. My Reflections on This Year's Reunion"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Multi-photo uploader */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                    <label className="block text-xs font-medium text-slate-300">
                                        Photos {pendingArticleImages.length > 0 && `(${pendingArticleImages.length})`}
                                    </label>
                                    <span className="text-[10px] text-slate-500">
                                        First photo (or the one you pin) becomes the cover
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        type="button"
                                        onClick={() => articleFileInputRef.current?.click()}
                                        className="flex-1 py-2 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-emerald-500 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Upload size={14} />
                                        <span>Choose Photos from Device</span>
                                    </button>
                                    <input
                                        ref={articleFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleArticleFilesSelected}
                                        className="hidden"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="url"
                                            value={articleImageUrlInput}
                                            onChange={(e) => setArticleImageUrlInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddArticleImageUrl();
                                                }
                                            }}
                                            placeholder="Or paste an image URL..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddArticleImageUrl}
                                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>

                                {pendingArticleImages.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                                        {pendingArticleImages.map((entry, index) => (
                                            <div
                                                key={entry.id}
                                                className={`relative aspect-square rounded-xl overflow-hidden bg-slate-950 border-2 transition-all ${index === 0 ? 'border-emerald-500' : 'border-slate-800'
                                                    }`}
                                            >
                                                <img src={entry.previewUrl} alt="Selected" className="w-full h-full object-cover" />

                                                {index === 0 && (
                                                    <div className="absolute bottom-1 left-1 right-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-semibold rounded-md py-0.5 text-center flex items-center justify-center gap-1">
                                                        <Star size={9} className="fill-white" />
                                                        <span>Cover</span>
                                                    </div>
                                                )}

                                                <div className="absolute top-1 right-1 flex flex-col gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveArticleImage(entry.id)}
                                                        className="p-1 rounded-md bg-rose-600/90 hover:bg-rose-500 text-white shadow-md transition-colors"
                                                        title="Remove"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                    {index !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMakeArticleCover(entry.id)}
                                                            className="p-1 rounded-md bg-slate-900/90 hover:bg-emerald-600 text-white shadow-md transition-colors"
                                                            title="Set as cover"
                                                        >
                                                            <Star size={11} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Content *</label>
                                <textarea
                                    rows="6"
                                    required
                                    value={articleData.content}
                                    onChange={(e) => setArticleData({ ...articleData, content: e.target.value })}
                                    placeholder="Write your article content here..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingArticle}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submittingArticle ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} />
                                        <span>Submit for Review</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}