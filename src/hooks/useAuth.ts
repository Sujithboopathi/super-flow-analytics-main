import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "employee" | "customer";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: AppRole;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) {
        console.warn("Error fetching profile:", error.message);
        return null;
      }
      
      if (data) {
        const profileData = data as any;
        return {
          id: profileData.id,
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone || null,
          role: (profileData.role as AppRole) || "customer"
        };
      }
      return null;
    } catch (err) {
      console.warn("Unexpected error fetching profile:", err);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
          setLoading(false);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then((userProfile) => {
          setProfile(userProfile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, asCustomer = false) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, signup_role: asCustomer ? "customer" : "employee" } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, profile, role: profile?.role ?? null, loading, signIn, signUp, signOut };
}
