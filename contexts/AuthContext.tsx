import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          setUserState(JSON.parse(stored));
        }
      } catch {
        // Ignore storage errors — treat as unauthenticated
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setUser = async (u: AuthUser | null) => {
    setUserState(u);
    try {
      if (u) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u));
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Non-critical — session won't persist but auth state is in memory
    }
  };

  const logout = async () => {
    await setUser(null);
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
