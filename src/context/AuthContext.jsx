import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial active session
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    await fetchUserProfile(session.user.email);
                }
            } catch (error) {
                console.error('Error fetching initial auth session:', error);
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        // 2. Listen for auth changes (Login, Logout, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    await fetchUserProfile(session.user.email);
                } else {
                    setUser(null);
                    setProfile(null);
                    setRole(null);
                }
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Fetch full profile and role from 'users' table
    const fetchUserProfile = async (email) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, roles(role_name)')
                .eq('email', email)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setProfile(data);
                // Determine role (e.g., 'super_admin' or 'member')
                setRole(data.roles?.role_name || (data.role_id === 1 ? 'super_admin' : 'member'));
            }
        } catch (err) {
            console.error('Error fetching user profile:', err.message);
        }
    };

    // Sign Out Function
    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setRole(null);
    };

    const value = {
        user,
        profile,
        role,
        loading,
        logout,
        isAdmin: role === 'super_admin' || profile?.role_id === 1 || user?.email === 'amnijam60@gmail.com',
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom Hook to use AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};