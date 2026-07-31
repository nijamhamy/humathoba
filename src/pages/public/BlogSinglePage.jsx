import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Calendar, ArrowLeft, Loader2, Newspaper, Share2, UserCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function BlogSinglePage() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPostDetails();
    }, [id]);

    const fetchPostDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setPost(data);
        } catch (err) {
            console.error('Error fetching post details:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: post?.title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Article link copied to clipboard!');
        }
    };

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={36} className="animate-spin text-emerald-500" />
                        <p className="text-xs font-medium">Loading article details...</p>
                    </div>
                ) : post ? (
                    <article className="space-y-8">
                        {/* Navigation Back & Share */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <Link
                                to="/blog"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} />
                                <span>Back to All News</span>
                            </Link>

                            <button
                                onClick={handleShare}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-md"
                            >
                                <Share2 size={14} />
                                <span>Share</span>
                            </button>
                        </div>

                        {/* Article Header Meta */}
                        <div className="space-y-4 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                {/* Date Badge */}
                                <div className="inline-flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                                    <Calendar size={13} />
                                    <span>
                                        {post.published_at
                                            ? new Date(post.published_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })
                                            : 'Recent Update'}
                                    </span>
                                </div>

                                {/* Author Badge */}
                                <div className="inline-flex items-center gap-1.5 text-xs text-teal-300 font-semibold bg-teal-500/10 px-3.5 py-1 rounded-full border border-teal-500/20">
                                    <UserCheck size={13} />
                                    <span>{post.author_name || 'By Admin'}</span>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                                {post.title}
                            </h1>
                        </div>

                        {/* Featured Image */}
                        {post.featured_image_url && (
                            <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl max-h-[480px]">
                                <img
                                    src={post.featured_image_url}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Article Content */}
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-md shadow-xl">
                            <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal space-y-4">
                                {post.content}
                            </div>
                        </div>
                    </article>
                ) : (
                    <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-4">
                        <Newspaper size={40} className="mx-auto text-slate-600" />
                        <h3 className="text-base font-bold text-slate-300">Article Not Found</h3>
                        <p className="text-xs text-slate-500">
                            The article you are looking for might have been removed or deleted.
                        </p>
                        <Link
                            to="/blog"
                            className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all"
                        >
                            Back to Blog
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}