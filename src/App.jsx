import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

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

function App() {
  return (
    <Router>
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
        <Route path="/admin/members" element={<ManageMembers />} />
        <Route path="/admin/content" element={<ManageContent />} />
        <Route path="/admin/polls" element={<AdminPolls />} />
        <Route path="/admin/streams" element={<AdminStreams />} />

        {/* Fallback Route for 404 Not Found */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center font-sans">
              <h1 className="text-6xl font-extrabold text-emerald-400">404</h1>
              <p className="text-xl mt-4 text-slate-400">Page Not Found</p>
              <Link
                to="/"
                className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-full font-medium transition-colors text-sm shadow-lg shadow-emerald-900/40"
              >
                Go to Homepage
              </Link>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;