import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import DirectoryPage from './pages/public/DirectoryPage';
import GalleryPage from './pages/public/GalleryPage';
import BlogPage from './pages/public/BlogPage';
import BlogSinglePage from './pages/public/BlogSinglePage';
import ContactPage from './pages/public/ContactPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPassword from './pages/auth/ForgotPassword';

// Member Portal Pages
import MemberDashboard from './pages/member/MemberDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageMembers from './pages/admin/ManageMembers';
import ManageContent from './pages/admin/ManageContent';
import AdminPolls from './pages/admin/AdminPolls';
import AdminStreams from './pages/admin/AdminStreams';
import ManageImages from './pages/admin/images/ManageImages';
import AdminEvents from './pages/admin/AdminEvents'; // <-- Events page imported

// ScrollToTop Helper Component for 100% Professional UX
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant jump to top for fast, snappy professional routing
    });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white antialiased">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogSinglePage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Member Portal Routes */}
          <Route path="/member/dashboard" element={<MemberDashboard />} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/members" element={<ManageMembers />} />
          <Route path="/admin/content" element={<ManageContent />} />
          <Route path="/admin/polls" element={<AdminPolls />} />
          <Route path="/admin/streams" element={<AdminStreams />} />
          <Route path="/admin/images" element={<ManageImages />} />
          <Route path="/admin/events" element={<AdminEvents />} /> {/* <-- Events route added */}

          {/* Fallback Route for 404 Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center font-sans">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-2xl">
                  <span className="text-3xl font-black text-emerald-400">404</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Page Not Found</h1>
                <p className="text-sm mt-2 text-slate-400 max-w-sm">
                  The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <Link
                  to="/"
                  className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all text-xs shadow-lg shadow-emerald-900/40"
                >
                  Back to Homepage
                </Link>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;