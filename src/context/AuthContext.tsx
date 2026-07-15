import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, syncClientAccessForUser } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
      }

      let profileData = data as Profile | null;

      if (profileData) {
        try {
          const { data: clientAccess } = await supabase
            .from('client_access')
            .select('hwid')
            .eq('user_id', userId)
            .maybeSingle();

          const resolvedHwid = profileData.hwid || clientAccess?.hwid || null;

          if (resolvedHwid && !profileData.hwid) {
            await supabase
              .from('profiles')
              .update({ hwid: resolvedHwid })
              .eq('id', userId);
            profileData = { ...profileData, hwid: resolvedHwid };
          }

          const { data: subData } = await supabase
            .from('subscriptions')
            .select('status,end_date')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const isActive = subData?.status === 'active' && new Date(subData.end_date) > new Date();
          await syncClientAccessForUser({
            userId,
            email: profileData.email,
            username: profileData.username,
            hwid: resolvedHwid,
            role: profileData.is_admin ? 'Admin' : 'User',
            subscriptionActive: Boolean(isActive),
            subscriptionEndDate: subData?.end_date ?? null,
          });
        } catch (syncErr) {
          console.error('syncClientAccess error:', syncErr);
        }
      }

      setProfile(profileData);
    } catch (err) {
      console.error('fetchProfile error:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    let email = emailOrUsername.trim();

    if (!email.includes('@')) {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', email)
        .maybeSingle();
      if (data?.email) {
        email = data.email;
      } else {
        return { error: 'Foydalanuvchi topilmadi' };
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
