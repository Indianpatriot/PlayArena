import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[PlayArena] Supabase not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY secrets.');
}

// During Expo static rendering (SSR), `window` is undefined in Node.js.
// Use AsyncStorage only when running in a real runtime (native or browser).
const isSSR = typeof window === 'undefined';
const webStorage = {
  getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Native → AsyncStorage, Web browser → AsyncStorage (works fine),
    // SSR/Node.js render → undefined (Supabase uses in-memory, session not needed)
    storage: isSSR ? undefined : Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: !isSSR,
    persistSession: !isSSR,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
