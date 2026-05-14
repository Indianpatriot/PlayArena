import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseAnonKey?: string };

const supabaseUrl: string = extra.supabaseUrl ?? '';
const supabaseAnonKey: string = extra.supabaseAnonKey ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[PlayArena] Supabase not configured. Check SUPABASE_URL and SUPABASE_ANON_KEY secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
