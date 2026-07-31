import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
    Users,
    Calendar,
    Newspaper,
    ArrowRight,
    Quote,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    User
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

/* =========================================================
   Utility hooks
   ========================================================= */

// Respects the user's OS-level "reduce motion" preference.
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(mq.matches);
        const handler = (e) => setReduced(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return reduced;
}

// Fires once an element scrolls into view — used for gentle section reveals.
function useInView(threshold = 0.15) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);
    return [ref, inView];
}

// Animates a number counting up to its target once visible.
function useCountUp(target, inView, duration = 1200) {
    const [value, setValue] = useState(0);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (!inView) return;
        if (reducedMotion || !target) {
            setValue(target || 0);
            return;
        }
        let start = null;
        let frameId;
        const step = (timestamp) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            setValue(Math.round(eased * target));
            if (progress < 1) frameId = requestAnimationFrame(step);
        };
        frameId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frameId);
    }, [inView, target, duration, reducedMotion]);

    return value;
}

// Enables smooth mouse-drag on horizontal scroll rails, plus a gentle
// auto-scroll loop that pauses on hover, touch, or reduced-motion preference.
function useDraggableScroll(itemsCount, autoScrollSpeed = 0.5) {
    const ref = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const isMouseDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        const slider = ref.current;
        if (!slider || itemsCount <= 5 || reducedMotion) return;

        let animationFrameId;
        const autoScroll = () => {
            if (!isHovered && !isMouseDown.current) {
                slider.scrollLeft += autoScrollSpeed;
                if (slider.scrollLeft >= slider.scrollWidth / 2) {
                    slider.scrollLeft = 0;
                }
            }
            animationFrameId = requestAnimationFrame(autoScroll);
        };
        animationFrameId = requestAnimationFrame(autoScroll);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isHovered, itemsCount, autoScrollSpeed, reducedMotion]);

    const handleMouseDown = (e) => {
        const slider = ref.current;
        if (!slider) return;
        isMouseDown.current = true;
        startX.current = e.pageX - slider.offsetLeft;
        scrollLeft.current = slider.scrollLeft;
    };
    const handleMouseLeave = () => {
        isMouseDown.current = false;
        setIsHovered(false);
    };
    const handleMouseUp = () => {
        isMouseDown.current = false;
    };
    const handleMouseMove = (e) => {
        if (!isMouseDown.current) return;
        e.preventDefault();
        const slider = ref.current;
        if (!slider) return;
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX.current) * 1.5;
        slider.scrollLeft = scrollLeft.current - walk;
    };

    return {
        ref,
        events: {
            onMouseDown: handleMouseDown,
            onMouseLeave: handleMouseLeave,
            onMouseUp: handleMouseUp,
            onMouseMove: handleMouseMove,
            onMouseEnter: () => setIsHovered(true),
            onTouchStart: () => setIsHovered(true),
            onTouchEnd: () => setIsHovered(false),
        }
    };
}

/* =========================================================
   Small presentational pieces
   ========================================================= */

