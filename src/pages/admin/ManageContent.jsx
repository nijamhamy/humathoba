import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText,
    Plus,
    Trash2,
    Eye,
    Search,
    ArrowLeft,
    X,
    Loader2,
    CheckCircle2,
    Clock,
    Upload,
    UserCheck,
    Calendar,
    Images,
    Star,
    LinkIcon,
    ThumbsUp,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const TABS = [
    { key: 'pending', label: 'Pending Review' },
    { key: 'published', label: 'Published' },
    { key: 'all', label: 'All Articles' },
];

// Supabase Storage bucket used for article photos. Must be public,
// and must have an INSERT policy for authenticated users (already added).
const STORAGE_BUCKET = 'blog-images';

export default function ManageContent() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [reviewPost, setReviewPost] = useState(null); // post currently open in the review drawer
    const [approvingId, setApprovingId] = useState(null);

    // Multi-image state for the article being created by an admin.
    const [pendingImages, setPendingImages] = useState([]);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef(null);

    // Upload progress while creating a post (files upload sequentially to Storage)
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

    const [formData, setFormData] = useState({
        title: '',
        author_name: 'By Admin',
        content: '',
        status: 'published',
    });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching blog posts:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Uploads a File to Supabase Storage and returns its public URL.
    // This replaces the old base64 data-URL approach so images work in
    // Open Graph previews, load faster, and don't bloat the DB rows.
    const uploadFileToStorage = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            if (uploadError.message?.toLowerCase().includes('bucket not found')) {
                throw new Error(
                    `Storage bucket "${STORAGE_BUCKET}" doesn't exist yet. Create a public bucket named "${STORAGE_BUCKET}" in Supabase → Storage, then try again.`
                );
            }
            throw uploadError;
        }

        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
        return data.publicUrl;
    };

    // --- Pending image helpers (admin "create new article" modal) ---

    const handleFilesSelected = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newEntries = files.map((file) => ({
            id: crypto.randomUUID(),
            source: 'file',
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        setPendingImages((prev) => [...prev, ...newEntries]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddUrlImage = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;

        setPendingImages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), source: 'url', url: trimmed, previewUrl: trimmed },
        ]);
        setUrlInput('');
    };

    const handleRemovePendingImage = (id) => {
        setPendingImages((prev) => {
            const target = prev.find((p) => p.id === id);
            if (target && target.source === 'file' && target.previewUrl) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter((p) => p.id !== id);
        });
    };

    const handleMakeThumbnail = (id) => {
        setPendingImages((prev) => {
            const index = prev.findIndex((p) => p.id === id);
            if (index <= 0) return prev;
            const copy = [...prev];
            const [item] = copy.splice(index, 1);
            copy.unshift(item);
            return copy;
        });
    };

    const resetImageState = () => {
        pendingImages.forEach((p) => {
            if (p.source === 'file' && p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        setPendingImages([]);
        setUrlInput('');
        setUploadProgress({ done: 0, total: 0 });
    };

    const closeCreateModal = () => {
        setShowModal(false);
        resetImageState();
        setFormData({ title: '', author_name: 'By Admin', content: '', status: 'published' });
    };

    // --- Create article (admin-authored, publishes directly) ---

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setUploadProgress({ done: 0, total: pendingImages.length });

        try {
            const resolvedImages = [];
            for (const item of pendingImages) {
                if (item.source === 'file') {
                    resolvedImages.push(await uploadFileToStorage(item.file));
                } else {
                    resolvedImages.push(item.url);
                }
                setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
            }

            const slug = formData.title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            const insertPayload = {
                title: formData.title,
                slug,
                content: formData.content,
                author_name: formData.author_name,
                images: resolvedImages,
                featured_image_url: resolvedImages[0] || null,
                status: formData.status,
                published_at: formData.status === 'published' ? new Date() : null,
            };

            const { error } = await supabase.from('blog_posts').insert([insertPayload]);
            if (error) throw error;

            alert('News article created successfully!');
            closeCreateModal();
            fetchPosts();
        } catch (err) {
            alert('Error creating article: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // --- Approve a pending member submission ---

    const handleApprove = async (id) => {
        setApprovingId(id);
        try {
            const { error } = await supabase
                .from('blog_posts')
                .update({ status: 'published', published_at: new Date() })
                .eq('id', id);

            if (error) throw error;

            setPosts((prev) =>
                prev.map((p) => (p.id === id ? { ...p, status: 'published', published_at: new Date().toISOString() } : p))
            );
            setReviewPost(null);
        } catch (err) {
            alert('Failed to approve article: ' + err.message);
        } finally {
            setApprovingId(null);
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('Are you sure you want to delete this news article?')) return;

        try {
            const { error } = await supabase.from('blog_posts').delete().eq('id', id);
            if (error) throw error;

            setPosts((prev) => prev.filter((post) => post.id !== id));
            if (reviewPost?.id === id) setReviewPost(null);
        } catch (err) {
            alert('Failed to delete article: ' + err.message);
        }
    };

    // Helper: get the image list for a saved post, falling back to the
    // legacy single featured_image_url for older articles.
    const getPostImages = (post) => {
        if (Array.isArray(post.images) && post.images.length > 0) return post.images;
        if (post.featured_image_url) return [post.featured_image_url];
        return [];
    };

    const pendingCount = useMemo(() => posts.filter((p) => p.status === 'pending').length, [posts]);

    const tabFilteredPosts = posts.filter((post) => {
        if (activeTab === 'all') return true;
        return post.status === activeTab;
    });

    const filteredPosts = tabFilteredPosts.filter(
        (post) =>
            post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                Manage News & Articles
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Review member submissions and publish updates for the association.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                    >
                        <Plus size={16} />
                        <span>Create New Article</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${activeTab === tab.key
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                        >
                            {tab.label}
                            {tab.key === 'pending' && pendingCount > 0 && (
                                <span className={`ml-2 inline-flex items-center justify-center text-[9px] font-bold rounded-full w-4 h-4 ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Bar & Counter */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
                    <div className="relative w-full sm:w-80">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="text-xs text-slate-400 self-end sm:self-center">
                        Showing: <span className="text-emerald-400 font-bold">{filteredPosts.length}</span>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={32} className="animate-spin text-emerald-500" />
                        <p className="text-xs">Loading articles from database...</p>
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPosts.map((post) => {
                            const postImages = getPostImages(post);
                            return (
                                <div
                                    key={post.id}
                                    className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
                                >
                                    <button
                                        onClick={() => setReviewPost(post)}
                                        className="relative w-full h-44 bg-slate-950 text-left"
                                    >
                                        {postImages.length > 0 ? (
                                            <img src={postImages[0]} alt={post.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                <FileText size={40} />
                                            </div>
                                        )}

                                        {postImages.length > 1 && (
                                            <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-400 border border-slate-800 flex items-center gap-1">
                                                <Images size={12} />
                                                <span>{postImages.length} photos</span>
                                            </div>
                                        )}
                                    </button>

                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${post.status === 'published'
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                        : post.status === 'pending'
                                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                            : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                                                        }`}
                                                >
                                                    {post.status === 'published' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                    <span>{post.status}</span>
                                                </span>

                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-white line-clamp-1">{post.title}</h3>

                                            <p className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                                                <UserCheck size={12} />
                                                <span>{post.author_name || 'By Admin'}</span>
                                            </p>

                                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{post.content}</p>
                                        </div>

                                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => setReviewPost(post)}
                                                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                                            >
                                                <Eye size={14} />
                                                <span>Review</span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {post.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleApprove(post.id)}
                                                        disabled={approvingId === post.id}
                                                        className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Approve & Publish"
                                                    >
                                                        {approvingId === post.id ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <ThumbsUp size={16} />
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    title="Delete Article"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
                        <FileText size={40} className="mx-auto text-slate-600" />
                        <h3 className="text-base font-bold text-slate-300">Nothing Here</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            {activeTab === 'pending'
                                ? 'No member submissions are waiting for review.'
                                : 'No articles match this view yet.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Review Drawer — full photo grid + approve/publish */}
            {reviewPost && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[92vh] flex flex-col space-y-5 relative shadow-2xl">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-4 shrink-0">
                            <div className="space-y-1.5">
                                <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${reviewPost.status === 'published'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                        }`}
                                >
                                    {reviewPost.status}
                                </span>
                                <h3 className="text-lg font-bold text-white">{reviewPost.title}</h3>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                        <UserCheck size={13} />
                                        {reviewPost.author_name || 'By Admin'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={13} />
                                        {new Date(reviewPost.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setReviewPost(null)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-1 -mr-1 flex-1 space-y-5">
                            {/* Full photo grid */}
                            {getPostImages(reviewPost).length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                                        <Images size={13} />
                                        {getPostImages(reviewPost).length} photo{getPostImages(reviewPost).length > 1 ? 's' : ''} submitted
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {getPostImages(reviewPost).map((img, index) => (
                                            <div
                                                key={index}
                                                className={`relative aspect-square rounded-xl overflow-hidden bg-slate-950 border-2 ${index === 0 ? 'border-emerald-500' : 'border-slate-800'
                                                    }`}
                                            >
                                                <img src={img} alt={`Submission ${index + 1}`} className="w-full h-full object-cover" />
                                                {index === 0 && (
                                                    <div className="absolute bottom-1 left-1 right-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-semibold rounded-md py-0.5 text-center flex items-center justify-center gap-1">
                                                        <Star size={9} className="fill-white" />
                                                        <span>Cover</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-600 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                                    No photos were attached to this submission.
                                </div>
                            )}

                            <div className="border-t border-slate-800 pt-4">
                                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">
                                    {reviewPost.content}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 border-t border-slate-800 pt-4 shrink-0">
                            {reviewPost.status !== 'published' && (
                                <button
                                    onClick={() => handleApprove(reviewPost.id)}
                                    disabled={approvingId === reviewPost.id}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {approvingId === reviewPost.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <ThumbsUp size={16} />
                                    )}
                                    <span>Approve & Publish</span>
                                </button>
                            )}
                            <Link
                                to={`/blog/${reviewPost.id}`}
                                target="_blank"
                                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <Eye size={15} />
                                <span>Preview</span>
                            </Link>
                            <button
                                onClick={() => handleDeletePost(reviewPost.id)}
                                className="px-4 py-3 bg-rose-600/10 hover:bg-rose-600 border border-rose-600/30 text-rose-400 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Article Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[92vh] flex flex-col space-y-5 relative shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-4 shrink-0">
                            <h3 className="text-lg font-bold text-white">Create New Article</h3>
                            <button
                                onClick={closeCreateModal}
                                disabled={submitting}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="space-y-4 overflow-y-auto pr-1 -mr-1 flex-1">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Article Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. 45th Annual OBA Meeting & Reunion"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Author Name *</label>
                                <input
                                    type="text"
                                    name="author_name"
                                    required
                                    value={formData.author_name}
                                    onChange={handleChange}
                                    placeholder="e.g. By Admin / Media Team"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-medium text-emerald-400"
                                />
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-medium text-slate-300">
                                        Article Photos {pendingImages.length > 0 && `(${pendingImages.length})`}
                                    </label>
                                    <span className="text-[10px] text-slate-500">
                                        The first photo (or the one you pin) becomes the thumbnail
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 py-2 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-emerald-500 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Upload size={14} />
                                        <span>Choose Photos from Device</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFilesSelected}
                                        className="hidden"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddUrlImage();
                                                }
                                            }}
                                            placeholder="Or paste an image URL..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddUrlImage}
                                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>

                                {pendingImages.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                                        {pendingImages.map((entry, index) => (
                                            <div
                                                key={entry.id}
                                                className={`relative aspect-square rounded-xl overflow-hidden bg-slate-950 border-2 transition-all ${index === 0 ? 'border-emerald-500' : 'border-slate-800'
                                                    }`}
                                            >
                                                <img src={entry.previewUrl} alt="Selected" className="w-full h-full object-cover" />

                                                {index === 0 && (
                                                    <div className="absolute bottom-1 left-1 right-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-semibold rounded-md py-0.5 text-center flex items-center justify-center gap-1">
                                                        <Star size={9} className="fill-white" />
                                                        <span>Thumbnail</span>
                                                    </div>
                                                )}

                                                <div className="absolute top-1 right-1 flex flex-col gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePendingImage(entry.id)}
                                                        className="p-1 rounded-md bg-rose-600/90 hover:bg-rose-500 text-white shadow-md transition-colors"
                                                        title="Remove"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                    {index !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMakeThumbnail(entry.id)}
                                                            className="p-1 rounded-md bg-slate-900/90 hover:bg-emerald-600 text-white shadow-md transition-colors"
                                                            title="Set as thumbnail"
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
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Article Content *</label>
                                <textarea
                                    name="content"
                                    rows="5"
                                    required
                                    value={formData.content}
                                    onChange={handleChange}
                                    placeholder="Write full article description here..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Publish Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                >
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>

                            {submitting && uploadProgress.total > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Uploading photos {uploadProgress.done} of {uploadProgress.total}...</span>
                                        <span>{Math.round((uploadProgress.done / uploadProgress.total) * 100)}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Publishing Article...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={15} />
                                            <span>Publish Article</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}