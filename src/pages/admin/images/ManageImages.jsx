import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    Trash2,
    Loader2,
    ImageIcon,
    Search,
    Filter,
    X,
    CheckCircle2,
    FolderPlus,
    Layers,
    Images,
    Maximize2
} from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export default function ManageImages() {
    // Existing images loaded from DB
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Album detail view (the "all images in this batch" view)
    const [openAlbumKey, setOpenAlbumKey] = useState(null);

    // Bulk upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]); // [{ file, previewUrl, title }]
    const [batchTitle, setBatchTitle] = useState('');
    const [batchCategory, setBatchCategory] = useState('Events');
    const [batchYear, setBatchYear] = useState(new Date().getFullYear());
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('gallery')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setImages(data || []);
        } catch (err) {
            console.error('Error fetching gallery images:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Convert a File object to a base64 data URL
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Handle selecting many files at once (supports 150+)
    const handleFilesSelected = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newEntries = files.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            title: file.name.replace(/\.[^/.]+$/, ''), // strip extension as default title
        }));

        setPendingFiles((prev) => [...prev, ...newEntries]);
        setShowUploadModal(true);

        // Reset the input so selecting the same files again still fires onChange
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Update the caption/title for one pending (not-yet-uploaded) image
    const handlePendingTitleChange = (index, newTitle) => {
        setPendingFiles((prev) =>
            prev.map((item, i) => (i === index ? { ...item, title: newTitle } : item))
        );
    };

    // Remove one file from the pending batch before uploading
    const handleRemovePendingFile = (index) => {
        setPendingFiles((prev) => {
            const removed = prev[index];
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Clear the whole pending batch and close the modal
    const handleCancelUploadBatch = () => {
        pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        setPendingFiles([]);
        setBatchTitle('');
        setShowUploadModal(false);
    };

    // Upload every pending file sequentially (keeps memory usage sane for 150+ photos)
    // Every photo in this batch shares one batch_id + batch_title so the gallery
    // (and this admin screen) can group them into a single "album" tile.
    const handleUploadBatch = async () => {
        if (pendingFiles.length === 0) {
            alert('Please select at least one image to upload.');
            return;
        }
        if (!batchTitle.trim()) {
            alert('Please give this album a title.');
            return;
        }

        setUploading(true);
        setUploadProgress({ done: 0, total: pendingFiles.length });

        const batchId = crypto.randomUUID();

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < pendingFiles.length; i++) {
            const entry = pendingFiles[i];
            try {
                const base64Image = await convertFileToBase64(entry.file);

                const { error } = await supabase.from('gallery').insert([
                    {
                        title: entry.title || 'Untitled Photo',
                        image_url: base64Image,
                        category: batchCategory,
                        year_tag: parseInt(batchYear, 10),
                        batch_id: batchId,
                        batch_title: batchTitle.trim(),
                    },
                ]);

                if (error) throw error;
                successCount++;
            } catch (err) {
                console.error(`Failed to upload "${entry.title}":`, err.message);
                failCount++;
            } finally {
                setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
            }
        }

        setUploading(false);

        if (failCount === 0) {
            alert(`All ${successCount} photo(s) uploaded successfully!`);
        } else {
            alert(`Uploaded ${successCount} photo(s). ${failCount} failed — check console for details.`);
        }

        handleCancelUploadBatch();
        fetchImages();
    };

    // Delete a single already-uploaded image from the gallery
    const handleDeleteImage = async (id) => {
        if (!window.confirm('Delete this image permanently from the gallery?')) return;
        try {
            const { error } = await supabase.from('gallery').delete().eq('id', id);
            if (error) throw error;

            setImages((prev) => prev.filter((img) => img.id !== id));
        } catch (err) {
            alert('Failed to delete image: ' + err.message);
        }
    };

    // Delete every photo belonging to one album/batch in one go
    const handleDeleteAlbum = async (album) => {
        const confirmMsg =
            album.count > 1
                ? `Delete the entire "${album.title}" album (${album.count} photos) permanently?`
                : `Delete this image permanently from the gallery?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            if (album.isBatch) {
                const { error } = await supabase.from('gallery').delete().eq('batch_id', album.key);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('gallery').delete().eq('id', album.cover.id);
                if (error) throw error;
            }

            const idsToRemove = new Set(album.photos.map((p) => p.id));
            setImages((prev) => prev.filter((img) => !idsToRemove.has(img.id)));
            setOpenAlbumKey(null);
        } catch (err) {
            alert('Failed to delete album: ' + err.message);
        }
    };

    // Group flat image rows into albums (shared batch_id = one album)
    const albums = useMemo(() => {
        const map = new Map();

        images.forEach((img) => {
            const key = img.batch_id || `single-${img.id}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    isBatch: Boolean(img.batch_id),
                    title: img.batch_id ? (img.batch_title || img.category || 'Album') : (img.title || 'Untitled Photo'),
                    category: img.category,
                    year_tag: img.year_tag,
                    cover: img,
                    photos: [],
                });
            }
            map.get(key).photos.push(img);
        });

        return Array.from(map.values()).map((album) => ({
            ...album,
            count: album.photos.length,
        }));
    }, [images]);

    const filteredAlbums = albums.filter((album) => {
        const matchesSearch = album.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || album.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalPhotoCount = filteredAlbums.reduce((sum, a) => sum + a.count, 0);

    const activeAlbum = filteredAlbums.find((a) => a.key === openAlbumKey) || null;

    const categories = ['Events', 'Campus', 'Graduation', 'Sports', 'Gatherings'];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
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
                                Manage Gallery Images
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Upload photos in bulk as albums, edit captions, and remove images from the live gallery.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                    >
                        <Layers size={16} />
                        <span>Bulk Upload Photos</span>
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

                {/* Search + Filter + Counter */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
                    <div className="relative w-full sm:w-80">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by album/photo title..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400">
                            <Filter size={14} className="text-slate-500" />
                            <span>Category:</span>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-transparent text-white focus:outline-none font-medium cursor-pointer"
                            >
                                <option value="all" className="bg-slate-900">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-xs text-slate-400">
                            Albums: <span className="text-emerald-400 font-bold">{filteredAlbums.length}</span>
                            <span className="mx-1.5 text-slate-700">|</span>
                            Photos: <span className="text-emerald-400 font-bold">{totalPhotoCount}</span>
                        </div>
                    </div>
                </div>

                {/* Album Grid */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={32} className="animate-spin text-emerald-500" />
                        <p className="text-xs">Loading gallery images...</p>
                    </div>
                ) : filteredAlbums.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredAlbums.map((album) => (
                            <div
                                key={album.key}
                                onClick={() => setOpenAlbumKey(album.key)}
                                className="group relative bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all cursor-pointer"
                            >
                                <div className="aspect-square w-full bg-slate-950">
                                    <img
                                        src={album.cover.image_url}
                                        alt={album.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Photo count badge for multi-photo albums */}
                                {album.count > 1 && (
                                    <div className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-semibold text-white flex items-center gap-1 shadow-md">
                                        <Images size={11} />
                                        <span>{album.count}</span>
                                    </div>
                                )}

                                {/* Overlay with title + delete, shown on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAlbum(album);
                                            }}
                                            className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow-md transition-colors"
                                            title={album.count > 1 ? 'Delete Whole Album' : 'Delete Image'}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-white line-clamp-2 leading-snug">
                                            {album.title}
                                        </p>
                                        <span className="text-[9px] text-emerald-400 font-medium">
                                            {album.category} · {album.year_tag}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
                        <ImageIcon size={40} className="mx-auto text-slate-600" />
                        <h3 className="text-base font-bold text-slate-300">No Images Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Click "Bulk Upload Photos" above to add images to your live gallery.
                        </p>
                    </div>
                )}
            </div>

            {/* ALBUM DETAIL VIEW — every photo inside the selected batch, with per-photo delete */}
            {activeAlbum && (
                <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-950/95 backdrop-blur-xl z-10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setOpenAlbumKey(null)}
                                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-white">{activeAlbum.title}</h2>
                                    <p className="text-xs text-slate-400">
                                        {activeAlbum.count} photo{activeAlbum.count !== 1 ? 's' : ''} · {activeAlbum.category} · {activeAlbum.year_tag}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDeleteAlbum(activeAlbum)}
                                    className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                                >
                                    <Trash2 size={14} />
                                    <span>Delete {activeAlbum.count > 1 ? 'Whole Album' : 'Image'}</span>
                                </button>
                                <button
                                    onClick={() => setOpenAlbumKey(null)}
                                    className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
                            {activeAlbum.photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                                >
                                    <img
                                        src={photo.image_url}
                                        alt={photo.title || 'Gallery image'}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleDeleteImage(photo.id)}
                                                className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow-md transition-colors"
                                                title="Delete This Photo"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-medium text-white line-clamp-1">
                                            {photo.title}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col space-y-5 shadow-2xl">

                        <div className="flex justify-between items-center border-b border-slate-800 pb-4 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FolderPlus size={20} className="text-emerald-400" />
                                    Bulk Upload — {pendingFiles.length} Photo{pendingFiles.length !== 1 ? 's' : ''} Selected
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Add more files, edit captions, then upload the whole batch as one album.
                                </p>
                            </div>
                            <button
                                onClick={handleCancelUploadBatch}
                                disabled={uploading}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Album title, shared category + year for the whole batch */}
                        <div className="space-y-3 shrink-0">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Album Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={batchTitle}
                                    onChange={(e) => setBatchTitle(e.target.value)}
                                    placeholder="e.g. Annual Convocation 2026"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        Category for this batch *
                                    </label>
                                    <select
                                        value={batchCategory}
                                        onChange={(e) => setBatchCategory(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Year *</label>
                                    <input
                                        type="number"
                                        value={batchYear}
                                        onChange={(e) => setBatchYear(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Add more files to the current batch */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="shrink-0 w-full py-2 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-emerald-500 text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            <Upload size={14} />
                            <span>Add More Photos to This Batch</span>
                        </button>

                        {/* Scrollable thumbnail preview grid with editable titles */}
                        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {pendingFiles.map((entry, index) => (
                                    <div
                                        key={index}
                                        className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden space-y-1.5 p-2"
                                    >
                                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-900">
                                            <img
                                                src={entry.previewUrl}
                                                alt={entry.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePendingFile(index)}
                                                disabled={uploading}
                                                className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow-md transition-colors disabled:opacity-40"
                                                title="Remove from batch"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={entry.title}
                                            onChange={(e) => handlePendingTitleChange(index, e.target.value)}
                                            disabled={uploading}
                                            placeholder="Photo caption..."
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upload progress + action buttons */}
                        <div className="shrink-0 space-y-3 pt-2 border-t border-slate-800">
                            {uploading && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Uploading {uploadProgress.done} of {uploadProgress.total}...</span>
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

                            <div className="flex gap-3">
                                <button
                                    onClick={handleUploadBatch}
                                    disabled={uploading || pendingFiles.length === 0}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Uploading Batch...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>Upload All {pendingFiles.length} Photo{pendingFiles.length !== 1 ? 's' : ''}</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancelUploadBatch}
                                    disabled={uploading}
                                    className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}