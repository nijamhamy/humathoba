import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import emailjs from '@emailjs/browser';

// Replace these with your own EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_yhykq4g';
const EMAILJS_TEMPLATE_ID = 'template_tjwvjyl';
const EMAILJS_PUBLIC_KEY = '4Uzv_TP__x4I7ZHue';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            // Send email notification via EmailJS
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                },
                EMAILJS_PUBLIC_KEY
            );

            // Optional: also log it in Supabase (won't block success if this fails)
            try {
                await supabase.from('contact_messages').insert([
                    {
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject,
                        message: formData.message,
                        created_at: new Date(),
                    },
                ]);
            } catch (dbErr) {
                console.log('Supabase log failed (non-critical):', dbErr.message);
            }

            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            console.error('EmailJS send failed:', err);
            setErrorMsg('Something went wrong while sending your message. Please try again or email us directly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />

            <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">

                {/* Header Section */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                        Get In Touch
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                        Contact Association
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                        Have questions or want to reach out to the Majlisul Hamiyyeen executive committee? Send us a message!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Contact Details Cards */}
                    <div className="space-y-4 lg:col-span-1">
                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm space-y-3 shadow-lg">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <MapPin size={20} />
                            </div>
                            <h3 className="text-base font-bold text-white">College Address</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Al Hamiya Arabic College,<br />
                                Rest House Road, <br />
                                Kalmunai,Sri Lanka.
                            </p>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm space-y-3 shadow-lg">
                            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                                <Mail size={20} />
                            </div>
                            <h3 className="text-base font-bold text-white">Email Address</h3>
                            <p className="text-xs text-slate-400 font-mono">
                                contact.obahamiya@gmail.com
                            </p>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm space-y-3 shadow-lg">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                <Phone size={20} />
                            </div>
                            <h3 className="text-base font-bold text-white">Phone Support</h3>
                            <p className="text-xs text-slate-400 font-mono">
                                +94 78 99 77 706
                            </p>
                        </div>
                    </div>

                    {/* Send Message Form */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-sm shadow-xl lg:col-span-2">
                        {submitted ? (
                            <div className="py-12 text-center space-y-3">
                                <CheckCircle2 size={48} className="text-emerald-400 mx-auto animate-bounce" />
                                <h3 className="text-xl font-bold text-white">Thank You!</h3>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    Your message has been received successfully. Our team will get back to you shortly.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-4 px-5 py-2 bg-slate-800 border border-slate-700 text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-700 transition-colors"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <h3 className="text-lg font-bold text-white mb-2">Send us a Message</h3>

                                {errorMsg && (
                                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-3">
                                        <AlertCircle size={16} />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Mohammathu Nijam"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="e.g. example@gmail.com"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject *</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Inquiry / Membership Question"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Message *</label>
                                    <textarea
                                        name="message"
                                        rows="5"
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Write your message here..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Sending Message...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                </div>

            </main>

            <Footer />
        </div>
    );
}