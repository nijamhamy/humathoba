import React, { useState, useEffect } from 'react';
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
    Calendar
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function ManageContent() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // File vs URL Image Upload Mode
    const [imageMode, setImageMode] = useState('file');
    const [selectedFile, setSelectedFile] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        author_name: 'By Admin',
        content: '',
        featured_image_url: '',
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

    // Convert File to Base64
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let finalImageUrl = formData.featured_image_url;

            if (imageMode === 'file' && selectedFile) {
                finalImageUrl = await convertFileToBase64(selectedFile);
            }

            const slug = formData.title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            // Construct Insert Payload safely
            const insertPayload = {
                title: formData.title,
                slug: slug,
                content: formData.content,
                featured_image_url: finalImageUrl || null,
                status: formData.status,
                published_at: formData.status === 'published' ? new Date() : null,
            };

            // Safely attempt to add author_name if database supports it
            if (formData.author_name) {
                insertPayload.author_name = formData.author_name;
            }

            const { error } = await supabase.from('blog_posts').insert([insertPayload]);

            // Fallback if 'author_name' column does not exist in Supabase DB
            if (error && error.message.includes('author_name')) {
                delete insertPayload.author_name;
                const { error: retryError } = await supabase.from('blog_posts').insert([insertPayload]);
                if (retryError) throw retryError;
            } else if (error) {
                throw error;
            }

            alert('News article created successfully!');
            setShowModal(false);
            setSelectedFile(null);
            setFormData({
                title: '',
                author_name: 'By Admin',
                content: '',
                featured_image_url: '',
                status: 'published',
            });
            fetchPosts();
        } catch (err) {
            alert('Error creating article: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('Are you sure you want to delete this news article?')) return;

        try {
            const { error } = await supabase.from('blog_posts').delete().eq('id', id);
            if (error) throw error;

            setPosts(posts.filter((post) => post.id !== id));
            alert('Article deleted successfully!');
        } catch (err) {
            alert('Failed to delete article: ' + err.message);
        }
    };

    const filteredPosts = posts.filter(
        (post) =>
            post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content?.toLowerCase().includes(searchTerm.toLowerCase())
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
                                Create, edit, and publish news updates for the association.
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
                        Total Articles: <span className="text-emerald-400 font-bold">{posts.length}</span>
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
                        {filteredPosts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
                            >
                                {post.featured_image_url ? (
                                    <img
                                        src={post.featured_image_url}
                                        alt={post.title}
                                        className="w-full h-44 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-44 bg-slate-950 flex items-center justify-center text-slate-700">
                                        <FileText size={40} />
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${post.status === 'published'
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                    }`}
                                            >
                                                {post.status === 'published' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                <span className="capitalize">{post.status}</span>
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

                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {post.content}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                        <Link
                                            to={`/blog/${post.id}`}
                                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                                        >
                                            <Eye size={14} />
                                            <span>View</span>
                                        </Link>

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
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
                        <FileText size={40} className="mx-auto text-slate-600" />
                        <h3 className="text-base font-bold text-slate-300">No News Articles Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Start publishing updates for your college alumni by clicking the create button above.
                        </p>
                    </div>
                )}

            </div>

            {/* Create Article Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 relative shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                            <h3 className="text-lg font-bold text-white">Create New Article</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="space-y-4">
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

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Featured Image Source</label>
                                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setImageMode('file')}
                                        className={`flex-1 py-1.5 rounded-lg transition-colors ${imageMode === 'file' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Choose Computer File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageMode('url')}
                                        className={`flex-1 py-1.5 rounded-lg transition-colors ${imageMode === 'url' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Image Web Link (URL)
                                    </button>
                                </div>

                                {imageMode === 'file' ? (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                                    />
                                ) : (
                                    <input
                                        type="url"
                                        name="featured_image_url"
                                        value={formData.featured_image_url}
                                        onChange={handleChange}
                                        placeholder="https://images.unsplash.com/photo-..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Article Content *</label>
                                <textarea
                                    name="content"
                                    rows="4"
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