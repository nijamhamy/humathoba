import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
    Calendar,
    ArrowLeft,
    Loader2,
    Newspaper,
    Share2,
    UserCheck,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Images,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function BlogSinglePage() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    // Which photo is showing in the lightbox / hero
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Full-screen lightbox
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);

    useEffect(() => {
        fetchPostDetails();
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            setActiveImageIndex(0);
        } catch (err) {
            console.error('Error fetching post details:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: post?.title, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Article link copied to clipboard!');
        }
    };

    // Combine the images array with the legacy single featured_image_url,
    // so articles created before multi-photo support still display fine.
    const images = post
        ? Array.isArray(post.images) && post.images.length > 0
            ? post.images
            : post.featured_image_url
                ? [post.featured_image_url]
                : []
        : [];

    const hasImages = images.length > 0;
    const activeImage = images[activeImageIndex];

    const openLightboxAt = (index) => {
        setActiveImageIndex(index);
        setLightboxOpen(true);
    };

    const nextImage = useCallback(() => {
        setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!lightboxOpen) return;
            if (e.key === 'Escape') setLightboxOpen(false);
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, nextImage, prevImage]);

    const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
    const handleTouchEnd = (e) => {
        if (touchStartX === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;
        if (diffX > 50) nextImage();
        else if (diffX < -50) prevImage();
        setTouchStartX(0);
    };

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="flex-grow pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
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

                        {/* Hero photo */}
                        <div
                            className={`relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl ${hasImages ? 'aspect-video cursor-pointer group' : 'aspect-[21/9] flex items-center justify-center text-slate-700'
                                }`}
                            onClick={() => hasImages && openLightboxAt(activeImageIndex)}
                        >
                            {hasImages ? (
                                <>
                                    <img src={activeImage} alt={post.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-emerald-600/90 p-3 rounded-full shadow-lg">
                                            <Maximize2 size={20} className="text-white" />
                                        </div>
                                    </div>
                                    {images.length > 1 && (
                                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-400 border border-slate-800 flex items-center gap-1">
                                            <Images size={12} />
                                            <span>{images.length} photos</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Newspaper size={56} />
                            )}
                        </div>

                        {/* Meta + Title */}
                        <div className="space-y-4 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
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

                                <div className="inline-flex items-center gap-1.5 text-xs text-teal-300 font-semibold bg-teal-500/10 px-3.5 py-1 rounded-full border border-teal-500/20">
                                    <UserCheck size={13} />
                                    <span>{post.author_name || 'By Admin'}</span>
                                </div>
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                {post.title}
                            </h1>
                        </div>

                        {/* Article Content */}
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 sm:p-8 backdrop-blur-md shadow-xl">
                            <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
                                {post.content}
                            </div>
                        </div>

                        {/* Photo Gallery Grid — every photo attached to the article */}
                        {images.length > 1 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Images size={16} className="text-emerald-400" />
                                    <span>Photo Gallery</span>
                                    <span className="text-slate-500 font-normal">({images.length})</span>
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => openLightboxAt(index)}
                                            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group shadow-lg"
                                        >
                                            <img
                                                src={img}
                                                alt={`${post.title} photo ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                                                <Maximize2
                                                    size={18}
                                                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
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

            {/* Full-screen lightbox */}
            {lightboxOpen && hasImages && (
                <div
                    className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex items-center justify-between z-10 max-w-7xl mx-auto w-full">
                        <span className="text-xs text-slate-400 font-mono">
                            {activeImageIndex + 1} / {images.length}
                        </span>
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                            title="Close (Esc)"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="relative flex-grow flex items-center justify-center my-4 overflow-hidden">
                        {images.length > 1 && (
                            <button
                                onClick={prevImage}
                                className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-800 transition-all shadow-2xl"
                                title="Previous (Left Arrow)"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        <div className="max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center px-4">
                            <img
                                src={activeImage}
                                alt={post.title}
                                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-800/60"
                            />
                        </div>

                        {images.length > 1 && (
                            <button
                                onClick={nextImage}
                                className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-800 transition-all shadow-2xl"
                                title="Next (Right Arrow)"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto justify-center pb-1 max-w-full">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveImageIndex(index)}
                                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${index === activeImageIndex
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                            : 'border-slate-800 opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Footer />
        </div>
    );
}