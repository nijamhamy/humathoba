import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
    ArrowLeft,
    Calendar,
    UserCheck,
    Loader2,
    FileText,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Images,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function ArticleDetail() {
    const { id } = useParams();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Which photo is showing in the big preview panel
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Full-screen lightbox
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);

    useEffect(() => {
        fetchPost();
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchPost = async () => {
        setLoading(true);
        setNotFound(false);
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                setNotFound(true);
                setPost(null);
            } else {
                setPost(data);
                setActiveImageIndex(0);
            }
        } catch (err) {
            console.error('Error fetching article:', err.message);
            setNotFound(true);
        } finally {
            setLoading(false);
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

    const nextImage = useCallback(() => {
        setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    // Keyboard navigation while the lightbox is open
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

    // Swipe navigation on touch devices
    const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
    const handleTouchEnd = (e) => {
        if (touchStartX === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;
        if (diffX > 50) nextImage();
        else if (diffX < -50) prevImage();
        setTouchStartX(0);
    };

    // --- Loading state ---
    if (loading) {
        return (
            <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center gap-3 py-32">
                    <Loader2 size={36} className="animate-spin text-emerald-500" />
                    <p className="text-xs text-slate-500">Loading article...</p>
                </div>
                <Footer />
            </div>
        );
    }

    // --- Not found state ---
    if (notFound || !post) {
        return (
            <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center gap-4 py-32 px-4 text-center">
                    <FileText size={48} className="text-slate-700" />
                    <h1 className="text-xl font-bold text-white">Article Not Found</h1>
                    <p className="text-sm text-slate-500 max-w-sm">
                        This news article may have been removed, or the link is incorrect.
                    </p>
                    <Link
                        to="/blog"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all"
                    >
                        Back to News
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="flex-grow pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

                {/* Back link */}
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span>Back to News & Articles</span>
                </Link>

                {/*
                    Responsive layout:
                    - lg and up (laptop/desktop): 2 columns — photos LEFT, article RIGHT
                    - below lg (tablet/mobile): single column — photos on top, article below
                */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">

                    {/* LEFT column on desktop / TOP on mobile: Photos */}
                    <div className="space-y-3 lg:sticky lg:top-28">
                        {hasImages ? (
                            <>
                                {/* Main preview image */}
                                <div
                                    className="relative aspect-[4/3] sm:aspect-video lg:aspect-square w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl cursor-pointer group"
                                    onClick={() => setLightboxOpen(true)}
                                >
                                    <img
                                        src={activeImage}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-emerald-600/90 p-3 rounded-full shadow-lg">
                                            <Maximize2 size={20} className="text-white" />
                                        </div>
                                    </div>

                                    {images.length > 1 && (
                                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-400 border border-slate-800 flex items-center gap-1">
                                            <Images size={12} />
                                            <span>{activeImageIndex + 1} / {images.length}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail strip — only shown when there's more than one photo */}
                                {images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {images.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setActiveImageIndex(index)}
                                                className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${index === activeImageIndex
                                                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                                    : 'border-slate-800 opacity-70 hover:opacity-100'
                                                    }`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${post.title} thumbnail ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="aspect-[4/3] sm:aspect-video lg:aspect-square w-full rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700">
                                <FileText size={48} />
                            </div>
                        )}
                    </div>

                    {/* RIGHT column on desktop / BOTTOM on mobile: Article content */}
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${post.status === 'published'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    }`}
                            >
                                <span className="capitalize">{post.status}</span>
                            </span>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                {post.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                    <UserCheck size={14} />
                                    {post.author_name || 'By Admin'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    {new Date(post.published_at || post.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-slate-800 pt-5">
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm sm:text-[15px]">
                                {post.content}
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Full-screen lightbox */}
            {lightboxOpen && hasImages && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
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
                </div>
            )}

            <Footer />
        </div>
    );
}