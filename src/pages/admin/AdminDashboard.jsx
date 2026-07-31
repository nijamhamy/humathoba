import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Users,
    Clock,
    FileText,
    Check,
    X,
    Search,
    LogOut,
    LayoutDashboard,
    Bell,
    Image as ImageIcon,
    Plus,
    ArrowRight,
    Upload,
    Globe,
    Quote,
    Camera,
    Loader2,
    ShieldCheck,
    Vote,
    Video,
    Settings,
    Calendar,
    Menu,
    Megaphone,
    Newspaper,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [adminUser, setAdminUser] = useState(null);

    // Mobile Sidebar State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const touchStartX = useRef(null);
    const touchTracking = useRef(false);

    // Dynamic Database States
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingArticles, setPendingArticles] = useState([]);
    const [stats, setStats] = useState({
        totalMembers: 0,
        pendingCount: 0,
        totalPosts: 0,
        totalGallery: 0,
    });
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Forms State
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [showBlogModal, setShowBlogModal] = useState(false);
    const [showLeadersModal, setShowPresidentModal] = useState(false);
    const [showNotifyModal, setShowNotifyModal] = useState(false);

    // Selected Leader Tab in Modal ('president' | 'secretary' | 'treasurer')
    const [selectedLeaderRole, setSelectedLeaderRole] = useState('president');

    // Gallery Form State with Category Selection & Image File/URL
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
    const [galleryData, setGalleryData] = useState({
        title: '',
        image_url: '',
        category: 'Events',
        year_tag: new Date().getFullYear(),
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [galleryPreview, setGalleryPreview] = useState(null);

    // Blog Data State with Image File/URL support
    const [blogUploadMode, setBlogUploadMode] = useState('file');
    const [blogData, setBlogData] = useState({
        title: '',
        slug: '',
        content: '',
        featured_image_url: '',
        status: 'published',
    });
    const [blogFile, setBlogFile] = useState(null);
    const [blogImagePreview, setBlogImagePreview] = useState(null);

    // Executive Messages State (President, Secretary, Treasurer)
    const [executiveData, setExecutiveData] = useState({
        president: {
            title: '"Fostering Lifelong Ties & Serving Our Alma Mater"',
            message: '"Majlisul Hamiyyeen serves as a bridge between past memories and future aspirations. Through our collective effort, we strive to support Al Hamiya Arabic College and empower our alumni network across the world."',
            name: 'President, Majlisul Hamiyyeen',
            image_url: '',
        },
        secretary: {
            title: '"Strengthening Administrative Excellence & Connectivity"',
            message: '"Communication and organized action are the backbones of our association. We are committed to maintaining transparent channels, executing planned alumni initiatives, and keeping our global network vibrant."',
            name: 'General Secretary, Majlisul Hamiyyeen',
            image_url: '',
        },
        treasurer: {
            title: '"Ensuring Financial Integrity & Sustainable Growth"',
            message: '"Every contribution from our alumni directly fuels scholarships, campus developments, and community welfare programs. We remain dedicated to full financial accountability and impactful investments."',
            name: 'Treasurer, Majlisul Hamiyyeen',
            image_url: '',
        }
    });

    // Leader Image File Selection state inside Modal
    const [leaderFile, setLeaderFile] = useState(null);
    const [leaderImagePreview, setLeaderImagePreview] = useState(null);

    // Broadcast Notification Form State
    const [notifyData, setNotifyData] = useState({
        title: '',
        message: '',
    });

    useEffect(() => {
        fetchAdminAndData();
    }, []);

    // Close mobile sidebar automatically when switching to desktop width
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Lock body scroll while mobile sidebar is open
    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    const fetchAdminAndData = async () => {
        setLoading(true);
        try {
            // 1. Get current logged in user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setAdminUser(user);
            }

            // 2. Fetch pending registration approvals
            const { data: pendingData, error: pendingErr } = await supabase
                .from('users')
                .select('*')
                .eq('approval_status', 'pending')
                .order('created_at', { ascending: false });

            if (!pendingErr) setPendingUsers(pendingData || []);

            // 2b. Fetch pending article submissions from members
            const { data: pendingArticlesData, error: articlesErr } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (!articlesErr) setPendingArticles(pendingArticlesData || []);

            // 3. Fetch exact statistics
            const { count: memberCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            const { count: postCount } = await supabase
                .from('blog_posts')
                .select('*', { count: 'exact', head: true });
            const { count: galleryCount } = await supabase
                .from('gallery')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalMembers: memberCount || 0,
                pendingCount: pendingData?.length || 0,
                totalPosts: postCount || 0,
                totalGallery: galleryCount || 0,
            });

            // 4. Fetch Executive Addresses from DB
            const { data: settings } = await supabase
                .from('site_settings')
                .select('*');

            if (settings && settings.length > 0) {
                const presSetting = settings.find(s => s.key === 'president_address')?.value;
                const secSetting = settings.find(s => s.key === 'secretary_address')?.value;
                const treasSetting = settings.find(s => s.key === 'treasurer_address')?.value;

                setExecutiveData(prev => ({
                    president: presSetting || prev.president,
                    secretary: secSetting || prev.secretary,
                    treasurer: treasSetting || prev.treasurer,
                }));
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Convert File to Base64
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Handle Gallery Image Selection
    const handleGalleryFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setGalleryPreview(reader.result);
        reader.readAsDataURL(file);
    };

    // Handle Blog Image Selection
    const handleBlogFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setBlogFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setBlogImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // Handle Leader Image Selection inside modal
    const handleLeaderFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLeaderFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setLeaderImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // Action: Add New Gallery Image
    const handleAddGallery = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let finalImageUrl = galleryData.image_url;

            if (uploadMode === 'file') {
                if (!selectedFile) {
                    alert('Please select an image file from your device.');
                    setUploading(false);
                    return;
                }
                finalImageUrl = await convertFileToBase64(selectedFile);
            }

            if (!finalImageUrl) {
                alert('Image source is missing!');
                setUploading(false);
                return;
            }

            const { error } = await supabase.from('gallery').insert([
                {
                    title: galleryData.title,
                    image_url: finalImageUrl,
                    category: galleryData.category,
                    year_tag: parseInt(galleryData.year_tag, 10),
                },
            ]);

            if (error) throw error;

            alert('Image successfully uploaded to Gallery!');
            setShowGalleryModal(false);
            setSelectedFile(null);
            setGalleryPreview(null);
            setGalleryData({
                title: '',
                image_url: '',
                category: 'Events',
                year_tag: new Date().getFullYear(),
            });
            fetchAdminAndData();
        } catch (err) {
            alert('Error uploading gallery image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // Action: Add New Blog/News Post
    const handleAddBlog = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let finalImageUrl = blogData.featured_image_url;

            if (blogUploadMode === 'file' && blogFile) {
                finalImageUrl = await convertFileToBase64(blogFile);
            }

            const generatedSlug = blogData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            const { error } = await supabase.from('blog_posts').insert([
                {
                    title: blogData.title,
                    slug: generatedSlug,
                    content: blogData.content,
                    featured_image_url: finalImageUrl || null,
                    author_name: 'By Admin',
                    status: blogData.status,
                    published_at: new Date(),
                },
            ]);

            if (error) throw error;

            alert('News article published successfully!');
            setShowBlogModal(false);
            setBlogFile(null);
            setBlogImagePreview(null);
            setBlogData({
                title: '',
                slug: '',
                content: '',
                featured_image_url: '',
                status: 'published',
            });
            fetchAdminAndData();
        } catch (err) {
            alert('Error publishing article: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // Action: Update Executive Address (President, Secretary, or Treasurer)
    const handleUpdateExecutiveMessage = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let activeLeaderData = { ...executiveData[selectedLeaderRole] };

            if (leaderFile) {
                const base64Img = await convertFileToBase64(leaderFile);
                activeLeaderData.image_url = base64Img;
            }

            const dbKey = `${selectedLeaderRole}_address`;

            const { error } = await supabase
                .from('site_settings')
                .upsert({ key: dbKey, value: activeLeaderData }, { onConflict: 'key' });

            if (error) console.log('Notice: DB site_settings optionally updated:', error.message);

            setExecutiveData(prev => ({
                ...prev,
                [selectedLeaderRole]: activeLeaderData
            }));

            alert(`${selectedLeaderRole.toUpperCase()}'s Address updated successfully!`);
            setShowPresidentModal(false);
            setLeaderFile(null);
            setLeaderImagePreview(null);
        } catch (err) {
            alert('Updated locally: ' + err.message);
            setShowPresidentModal(false);
        } finally {
            setUploading(false);
        }
    };

    // Action: Broadcast a New Notification / Announcement to All Members
    const handleBroadcastNotification = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const { error } = await supabase.from('notifications').insert([
                {
                    title: notifyData.title,
                    message: notifyData.message,
                    target_role: 'all',
                },
            ]);

            if (error) throw error;

            alert('Notification broadcasted to all members successfully!');
            setShowNotifyModal(false);
            setNotifyData({ title: '', message: '' });
        } catch (err) {
            alert('Error broadcasting notification: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // Action: Approve & Publish a Member-Submitted Article
    const handleApproveArticle = async (id) => {
        try {
            const { error } = await supabase
                .from('blog_posts')
                .update({ status: 'published', published_at: new Date() })
                .eq('id', id);

            if (error) throw error;

            setPendingArticles(pendingArticles.filter((a) => a.id !== id));
            setStats((prev) => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
            alert('Article approved and published successfully!');
        } catch (err) {
            alert('Failed to approve article: ' + err.message);
        }
    };

    // Action: Reject a Member-Submitted Article
    const handleRejectArticle = async (id) => {
        try {
            const { error } = await supabase
                .from('blog_posts')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (error) throw error;

            setPendingArticles(pendingArticles.filter((a) => a.id !== id));
            alert('Article submission rejected.');
        } catch (err) {
            alert('Failed to reject article: ' + err.message);
        }
    };

    // Action: Approve User
    const handleApprove = async (id) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ approval_status: 'approved', approved_at: new Date() })
                .eq('id', id);

            if (error) throw error;

            setPendingUsers(pendingUsers.filter((u) => u.id !== id));
            setStats((prev) => ({ ...prev, pendingCount: prev.pendingCount - 1 }));
            alert('User account approved successfully!');
        } catch (err) {
            alert('Failed to approve user: ' + err.message);
        }
    };

    // Action: Reject User
    const handleReject = async (id) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ approval_status: 'rejected' })
                .eq('id', id);

            if (error) throw error;

            setPendingUsers(pendingUsers.filter((u) => u.id !== id));
            setStats((prev) => ({ ...prev, pendingCount: prev.pendingCount - 1 }));
            alert('User registration rejected.');
        } catch (err) {
            alert('Failed to reject user: ' + err.message);
        }
    };

    // Logout Action
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Filter Users
    const filteredUsers = pendingUsers.filter(
        (u) =>
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.occupation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeLeaderObj = executiveData[selectedLeaderRole];

    // Close the mobile sidebar (used by nav links / overlay)
    const closeSidebar = () => setSidebarOpen(false);

    // --- Swipe Gesture Handlers (mobile only) ---
    const handleTouchStart = (e) => {
        if (window.innerWidth >= 768) return;
        const x = e.touches[0].clientX;
        // Only start tracking a swipe if it begins near the left edge (to open)
        // or anywhere on screen while the sidebar is already open (to close)
        if (x < 40 || sidebarOpen) {
            touchStartX.current = x;
            touchTracking.current = true;
        }
    };

    const handleTouchMove = (e) => {
        if (!touchTracking.current || touchStartX.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX.current;

        if (!sidebarOpen && diff > 60) {
            setSidebarOpen(true);
            touchTracking.current = false;
        } else if (sidebarOpen && diff < -60) {
            setSidebarOpen(false);
            touchTracking.current = false;
        }
    };

    const handleTouchEnd = () => {
        touchTracking.current = false;
        touchStartX.current = null;
    };

    return (
        <div
            className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Mobile Overlay Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar — fixed/slide-in on mobile, static on desktop */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-5 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3" onClick={closeSidebar}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                                MH
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white leading-none">
                                    Majlisul Hamiyyeen
                                </h2>
                                <p className="text-[10px] text-emerald-400 font-medium mt-1">
                                    Admin Control Panel
                                </p>
                            </div>
                        </Link>

                        {/* Close button, mobile only */}
                        <button
                            onClick={closeSidebar}
                            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="space-y-1.5">
                        <button
                            onClick={() => { setActiveTab('dashboard'); closeSidebar(); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-colors ${activeTab === 'dashboard'
                                ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 font-semibold'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </button>

                        <Link
                            to="/admin/members"
                            onClick={closeSidebar}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Users size={18} />
                                <span>Manage Members</span>
                            </div>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>

                        <Link
                            to="/admin/content"
                            onClick={closeSidebar}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <FileText size={18} />
                                <span>News & Articles</span>
                            </div>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>

                        <Link
                            to="/admin/images"
                            onClick={closeSidebar}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <ImageIcon size={18} />
                                <span>Manage Images</span>
                            </div>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>

                        {/* Events Schedule Link */}
                        <Link
                            to="/admin/events"
                            onClick={closeSidebar}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Calendar size={18} />
                                <span>Events Schedule</span>
                            </div>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>

                        <Link
                            to="/admin/polls"
                            onClick={closeSidebar}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Vote size={18} />
                                <span>Voting & Polls</span>
                            </div>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>

                        <Link
                            to="/admin/streams"
                            onClick={closeSidebar}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Video size={18} />
                                <span>Live Streaming</span>
                            </div>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    </nav>
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-2">
                    <Link
                        to="/"
                        onClick={closeSidebar}
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
                <header className="bg-slate-900/60 border-b border-slate-800 p-4 sm:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-base sm:text-lg font-bold text-white capitalize">{activeTab}</h1>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="relative">
                            <button className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors relative">
                                <Bell size={18} />
                                {stats.pendingCount > 0 && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 animate-ping" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 border-l border-slate-800 pl-2 sm:pl-4">
                            <div className="w-9 h-9 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                {adminUser?.email?.charAt(0) || 'A'}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-semibold text-white">Administrator</p>
                                <p className="text-[10px] text-emerald-400 font-mono">
                                    {adminUser?.email || 'admin@majlisulhamiyyeen.com'}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl w-full mx-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                        <Link
                            to="/admin/members"
                            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-emerald-500/50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] sm:text-xs font-medium text-slate-400">Total Members</span>
                                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Users size={18} className="sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-white mt-3">{stats.totalMembers}</div>
                            <span className="text-[10px] sm:text-[11px] text-emerald-400 mt-1 inline-block">
                                Manage Members →
                            </span>
                        </Link>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] sm:text-xs font-medium text-slate-400">Pending Approvals</span>
                                <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                                    <Clock size={18} className="sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-white mt-3">{stats.pendingCount}</div>
                            <span className="text-[10px] sm:text-[11px] text-amber-400 mt-1 inline-block">Action Needed</span>
                        </div>

                        <Link
                            to="/admin/images"
                            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-teal-500/50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] sm:text-xs font-medium text-slate-400">Gallery Images</span>
                                <div className="p-2 sm:p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                                    <ImageIcon size={18} className="sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-white mt-3">{stats.totalGallery}</div>
                            <span className="text-[10px] sm:text-[11px] text-teal-400 mt-1 inline-block">
                                Manage Images →
                            </span>
                        </Link>

                        <Link
                            to="/admin/content"
                            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-cyan-500/50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] sm:text-xs font-medium text-slate-400">Published News</span>
                                <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                                    <FileText size={18} className="sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-white mt-3">{stats.totalPosts}</div>
                            <span className="text-[10px] sm:text-[11px] text-cyan-400 mt-1 inline-block">
                                Manage Content →
                            </span>
                        </Link>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setShowGalleryModal(true)}
                            className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                        >
                            <Upload size={16} />
                            <span>Upload Gallery Image</span>
                        </button>

                        <button
                            onClick={() => setShowBlogModal(true)}
                            className="px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                        >
                            <Plus size={16} />
                            <span>Publish News Article</span>
                        </button>

                        {/* Events Manager Quick Link */}
                        <Link
                            to="/admin/events"
                            className="px-4 sm:px-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                        >
                            <Calendar size={16} />
                            <span>Manage Events Schedule</span>
                        </Link>

                        <button
                            onClick={() => setShowPresidentModal(true)}
                            className="px-4 sm:px-5 py-2.5 bg-teal-600/20 hover:bg-teal-600 hover:text-white border border-teal-500/30 text-teal-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                        >
                            <Quote size={16} />
                            <span>Edit Executive Addresses</span>
                        </button>

                        {/* Broadcast Notification Quick Action */}
                        <button
                            onClick={() => setShowNotifyModal(true)}
                            className="px-4 sm:px-5 py-2.5 bg-amber-600/20 hover:bg-amber-600 hover:text-white border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                        >
                            <Megaphone size={16} />
                            <span>Broadcast Notification</span>
                        </button>
                    </div>

                    {/* Pending Approvals Table */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-sm space-y-6 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white">Pending Member Registrations</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Review and verify new alumni registration requests.
                                </p>
                            </div>

                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search requests..."
                                    className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Desktop/tablet table view */}
                        <div className="overflow-x-auto hidden sm:block">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                                        <th className="pb-3 font-semibold w-16 text-center">Photo</th>
                                        <th className="pb-3 font-semibold">Name & Email</th>
                                        <th className="pb-3 font-semibold">Batch</th>
                                        <th className="pb-3 font-semibold">Occupation</th>
                                        <th className="pb-3 font-semibold">Country</th>
                                        <th className="pb-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="py-4 text-center">
                                                    <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-700 overflow-hidden mx-auto flex items-center justify-center shadow-md">
                                                        {user.profile_image_url ? (
                                                            <img
                                                                src={user.profile_image_url}
                                                                alt={user.full_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-emerald-400 font-bold text-sm uppercase">
                                                                {user.full_name?.charAt(0) || 'U'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="font-semibold text-white">{user.full_name}</div>
                                                    <div className="text-slate-400 text-[11px]">{user.email}</div>
                                                </td>
                                                <td className="py-4 font-medium text-emerald-400">{user.batch_year}</td>
                                                <td className="py-4 text-slate-300">{user.occupation}</td>
                                                <td className="py-4 text-slate-300">{user.country}</td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApprove(user.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-xs font-medium transition-all flex items-center gap-1 shadow-sm"
                                                        >
                                                            <Check size={14} />
                                                            <span>Approve</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(user.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-xs font-medium transition-all flex items-center gap-1 shadow-sm"
                                                        >
                                                            <X size={14} />
                                                            <span>Reject</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-500">
                                                No pending registration requests found!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card-list view (replaces the table under sm breakpoint) */}
                        <div className="sm:hidden space-y-3">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <div key={user.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shadow-md shrink-0">
                                                {user.profile_image_url ? (
                                                    <img
                                                        src={user.profile_image_url}
                                                        alt={user.full_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-emerald-400 font-bold text-sm uppercase">
                                                        {user.full_name?.charAt(0) || 'U'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-white text-xs truncate">{user.full_name}</div>
                                                <div className="text-slate-400 text-[11px] truncate">{user.email}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase">Batch</p>
                                                <p className="text-emerald-400 font-medium">{user.batch_year}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-slate-500 text-[10px] uppercase">Occupation</p>
                                                <p className="truncate">{user.occupation}</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-300">
                                            <span className="text-slate-500 text-[10px] uppercase block">Country</span>
                                            {user.country}
                                        </p>

                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                <Check size={14} />
                                                <span>Approve</span>
                                            </button>
                                            <button
                                                onClick={() => handleReject(user.id)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                <X size={14} />
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-8 text-center text-slate-500 text-xs">
                                    No pending registration requests found!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Pending Article Submissions */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-sm space-y-6 shadow-xl">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                <Newspaper size={18} className="text-cyan-400 shrink-0" />
                                Pending Article Submissions
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Review articles submitted by members before they go live on the public blog.
                            </p>
                        </div>

                        {pendingArticles.length > 0 ? (
                            <div className="space-y-3">
                                {pendingArticles.map((article) => (
                                    <div
                                        key={article.id}
                                        className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            {article.featured_image_url && (
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                                    <img
                                                        src={article.featured_image_url}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
                                                    {article.title}
                                                </h3>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    By {article.author_name || 'Member'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 break-words">
                                                    {article.content}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                            <button
                                                onClick={() => handleApproveArticle(article.id)}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-xs font-medium transition-all flex items-center gap-1 shadow-sm"
                                            >
                                                <Check size={14} />
                                                <span>Approve & Publish</span>
                                            </button>
                                            <button
                                                onClick={() => handleRejectArticle(article.id)}
                                                className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-xs font-medium transition-all flex items-center gap-1 shadow-sm"
                                            >
                                                <X size={14} />
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-slate-500 text-xs">
                                No pending article submissions right now.
                            </p>
                        )}
                    </div>
                </main>
            </div>

            {/* 1. Gallery Upload Modal */}
            {showGalleryModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Upload Image to Gallery</h3>
                            <button
                                onClick={() => {
                                    setShowGalleryModal(false);
                                    setGalleryPreview(null);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddGallery} className="space-y-4">
                            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('file')}
                                    className={`flex-1 py-1.5 rounded-lg transition-colors ${uploadMode === 'file'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    Choose File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('url')}
                                    className={`flex-1 py-1.5 rounded-lg transition-colors ${uploadMode === 'url'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    Image Link URL
                                </button>
                            </div>

                            {(galleryPreview || (uploadMode === 'url' && galleryData.image_url)) && (
                                <div className="w-full h-36 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 relative">
                                    <img
                                        src={galleryPreview || galleryData.image_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Photo Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={galleryData.title}
                                    onChange={(e) => setGalleryData({ ...galleryData, title: e.target.value })}
                                    placeholder="e.g. Annual Convocation 2026"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        Select Category *
                                    </label>
                                    <select
                                        value={galleryData.category}
                                        onChange={(e) => setGalleryData({ ...galleryData, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                                    >
                                        <option value="Events">Events</option>
                                        <option value="Campus">Campus & College</option>
                                        <option value="Graduation">Graduation</option>
                                        <option value="Sports">Sports & Culture</option>
                                        <option value="Gatherings">Alumni Gatherings</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Year *</label>
                                    <input
                                        type="number"
                                        required
                                        value={galleryData.year_tag}
                                        onChange={(e) => setGalleryData({ ...galleryData, year_tag: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {uploadMode === 'file' ? (
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        Select File from Device *
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={handleGalleryFileSelect}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        Image URL *
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={galleryData.image_url}
                                        onChange={(e) => setGalleryData({ ...galleryData, image_url: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Uploading Image...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={14} />
                                        <span>Upload Image</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Blog/News Modal */}
            {showBlogModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Publish News Article</h3>
                            <button
                                onClick={() => {
                                    setShowBlogModal(false);
                                    setBlogImagePreview(null);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddBlog} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Article Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={blogData.title}
                                    onChange={(e) => setBlogData({ ...blogData, title: e.target.value })}
                                    placeholder="e.g. 45th Annual Alumni Convention"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-slate-300">Featured Cover Image</label>
                                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setBlogUploadMode('file')}
                                        className={`flex-1 py-1 rounded-lg transition-colors ${blogUploadMode === 'file'
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBlogUploadMode('url')}
                                        className={`flex-1 py-1 rounded-lg transition-colors ${blogUploadMode === 'url'
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Image Link URL
                                    </button>
                                </div>

                                {(blogImagePreview || (blogUploadMode === 'url' && blogData.featured_image_url)) && (
                                    <div className="w-full h-32 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 relative">
                                        <img
                                            src={blogImagePreview || blogData.featured_image_url}
                                            alt="Blog Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {blogUploadMode === 'file' ? (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBlogFileSelect}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                                    />
                                ) : (
                                    <input
                                        type="url"
                                        value={blogData.featured_image_url}
                                        onChange={(e) =>
                                            setBlogData({ ...blogData, featured_image_url: e.target.value })
                                        }
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Content *</label>
                                <textarea
                                    rows="4"
                                    required
                                    value={blogData.content}
                                    onChange={(e) => setBlogData({ ...blogData, content: e.target.value })}
                                    placeholder="Write full article content here..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Publishing Article...</span>
                                    </>
                                ) : (
                                    <span>Publish Article</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. MULTI-LEADER ADDRESSES MODAL */}
            {showLeadersModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Edit Executive Addresses</h3>
                            <button
                                onClick={() => {
                                    setShowPresidentModal(false);
                                    setLeaderFile(null);
                                    setLeaderImagePreview(null);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Leader Selection Tabs */}
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                            {['president', 'secretary', 'treasurer'].map((roleKey) => (
                                <button
                                    key={roleKey}
                                    type="button"
                                    onClick={() => {
                                        setSelectedLeaderRole(roleKey);
                                        setLeaderFile(null);
                                        setLeaderImagePreview(null);
                                    }}
                                    className={`flex-1 py-1.5 rounded-lg capitalize transition-colors ${selectedLeaderRole === roleKey
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {roleKey}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleUpdateExecutiveMessage} className="space-y-4">
                            {/* Avatar Photo Selection / Preview */}
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <label className="block text-xs font-medium text-slate-300">
                                    {selectedLeaderRole.toUpperCase()} Photo
                                </label>
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-lg">
                                        {(leaderImagePreview || activeLeaderObj.image_url) ? (
                                            <img
                                                src={leaderImagePreview || activeLeaderObj.image_url}
                                                alt="Leader preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Camera size={24} className="text-slate-500" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLeaderFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <span className="text-[10px] text-slate-500">Click circle to choose image file</span>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Executive Title / Official Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={activeLeaderObj.name || ''}
                                    onChange={(e) =>
                                        setExecutiveData({
                                            ...executiveData,
                                            [selectedLeaderRole]: { ...activeLeaderObj, name: e.target.value }
                                        })
                                    }
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Message Headline *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={activeLeaderObj.title || ''}
                                    onChange={(e) =>
                                        setExecutiveData({
                                            ...executiveData,
                                            [selectedLeaderRole]: { ...activeLeaderObj, title: e.target.value }
                                        })
                                    }
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Message Body *
                                </label>
                                <textarea
                                    rows="4"
                                    required
                                    value={activeLeaderObj.message || ''}
                                    onChange={(e) =>
                                        setExecutiveData({
                                            ...executiveData,
                                            [selectedLeaderRole]: { ...activeLeaderObj, message: e.target.value }
                                        })
                                    }
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Saving Address...</span>
                                    </>
                                ) : (
                                    <span>Save {selectedLeaderRole.toUpperCase()}'s Address</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. Broadcast Notification Modal */}
            {showNotifyModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Megaphone size={18} className="text-amber-400" />
                                Broadcast Notification
                            </h3>
                            <button
                                onClick={() => setShowNotifyModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-[11px] text-slate-400 -mt-1">
                            This message will be visible to all members on their dashboard.
                        </p>

                        <form onSubmit={handleBroadcastNotification} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Notification Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={notifyData.title}
                                    onChange={(e) => setNotifyData({ ...notifyData, title: e.target.value })}
                                    placeholder="e.g. Annual General Meeting Reminder"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Message *
                                </label>
                                <textarea
                                    rows="4"
                                    required
                                    value={notifyData.message}
                                    onChange={(e) => setNotifyData({ ...notifyData, message: e.target.value })}
                                    placeholder="Write the announcement content here..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Broadcasting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Megaphone size={14} />
                                        <span>Send to All Members</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}