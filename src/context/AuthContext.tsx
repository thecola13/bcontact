import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../lib/profile.service';
import type { Profile } from '../types/database.types';

// ─── Context Shape ──────────────────────────────────────
interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    profile: Profile | null;
    profileLoading: boolean;
    isOnboarded: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const hasLoadedOnce = useRef(false);

    // Fetch profile from Supabase
    // Only shows loading state on the very first load to avoid unmounting children
    const loadProfile = useCallback(async (userId: string) => {
        if (!hasLoadedOnce.current) setProfileLoading(true);
        const data = await fetchProfile(userId);
        setProfile(data);
        setProfileLoading(false);
        hasLoadedOnce.current = true;
    }, []);

    // Public refresh method (called after onboarding completes)
    const refreshProfile = useCallback(async () => {
        if (user) {
            await loadProfile(user.id);
        }
    }, [user, loadProfile]);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (session?.user) {
                loadProfile(session.user.id);
            } else {
                setProfileLoading(false);
            }
        });

        // 2. Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Only reload profile on sign-in events, NOT on USER_UPDATED
            // (which fires after updateUser({ password }) and would remount the wizard)
            if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                loadProfile(session.user.id);
            } else if (!session) {
                setProfile(null);
                setProfileLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [loadProfile]);

    const isOnboarded = profile?.onboarding_completed ?? false;

    return (
        <AuthContext.Provider
            value={{ session, user, loading, profile, profileLoading, isOnboarded, refreshProfile }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// ─── Hook ───────────────────────────────────────────────
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};