function Eyebrow({ color, children }) {
    const colorMap = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    };
    return (
        <span className={`inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full border ${colorMap[color]}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
            {children}
        </span>
    );
}

function SectionHeader({ eyebrow, eyebrowColor, title, linkTo, linkLabel }) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
                <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mt-3">
                    {title}
                </h2>
            </div>
            {linkTo && (
                <Link
                    to={linkTo}
                    className={`text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-sm ${eyebrowColor === 'teal'
                        ? 'text-teal-400 hover:text-teal-300 focus-visible:ring-teal-400'
                        : 'text-cyan-400 hover:text-cyan-300 focus-visible:ring-cyan-400'
                        }`}
                >
                    <span>{linkLabel}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, value, label, accent, inView }) {
    const count = useCountUp(value, inView);
    const accentMap = {
        emerald: 'text-emerald-400',
        teal: 'text-teal-400',
        cyan: 'text-cyan-400',
    };
    return (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/50 border border-slate-800/60 shadow-lg text-center transition-transform hover:-translate-y-0.5">
            <Icon size={30} className={`${accentMap[accent]} mx-auto mb-3`} aria-hidden="true" />
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                {count}+
            </h3>
            <p className="text-slate-400 text-[11px] sm:text-xs mt-1.5 uppercase tracking-wider font-semibold">
                {label}
            </p>
        </div>
    );
}

function GalleryCard({ item }) {
    return (
        <div className="w-[240px] sm:w-[300px] lg:w-[320px] flex-shrink-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-video relative group shadow-lg snap-start">
            <img
                src={item.image_url}
                alt={item.title || 'Alumni gathering photo'}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent flex flex-col justify-end p-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <p className="text-xs font-bold text-white truncate">{item.title || 'Untitled'}</p>
                {item.category && (
                    <span className="text-[10px] text-emerald-400 font-medium">{item.category}</span>
                )}
            </div>
        </div>
    );
}

function NewsCard({ post }) {
    return (
        <div className="w-[260px] sm:w-[300px] lg:w-[320px] flex-shrink-0 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm hover:border-slate-700 transition-all flex flex-col shadow-xl group snap-start">
            <div className="relative w-full h-40 bg-slate-950 overflow-hidden">
                {post.featured_image_url ? (
                    <img
                        src={post.featured_image_url}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/50">
                        <Newspaper size={32} className="mb-1 opacity-50" aria-hidden="true" />
                        <span className="text-[10px] uppercase font-semibold">No Image</span>
                    </div>
                )}
                <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-800">
                    {post.author_name || 'By Admin'}
                </span>
            </div>

            <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Calendar size={12} className="text-emerald-400" aria-hidden="true" />
                        <span>
                            {new Date(post.published_at || post.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                        {post.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {post.content}
                    </p>
                </div>
                <Link
                    to={`/blog/${post.id}`}
                    className="text-xs text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm w-fit"
                >
                    <span>Read Article</span>
                    <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );
}

// Skeleton placeholder shown while gallery/news are loading, so the page
// never feels like it's stalled or broken.
function RailSkeleton({ count = 4, variant = 'gallery' }) {
    const height = variant === 'gallery' ? 'aspect-video' : 'h-64';
    return (
        <div className="flex gap-4 sm:gap-5 overflow-hidden px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`w-[240px] sm:w-[300px] lg:w-[320px] flex-shrink-0 rounded-2xl bg-slate-900 border border-slate-800/60 ${height} animate-pulse`}
                />
            ))}
        </div>
    );
}

function EmptyState({ icon: Icon, message }) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                <Icon size={28} className="opacity-50" aria-hidden="true" />
                <p className="text-xs text-slate-500">{message}</p>
            </div>
        </div>
    );
}

/* =========================================================
   Executive addresses carousel
   ========================================================= */

const DEFAULT_LEADER_MESSAGES = [
    {
        role: "President's Address",
        title: '"Fostering Lifelong Ties & Serving Our Alma Mater"',
        message: '"Majlisul Hamiyyeen serves as a bridge between past memories and future aspirations. Through our collective effort, we strive to support Al Hamiya Arabic College and empower our alumni network across the world."',
        name: 'President, Majlisul Hamiyyeen',
        image_url: '',
        accent: 'emerald'
    },
    {
        role: "Secretary's Address",
        title: '"Strengthening Administrative Excellence & Connectivity"',
        message: '"Communication and organized action are the backbones of our association. We are committed to maintaining transparent channels, executing planned alumni initiatives, and keeping our global network vibrant."',
        name: 'General Secretary, Majlisul Hamiyyeen',
        image_url: '',
        accent: 'cyan'
    },
    {
        role: "Treasurer's Address",
        title: '"Ensuring Financial Integrity & Sustainable Growth"',
        message: '"Every contribution from our alumni directly fuels scholarships, campus developments, and community welfare programs. We remain dedicated to full financial accountability and impactful investments."',
        name: 'Treasurer, Majlisul Hamiyyeen',
        image_url: '',
        accent: 'teal'
    }
];

const ACCENT_STYLES = {
    emerald: { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', ring: 'from-emerald-500 via-teal-400 to-cyan-500' },
    cyan: { badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', ring: 'from-cyan-500 via-emerald-400 to-teal-500' },
    teal: { badge: 'text-teal-400 bg-teal-500/10 border-teal-500/20', ring: 'from-teal-500 via-cyan-400 to-emerald-500' },
};

function ExecutiveCarousel({ leaderMessages }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (paused || reducedMotion || leaderMessages.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % leaderMessages.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [paused, reducedMotion, leaderMessages.length]);

    const next = useCallback(() => setIndex((p) => (p + 1) % leaderMessages.length), [leaderMessages.length]);
    const prev = useCallback(() => setIndex((p) => (p === 0 ? leaderMessages.length - 1 : p - 1)), [leaderMessages.length]);

    return (
        <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 backdrop-blur-md relative overflow-hidden shadow-2xl"
            role="region"
            aria-roledescription="carousel"
            aria-label="Executive leadership addresses"
        >
            <Quote size={180} className="absolute -right-6 -bottom-6 text-slate-800/20 pointer-events-none z-0 hidden sm:block" aria-hidden="true" />

            <div className="relative z-10 flex items-center justify-between gap-3 mb-8">
                <Eyebrow color="emerald">Executive Leadership Addresses</Eyebrow>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={prev}
                        aria-label="Previous address"
                        className="p-2.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50 transition-all shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={next}
                        aria-label="Next address"
                        className="p-2.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50 transition-all shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="relative z-10 overflow-hidden">
                <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                    aria-live="polite"
                >
                    {leaderMessages.map((leader, idx) => {
                        const accent = ACCENT_STYLES[leader.accent] || ACCENT_STYLES.emerald;
                        return (
                            <div
                                key={idx}
                                className="w-full flex-shrink-0 flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12"
                                aria-hidden={index !== idx}
                            >
                                <div className="flex-1 space-y-4 sm:space-y-5 text-center lg:text-left">
                                    <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full border ${accent.badge}`}>
                                        {leader.role}
                                    </span>
                                    <h2 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
                                        {leader.title}
                                    </h2>
                                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic max-w-2xl mx-auto lg:mx-0">
                                        {leader.message}
                                    </p>
                                    <div className="pt-3 border-t border-slate-800/80">
                                        <h4 className="text-sm font-bold text-white flex items-center justify-center lg:justify-start gap-1.5">
                                            <span>{leader.name}</span>
                                            <ShieldCheck size={16} className="text-emerald-400 shrink-0" aria-hidden="true" />
                                        </h4>
                                        <p className="text-xs text-emerald-400 font-medium mt-0.5">
                                            Al Hamiya College Old Boys Association
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 relative group">
                                    <div className={`absolute -inset-1 bg-gradient-to-r ${accent.ring} rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none`} />
                                    <div className="relative w-32 h-32 sm:w-44 sm:h-44 lg:w-52 lg:h-52 rounded-full p-1.5 bg-gradient-to-b from-emerald-500 via-slate-800 to-slate-900 shadow-2xl">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 border-slate-900 relative flex items-center justify-center">
                                            {leader.image_url ? (
                                                <img
                                                    src={leader.image_url}
                                                    alt={leader.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-emerald-400">
                                                    <User size={44} className="opacity-80 mb-1" aria-hidden="true" />
                                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Executive
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-1.5 right-1.5 bg-slate-950/90 border border-emerald-500/40 p-1.5 sm:p-2 rounded-full shadow-lg backdrop-blur-md text-emerald-400">
                                            <ShieldCheck size={16} className="sm:hidden" />
                                            <ShieldCheck size={20} className="hidden sm:block" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-center gap-2 mt-8 pt-4 border-t border-slate-800/60">
                {leaderMessages.map((leader, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Show ${leader.role}`}
                        aria-current={index === i}
                        className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${index === i ? 'w-8 bg-emerald-400' : 'w-2 bg-slate-800 hover:bg-slate-700'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

/* =========================================================
   Page
   ========================================================= */

export default function HomePage() {
    const [stats, setStats] = useState({ members: 0, posts: 0, gallery: 0 });
    const [recentPosts, setRecentPosts] = useState([]);
    const [recentGallery, setRecentGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [leaderMessages, setLeaderMessages] = useState(DEFAULT_LEADER_MESSAGES);

    const [statsRef, statsInView] = useInView();
    const [execRef, execInView] = useInView();
    const [galleryRef, galleryInView] = useInView();
    const [newsRef, newsInView] = useInView();

    useEffect(() => {
        fetchHomeData();
    }, []);

    const fetchHomeData = async () => {
        setLoading(true);
        try {
            const { count: memberCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('approval_status', 'approved');

            const { count: postCount } = await supabase
                .from('blog_posts')
                .select('*', { count: 'exact', head: true });

            const { count: galleryCount } = await supabase
                .from('gallery')
                .select('*', { count: 'exact', head: true });

            setStats({
                members: memberCount || 0,
                posts: postCount || 0,
                gallery: galleryCount || 0,
            });

            const { data: postsData, error: postsErr } = await supabase
                .from('blog_posts')
                .select('id, title, content, featured_image_url, author_name, published_at, created_at, status')
                .order('created_at', { ascending: false })
                .limit(15);

            if (postsErr) {
                console.error('Error fetching blog posts:', postsErr);
            } else {
                const validPosts = (postsData || []).filter(
                    (p) => !p.status || p.status.toLowerCase() === 'published'
                );
                setRecentPosts(validPosts.length > 0 ? validPosts : postsData || []);
            }

            const { data: galleryData, error: galleryErr } = await supabase
                .from('gallery')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(15);

            if (galleryErr) {
                console.error('Error fetching gallery:', galleryErr);
            } else {
                setRecentGallery(galleryData || []);
            }

            const { data: siteSettings } = await supabase
                .from('site_settings')
                .select('*');

            if (siteSettings && siteSettings.length > 0) {
                const presSetting = siteSettings.find(s => s.key === 'president_address')?.value;
                const secSetting = siteSettings.find(s => s.key === 'secretary_address')?.value;
                const treasSetting = siteSettings.find(s => s.key === 'treasurer_address')?.value;

                setLeaderMessages([
                    { ...DEFAULT_LEADER_MESSAGES[0], ...presSetting, accent: 'emerald' },
                    { ...DEFAULT_LEADER_MESSAGES[1], ...secSetting, accent: 'cyan' },
                    { ...DEFAULT_LEADER_MESSAGES[2], ...treasSetting, accent: 'teal' },
                ]);
            }
        } catch (error) {
            console.error('Error fetching homepage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const galleryItems = useMemo(
        () => (recentGallery.length > 5 ? [...recentGallery, ...recentGallery] : recentGallery),
        [recentGallery]
    );
    const postItems = useMemo(
        () => (recentPosts.length > 5 ? [...recentPosts, ...recentPosts] : recentPosts),
        [recentPosts]
    );

    const galleryScroll = useDraggableScroll(recentGallery.length, 0.6);
    const postsScroll = useDraggableScroll(recentPosts.length, 0.6);

    const statCards = [
        { icon: Users, value: stats.members, label: 'Verified Members', accent: 'emerald' },
        { icon: ImageIcon, value: stats.gallery, label: 'Gallery Memories', accent: 'teal' },
        { icon: Newspaper, value: stats.posts, label: 'Published News & Articles', accent: 'cyan' },
    ];

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="flex-grow pt-20 sm:pt-24">
                {/* 1. Hero */}
                <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[600px] sm:h-[600px] bg-emerald-500/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

                    <div className="max-w-5xl mx-auto text-center relative z-10 space-y-5 sm:space-y-6">
                        <Eyebrow color="emerald">Al Hamiya Arabic College Old Boys Association</Eyebrow>

                        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight text-balance">
                            Welcome to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                                Majlisul Hamiyyeen
                            </span>
                        </h1>

                        <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            Uniting alumni from around the globe to support our college, empower students, and build a vibrant community dedicated to excellence and service.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 max-w-sm sm:max-w-none mx-auto">
                            <Link
                                to="/register"
                                className="px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-900/40 hover:shadow-emerald-900/60 transition-all flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            >
                                <span>Join Association</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                to="/directory"
                                className="px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            >
                                Browse Members
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 2. Quick Stats */}
                <section
                    ref={statsRef}
                    className="py-10 sm:py-12 border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-md"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
                        {statCards.map((card) => (
                            <StatCard key={card.label} {...card} inView={statsInView} />
                        ))}
                    </div>
                </section>

                {/* 3. Executive Messages */}
                <section ref={execRef} className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <ExecutiveCarousel leaderMessages={leaderMessages} />
                </section>

                {/* 4. Photo Gallery */}
                <section ref={galleryRef} className="py-12 sm:py-16 space-y-6 sm:space-y-8 overflow-hidden">
                    <SectionHeader
                        eyebrow="Photo Gallery"
                        eyebrowColor="teal"
                        title="Memorable Moments"
                        linkTo="/gallery"
                        linkLabel="Explore Gallery"
                    />

                    {loading ? (
                        <RailSkeleton variant="gallery" />
                    ) : recentGallery.length > 0 ? (
                        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div
                                ref={galleryScroll.ref}
                                {...galleryScroll.events}
                                className="flex gap-4 overflow-x-auto scrollbar-none py-4 cursor-grab active:cursor-grabbing select-none snap-x snap-mandatory"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {galleryItems.map((item, idx) => (
                                    <GalleryCard key={`${item.id}-${idx}`} item={item} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <EmptyState icon={ImageIcon} message="No gallery photos uploaded yet." />
                    )}
                </section>

                {/* 5. Latest News */}
                <section ref={newsRef} className="py-12 sm:py-16 pb-16 sm:pb-20 space-y-6 sm:space-y-8 overflow-hidden">
                    <SectionHeader
                        eyebrow="News & Articles"
                        eyebrowColor="cyan"
                        title="Latest Announcements"
                        linkTo="/blog"
                        linkLabel="View All News"
                    />

                    {loading ? (
                        <RailSkeleton variant="news" />
                    ) : recentPosts.length > 0 ? (
                        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div
                                ref={postsScroll.ref}
                                {...postsScroll.events}
                                className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none py-4 cursor-grab active:cursor-grabbing select-none snap-x snap-mandatory"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {postItems.map((post, idx) => (
                                    <NewsCard key={`${post.id}-${idx}`} post={post} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <EmptyState icon={Newspaper} message="No articles published yet." />
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}