import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../supabaseClient';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSubmitted(true);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to send password reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans">
            <Navbar />

            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex-grow flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative z-10">

                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/20">
                            <KeyRound size={24} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Forgot Password?
                        </h2>
                        <p className="text-slate-400 text-xs sm:text-sm mt-2">
                            Enter your registered email address to receive a password reset link.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                            {errorMsg}
                        </div>
                    )}

                    {submitted ? (
                        <div className="py-6 text-center space-y-4">
                            <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
                            <h3 className="text-lg font-bold text-white">Check Your Email</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                We have sent a password recovery link to <span className="text-emerald-400 font-semibold">{email}</span>. Please check your inbox and follow the instructions.
                            </p>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="inline-block px-6 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
                                >
                                    Return to Login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@gmail.com"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Sending Link...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send Recovery Link</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <p className="text-center text-xs text-slate-500 mt-8">
                        Remembered your password?{' '}
                        <Link to="/login" className="text-emerald-400 font-medium hover:underline">
                            Log in here
                        </Link>
                    </p>

                </div>
            </main>

            <Footer />
        </div>
    );
}