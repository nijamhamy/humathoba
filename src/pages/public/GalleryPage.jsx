import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
    Image as ImageIcon,
    Calendar,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Images,
    ArrowLeft
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function GalleryPage() {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Album grid view state (the "all images in this batch" view)
    const [openAlbumKey, setOpenAlbumKey] = useState(null);

    // Lightbox modal state — operates on whichever photo list is "active"
    // (either the photos of an open album, or a single standalone photo)
    const [lightboxPhotos, setLightboxPhotos] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    // Touch swipe handling state
    const [touchStartX, setTouchStartX] = useState(0);

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('gallery')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPhotos(data || []);
        } catch (err) {
            console.error('Error fetching gallery:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Group individual photo rows into "albums".
    // Photos that share a batch_id (bulk-uploaded together) become one album.
    // Photos with no batch_id (single uploads) become their own 1-photo album.
    const albums = useMemo(() => {
        const map = new Map();

        photos.forEach((photo) => {
            const key = photo.batch_id || `single-${photo.id}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    title: photo.batch_id
                        ? (photo.batch_title || photo.category || 'Album')
                        : (photo.title || 'Untitled Memory'),
                    category: photo.category,
                    year_tag: photo.year_tag,
                    cover: photo,
                    photos: [],
                });
            }
            map.get(key).photos.push(photo);
        });

        return Array.from(map.values()).map((album) => ({
            ...album,
            count: album.photos.length,
        }));
    }, [photos]);

    // Get Unique Categories for Filter
    const categories = ['all', ...new Set(albums.map((a) => a.category).filter(Boolean))];

    // Filter Logic — filter at the album level
    const filteredAlbums = albums.filter(
        (a) => selectedCategory === 'all' || a.category === selectedCategory
    );

    const activeAlbum = filteredAlbums.find((a) => a.key === openAlbumKey) || null;

    // Open an album card: single-photo albums jump straight to the lightbox,
    // multi-photo albums open the grid view first.
    const openAlbum = (album) => {
        if (album.count === 1) {
            setLightboxPhotos(album.photos);
            setLightboxIndex(0);
        } else {
            setOpenAlbumKey(album.key);
        }
    };

    const closeAlbumView = () => {
        setOpenAlbumKey(null);
    };

    // Open the lightbox on a specific photo within the currently open album
    const openLightboxAt = (photoList, index) => {
        setLightboxPhotos(photoList);
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
        setLightboxPhotos([]);
    };

    const nextPhoto = useCallback(() => {
        setLightboxIndex((prevIndex) => {
            if (prevIndex === null) return prevIndex;
            return (prevIndex + 1) % lightboxPhotos.length;
        });
    }, [lightboxPhotos.length]);

    const prevPhoto = useCallback(() => {
        setLightboxIndex((prevIndex) => {
            if (prevIndex === null) return prevIndex;
            return prevIndex === 0 ? lightboxPhotos.length - 1 : prevIndex - 1;
        });
    }, [lightboxPhotos.length]);

    // Keyboard Navigation for Lightbox Modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, nextPhoto, prevPhoto]);

    // Touch Swipe Handlers
    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (touchStartX === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;

        if (diffX > 50) {
            nextPhoto();
        } else if (diffX < -50) {
            prevPhoto();
        }
        setTouchStartX(0);
    };

    const activePhoto = lightboxIndex !== null ? lightboxPhotos[lightboxIndex] : null;

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">

                {/* Header Section */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                        Photo Gallery
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                        Memories & Events
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                        Explore memorable moments, conventions, and gatherings of Al Hamiya Arabic College alumni.
                    </p>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${selectedCategory === category
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Album Grid */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={36} className="animate-spin text-emerald-500" />
                        <p className="text-xs font-medium">Loading photo gallery...</p>
                    </div>
                ) : filteredAlbums.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAlbums.map((album) => (
                            <div
                                key={album.key}
                                onClick={() => openAlbum(album)}
                                className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm hover:border-slate-700 transition-all group shadow-xl flex flex-col justify-between cursor-pointer"
                            >
                                <div className="relative overflow-hidden aspect-video">
                                    <img
                                        src={album.cover.image_url}
                                        alt={album.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-400 border border-slate-800 flex items-center gap-1">
                                        <Calendar size={12} />
                                        <span>{album.year_tag || new Date().getFullYear()}</span>
                                    </div>

                                    {/* Photo count badge for multi-photo albums */}
                                    {album.count > 1 && (
                                        <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-white flex items-center gap-1 shadow-md">
                                            <Images size={12} />
                                            <span>{album.count} photos</span>
                                        </div>
                                    )}

                                    {/* Hover enlarge icon overlay */}
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <div className="bg-emerald-600/90 p-3 rounded-full shadow-lg">
                                            <Maximize2 size={20} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 space-y-2">
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                        {album.category || 'Event'}
                                    </span>
                                    <h3 className="text-base font-bold text-white line-clamp-1">
                                        {album.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
                        <ImageIcon size={40} className="mx-auto text-slate-600" />
                        <h3 className="text-base font-bold text-slate-300">No Photos Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            No gallery images uploaded yet for this category.
                        </p>
                    </div>
                )}

            </main>

            {/* ALBUM VIEW — grid of every photo inside the selected batch */}
            {activeAlbum && lightboxIndex === null && (
                <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-950/95 backdrop-blur-xl z-10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={closeAlbumView}
                                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-white">{activeAlbum.title}</h2>
                                    <p className="text-xs text-slate-400">
                                        {activeAlbum.count} photos · {activeAlbum.category} · {activeAlbum.year_tag}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeAlbumView}
                                className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
                            {activeAlbum.photos.map((photo, index) => (
                                <div
                                    key={photo.id}
                                    onClick={() => openLightboxAt(activeAlbum.photos, index)}
                                    className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-all"
                                >
                                    <img
                                        src={photo.image_url}
                                        alt={photo.title || 'Gallery image'}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Maximize2 size={18} className="text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* FULL-SCREEN LIGHTBOX MODAL */}
            {activePhoto && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Top Bar */}
                    <div className="flex items-center justify-between z-10 max-w-7xl mx-auto w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-mono">
                                {lightboxIndex + 1} / {lightboxPhotos.length}
                            </span>
                            {activePhoto.category && (
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                    {activePhoto.category}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={closeLightbox}
                            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                            title="Close (Esc)"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Image Viewer with Prev / Next Navigation */}
                    <div className="relative flex-grow flex items-center justify-center my-4 overflow-hidden">
                        {lightboxPhotos.length > 1 && (
                            <button
                                onClick={prevPhoto}
                                className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-800 transition-all shadow-2xl"
                                title="Previous (Left Arrow)"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        <div className="max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center px-4">
                            <img
                                src={activePhoto.image_url}
                                alt={activePhoto.title || 'Enlarged photo'}
                                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-800/60"
                            />
                        </div>

                        {lightboxPhotos.length > 1 && (
                            <button
                                onClick={nextPhoto}
                                className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-800 transition-all shadow-2xl"
                                title="Next (Right Arrow)"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </div>

                    {/* Bottom Details Footer */}
                    <div className="text-center space-y-1 max-w-xl mx-auto z-10">
                        <h2 className="text-lg sm:text-xl font-bold text-white">
                            {activePhoto.title || 'Untitled Memory'}
                        </h2>
                        {activePhoto.year_tag && (
                            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                <Calendar size={12} className="text-emerald-400" />
                                <span>{activePhoto.year_tag}</span>
                            </p>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}