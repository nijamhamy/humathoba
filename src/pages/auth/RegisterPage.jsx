import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    GraduationCap,
    Briefcase,
    MapPin,
    Lock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    X,
    Camera
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../supabaseClient';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Profile Image state
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        batchYear: '',
        indexNumber: '',
        occupation: '',
        company: '',
        country: 'Sri Lanka',
        address: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Compress & convert profile image to small Base64 string
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setErrorMsg('Profile image must be less than 5MB.');
            return;
        }

        setErrorMsg('');
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize image to max 400x400 for optimal fast Base64 storage
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 400;

                if (width > height) {
                    if (width > maxDim) {
                        height *= maxDim / width;
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                setImagePreview(compressedBase64);
                setImageBase64(compressedBase64);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageBase64(null);
    };

    const handleNext = (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (step === 1) {
            if (formData.password !== formData.confirmPassword) {
                setErrorMsg('Passwords do not match!');
                return;
            }
            if (formData.password.length < 6) {
                setErrorMsg('Password must be at least 6 characters long.');
                return;
            }
        }

        if (step < 3) setStep(step + 1);
    };

    const handlePrev = () => {
        setErrorMsg('');
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            // 1. Sign up user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            // 2. Insert detailed profile data into 'users' table
            const { error: dbError } = await supabase.from('users').insert([
                {
                    full_name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password_hash: 'PROTECTED_BY_SUPABASE_AUTH',
                    batch_year: parseInt(formData.batchYear, 10),
                    index_number: formData.indexNumber || null,
                    occupation: formData.occupation,
                    company_name: formData.company || null,
                    country: formData.country,
                    address: formData.address || null,
                    profile_image_url: imageBase64 || null,
                    approval_status: 'pending',
                },
            ]);

            if (dbError) throw dbError;

            alert('Registration submitted successfully! Your account is pending admin approval.');
            navigate('/login');
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex-grow flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-xl w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative z-10">

                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Member Registration
                        </h2>
                        <p className="text-slate-400 text-sm mt-2">
                            Join the Majlisul Hamiyyeen Old Boys Association.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-8 relative px-4">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 z-0" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-300 z-0"
                            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                        />

                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold relative z-10 transition-all ${step >= i
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                    }`}
                            >
                                {step > i ? <CheckCircle2 size={18} /> : i}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-5">

                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <h3 className="text-emerald-400 font-semibold text-sm tracking-wide uppercase mb-2">
                                    Step 1: Personal Information
                                </h3>

                                <div className="flex flex-col items-center justify-center pb-2">
                                    <label className="block text-xs font-medium text-slate-400 mb-2">
                                        Profile Photo <span className="text-slate-500">(Optional)</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-slate-950 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center relative shadow-inner">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-500 space-y-1">
                                                    <Camera size={26} />
                                                    <span className="text-[10px] font-medium">Upload</span>
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />

                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute -top-1 -right-1 z-20 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full shadow-lg transition-colors"
                                                title="Remove photo"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name *</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            name="fullName"
                                            required
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address *</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="example@gmail.com"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone / WhatsApp *</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+94 7X XXX XXXX"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Password *</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="password"
                                                name="password"
                                                required
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password *</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                required
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <h3 className="text-emerald-400 font-semibold text-sm tracking-wide uppercase mb-2">
                                    Step 2: College Information
                                </h3>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Batch / Passing Year *</label>
                                    <div className="relative">
                                        <GraduationCap size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="number"
                                            name="batchYear"
                                            required
                                            value={formData.batchYear}
                                            onChange={handleChange}
                                            placeholder="e.g. 2018"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Index / Student ID (Optional)</label>
                                    <input
                                        type="text"
                                        name="indexNumber"
                                        value={formData.indexNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. HAM-123"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <h3 className="text-emerald-400 font-semibold text-sm tracking-wide uppercase mb-2">
                                    Step 3: Profession & Location
                                </h3>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Occupation / Field *</label>
                                    <div className="relative">
                                        <Briefcase size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            name="occupation"
                                            required
                                            value={formData.occupation}
                                            onChange={handleChange}
                                            placeholder="Teacher / Software Developer / Business"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Company / Organization (Optional)</label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        placeholder="Company name"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Country of Residence *</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            name="country"
                                            required
                                            value={formData.country}
                                            onChange={handleChange}
                                            placeholder="Sri Lanka / Qatar / UAE"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Address</label>
                                    <textarea
                                        name="address"
                                        rows="2"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="City / District"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    disabled={loading}
                                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Back</span>
                                </button>
                            ) : <div />}

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{step === 3 ? 'Submit Registration' : 'Next'}</span>
                                        {step < 3 && <ArrowRight size={16} />}
                                    </>
                                )}
                            </button>
                        </div>

                    </form>

                    <p className="text-center text-xs text-slate-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-400 font-medium hover:underline">
                            Login here
                        </Link>
                    </p>

                </div>
            </main>

            <Footer />
        </div>
    );
}