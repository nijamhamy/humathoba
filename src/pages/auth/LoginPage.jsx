import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn, Loader2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../supabaseClient';

export default function LoginPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            // 1. Authenticate user via Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            // 2. Fetch user profile & approval status from 'users' table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role_id, email, approval_status')
                .eq('email', formData.email)
                .maybeSingle();

            if (userError) throw userError;

            // 3. Admin Check Logic: Super Admin or Admin Email
            const isAdmin =
                userData?.role_id === 1 ||
                formData.email === 'amnijam60@gmail.com' ||
                formData.email.toLowerCase().includes('admin');

            if (isAdmin) {
                navigate('/admin/dashboard');
                return;
            }

            // 4. Regular Member Check Logic
            if (userData?.approval_status === 'approved') {
                navigate('/member/dashboard');
            } else if (userData?.approval_status === 'pending') {
                setErrorMsg('Your registration is pending admin approval. You will gain access once verified.');
            } else if (userData?.approval_status === 'rejected') {
                setErrorMsg('Your membership registration request was rejected. Please contact support.');
            } else {
                // Fallback for default approved members
                navigate('/member/dashboard');
            }

        } catch (err) {
            setErrorMsg(err.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex-grow flex items-center justify-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative z-10">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/20">
                            <LogIn size={24} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Member Login
                        </h2>
                        <p className="text-slate-400 text-sm mt-2">
                            Sign in to your Majlisul Hamiyyeen account
                        </p>
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium leading-relaxed">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                Email Address *
                            </label>
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

                        {/* Password Input */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-medium text-slate-300">
                                    Password *
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-emerald-400 hover:underline font-medium"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="w-4 h-4 bg-slate-950 border-slate-800 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="ml-2 text-xs text-slate-400 cursor-pointer">
                                Remember me
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Registration Link */}
                    <p className="text-center text-xs text-slate-500 mt-8">
                        Don't have an account yet?{' '}
                        <Link to="/register" className="text-emerald-400 font-medium hover:underline">
                            Register here
                        </Link>
                    </p>

                </div>
            </main>

            <Footer />
        </div>
    );
}