import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getProfile, getAvatarBlob } from '../lib/api';

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  avatarUrl: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndAvatar = async (userId) => {
    try {
      const profileData = await getProfile();
      setProfile(profileData);

      // If they have an avatar, load it as a secure blob URL
      if (profileData.avatar_url) {
        const blob = await getAvatarBlob();
        const blobUrl = URL.createObjectURL(blob);
        setAvatarUrl(blobUrl);
      } else {
        setAvatarUrl(null);
      }
    } catch (err) {
      console.error('Failed to load user profile or avatar:', err);
    }
  };

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileAndAvatar(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileAndAvatar(session.user.id);
      } else {
        setProfile(null);
        setAvatarUrl(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setProfile(null);
    setAvatarUrl(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndAvatar(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        avatarUrl,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
