// hooks/useAuth.ts
import { useEffect, useState, useRef } from "react";
import {
  supabase,
  getCurrentProfile,
  createProfileIfNotExists,
} from "../lib/supabaseClient";

import { Profile } from "../types";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  const loadProfile = async () => {
    if (loadingRef.current) {
      console.log("Profile loading already in progress, skipping...");
      return;
    }

    loadingRef.current = true;

    try {
      console.log("Loading profile...");
      const profileData = await createProfileIfNotExists();
      console.log("Profile data:", profileData);
      setProfile(profileData);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        console.log("Initial session:", session?.user?.email);
        setUser(session?.user || null);

        if (session?.user) {
          await loadProfile();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Init auth error:", err);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes with debounce to prevent multiple rapid updates
    let authListenerTimeout: NodeJS.Timeout;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      // Clear any pending updates
      if (authListenerTimeout) {
        clearTimeout(authListenerTimeout);
      }

      // Debounce the state change
      authListenerTimeout = setTimeout(async () => {
        setUser(session?.user || null);

        if (session?.user) {
          await loadProfile();
        } else {
          setProfile(null);
          setLoading(false);
        }
      }, 100);
    });

    return () => {
      if (authListenerTimeout) {
        clearTimeout(authListenerTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      console.log("Sign in successful:", data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { data: null, error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userType: string,
    fullName: string,
    phone?: string,
    address?: string,
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            phone: phone || null,
            address: address || null,
          },
        },
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      console.log("Sign up successful:", data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log("Sign out successful");
      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error };
    }
  };

  const updateProfile = async (updates: {
    full_name?: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { data: null, error };
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
};