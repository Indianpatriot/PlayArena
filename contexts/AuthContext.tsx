import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { AuthUser, UserRole } from '@/services/auth';

const SESSION_KEY = '@playarena_session';

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSessionUser(supabaseUser: any): AuthUser {
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name ?? supabaseUser.email?.split('@')[0] ?? 'User',
    email: supabaseUser.email ?? '',
    role: (supabaseUser.user_metadata?.role as UserRole) ?? 'player',
    avatar: supabaseUser.user_metadata?.avatar_url,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from Supabase on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserState(mapSessionUser(session.user));
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserState(mapSessionUser(session.user));
      } else {
        setUserState(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: user !== null,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
