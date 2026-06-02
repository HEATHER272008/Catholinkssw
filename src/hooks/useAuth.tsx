import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'student' | 'super_admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  profile: any;
  loading: boolean;
  profileChecked: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string) => {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Auth] fetchUserRole error:', error);
      setUserRole(null);
      return null;
    }

    const role = (data?.[0]?.role ?? null) as UserRole | null;
    setUserRole(role);
    return role;
  };

  const fetchProfile = async (userId: string): Promise<any | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Auth] fetchProfile error:', error);
      setProfile(null);
      return null;
    }

    const resolvedProfile = data?.[0] ?? null;
    setProfile(resolvedProfile);
    return resolvedProfile;
  };

  const provisionAccount = async (): Promise<boolean> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        console.warn('[Auth] No session available for provisioning');
        return false;
      }

      const { error } = await withTimeout(
        supabase.functions.invoke('provision-user', {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }),
        8000,
        'provision-user'
      );

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[Auth] provision-user failed:', err);
      return false;
    }
  };

  const loadUserData = async (userId: string) => {
    let role: UserRole | null = null;
    let prof: any | null = null;

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          [role, prof] = await Promise.all([
            withTimeout(fetchUserRole(userId), 12000, 'fetchUserRole'),
            withTimeout(fetchProfile(userId), 12000, 'fetchProfile'),
          ]);

          if (role && prof) {
            return;
          }

          const repaired = await provisionAccount();
          if (!repaired) break;
        } catch (err) {
          console.error(`[Auth] loadUserData attempt ${attempt + 1} failed:`, err);
          if (attempt === 1) break;
        }

        await wait(1000 * (attempt + 1));
      }

      if (!role || !prof) {
        console.warn('[Auth] User data still incomplete after retries');
      }
    } finally {
      setProfileChecked(true);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const handleSession = async (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setUserRole(null);
        setProfile(null);
        setProfileChecked(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setProfileChecked(false);
      await loadUserData(nextSession.user.id);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('[Auth] state change:', event);
      // Defer Supabase calls to avoid deadlock inside the auth callback
      setTimeout(() => { handleSession(nextSession); }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('[Auth] Session error:', error.message);
        setLoading(false);
        return;
      }

      await handleSession(session);
    });

    // Keep sessions alive: proactively refresh when tab becomes visible
    // or the device comes back online. Combined with autoRefreshToken on the
    // Supabase client, this ensures accounts effectively never expire while
    // the user keeps opening the app.
    const refreshSessionSafely = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await supabase.auth.refreshSession();
        }
      } catch (err) {
        console.warn('[Auth] Session refresh failed:', err);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshSessionSafely();
    };
    const handleOnline = () => refreshSessionSafely();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const signOut = async () => {
    sessionStorage.removeItem('catholink_notice_shown');

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setProfile(null);
    setProfileChecked(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, profile, loading, profileChecked, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
