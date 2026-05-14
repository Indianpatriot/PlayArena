import { supabase } from './supabase';

export type UserRole = 'player' | 'owner';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  turfName?: string;
  location?: string;
}

function mapSupabaseUser(user: any, role?: UserRole): AuthUser {
  return {
    id: user.id,
    name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    role: role ?? user.user_metadata?.role ?? 'player',
    avatar: user.user_metadata?.avatar_url,
  };
}

function isCredentialError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('invalid login credentials') ||
    m.includes('invalid credentials') ||
    m.includes('user not found') ||
    m.includes('wrong password') ||
    m.includes('no user found')
  );
}

export const AuthService = {
  async login(creds: LoginCredentials, role: UserRole): Promise<AuthUser> {
    if (!creds.email.trim() || !creds.password) {
      throw new Error('Please enter your email and password.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: creds.email.trim().toLowerCase(),
      password: creds.password,
    });

    if (error) {
      const msg = error.message ?? '';
      if (isCredentialError(msg) || error.code === 'invalid_credentials') {
        const prefix = role === 'owner' ? 'Ground Owner account' : 'Account';
        throw Object.assign(
          new Error(`${prefix} not found. Please sign up first.`),
          { code: 'account_not_found' }
        );
      }
      if (msg.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please verify your email address before signing in. Check your inbox for a confirmation link.');
      }
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw new Error(msg || 'Login failed. Please try again.');
    }

    if (!data.user) {
      throw new Error('Login failed. Please try again.');
    }

    const userRole: UserRole = data.user.user_metadata?.role ?? 'player';

    if (userRole !== role) {
      await supabase.auth.signOut();
      if (role === 'owner') {
        throw Object.assign(
          new Error('Ground Owner account not found. Please sign up as an owner first.'),
          { code: 'account_not_found' }
        );
      }
      throw Object.assign(
        new Error('Account not found. Please sign up first.'),
        { code: 'account_not_found' }
      );
    }

    return mapSupabaseUser(data.user, userRole);
  },

  async signup(data: SignupData): Promise<AuthUser> {
    if (!data.email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          role: data.role,
          turf_name: data.turfName ?? null,
          location: data.location ?? null,
        },
      },
    });

    if (error) {
      const msg = error.message ?? '';
      if (
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('user already registered') ||
        msg.toLowerCase().includes('email already')
      ) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw new Error(msg || 'Signup failed. Please try again.');
    }

    if (!authData.user) {
      throw new Error('Signup failed. Please try again.');
    }

    if (!authData.session) {
      throw Object.assign(
        new Error('Account created! Please check your email to confirm your account before signing in.'),
        { code: 'confirm_email' }
      );
    }

    return mapSupabaseUser(authData.user, data.role);
  },

  async socialLogin(_provider: 'google' | 'apple'): Promise<AuthUser> {
    throw new Error('Social login is coming soon. Please sign in with your email and password.');
  },

  async forgotPassword(email: string): Promise<void> {
    if (!email.trim() || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) {
      throw new Error(error.message || 'Failed to send reset email. Please try again.');
    }
  },

  async verifyOTP(_email: string, otp: string): Promise<void> {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      throw new Error('Invalid OTP. Please check and try again.');
    }
    if (otp === '000000') {
      throw new Error('OTP has expired. Please request a new one.');
    }
  },

  async resetPassword(_email: string, _otp: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message || 'Failed to reset password. Please try again.');
    }
  },
};
