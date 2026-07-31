import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function LatestEvents() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentPosts();
    }, []);

    const fetchRecentPosts = async () => {
        try {
            const { data } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('status', 'published')
                .order('published_at', { ascending: false })
                .limit(3);

            setPosts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-20 bg-slate-950 font-sans border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                            News & Updates
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-3">
                            Latest College Updates
                        </h2>
                    </div>

                    <Link
                        to="/blog"
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                    >
                        <span>View All News</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-500">
                        <Loader2 size={28} className="animate-spin text-emerald-500 mx-auto" />
                    </div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-xl"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        <Calendar size={12} className="text-emerald-400" />
                                        <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-white line-clamp-1">{post.title}</h3>
                                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{post.content}</p>
                                </div>

                                <Link
                                    to={`/blog/${post.id}`}
                                    className="text-xs text-emerald-400 font-semibold hover:underline"
                                >
                                    Read More →
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                        No news articles published yet.
                    </div>
                )}

            </div>
        </section>
    );
}