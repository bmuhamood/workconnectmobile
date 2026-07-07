// hooks/useAuth.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications, unregisterPushToken } from '../lib/pushNotifications';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: 'employer' | 'worker' | 'admin' | 'super_admin';
  status: string;
  is_verified: boolean;
  is_blocked?: boolean;
  is_blacklisted?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data as unknown as AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const profile = await fetchProfile(data.session.user.id);
        setUser(profile);
        if (profile) registerForPushNotifications(profile.id).catch(() => {});
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(await fetchProfile(newSession.user.id));
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const profile = await fetchProfile(data.user.id);
    if (profile?.is_blacklisted) {
      await supabase.auth.signOut();
      throw new Error('This account has been permanently blacklisted. Contact bbosa2009@gmail.com.');
    }
    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      throw new Error('Your account has been suspended. Contact bbosa2009@gmail.com.');
    }
    setUser(profile);
    if (profile) {
      registerForPushNotifications(profile.id).catch(() => {});
    }
  };

  const logout = async () => {
    await unregisterPushToken();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    setUser(await fetchProfile(session.user.id));
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
