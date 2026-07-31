import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Newspaper, Calendar, ArrowRight, Loader2, Search, UserCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function BlogPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPublishedPosts();
    }, []);

    const fetchPublishedPosts = async () => {
        setLoading(true);
        try {
            // Fetch only PUBLISHED blog posts from Supabase
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('status', 'published')
                .order('published_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching blog posts:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = posts.filter(
        (post) =>
            post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">

                {/* Page Header */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                        News & Updates
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                        Latest News & Blog
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                        Stay updated with college announcements, alumni events, and community stories.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-md mx-auto relative">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search news, articles, or author..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors shadow-lg"
                    />
                </div>

                {/* Articles Grid */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={36} className="animate-spin text-emerald-500" />
                        <p className="text-xs font-medium">Loading news articles...</p>
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post) => (
                            <article
                                key={post.id}
                                className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm hover:border-slate-700 transition-all group flex flex-col justify-between shadow-xl"
                            >
                                {post.featured_image_url ? (
                                    <div className="aspect-video overflow-hidden">
                                        <img
                                            src={post.featured_image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-slate-950 flex items-center justify-center text-slate-700">
                                        <Newspaper size={48} />
                                    </div>
                                )}

                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        {/* Meta info: Date & Author */}
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-emerald-400" />
                                                <span>
                                                    {post.published_at
                                                        ? new Date(post.published_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })
                                                        : 'Recent'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 text-emerald-400 font-medium">
                                                <UserCheck size={12} />
                                                <span>{post.author_name || 'By Admin'}</span>
                                            </div>
                                        </div>

                                        <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                                            {post.title}
                                        </h2>

                                        <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                                            {post.content}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800/80">
                                        <Link
                                            to={`/blog/${post.id}`}
                                            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                                        >
                                            <span>Read Full Article</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
                        <Newspaper size={40} className="mx-auto text-slate-600" />
                        <h3 className="text-base font-bold text-slate-300">No News Articles Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            No news or blog updates have been published yet.
                        </p>
                    </div>
                )}

            </main>

            <Footer />
        </div>
    );
}