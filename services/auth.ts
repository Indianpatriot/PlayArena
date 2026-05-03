// Mock Auth Service — PlayArena
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

// Simulate async delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const AuthService = {
  async login(creds: LoginCredentials, role: UserRole): Promise<AuthUser> {
    await delay(1500);

    if (!creds.email.includes('@') || creds.password.length < 6) {
      throw new Error('Invalid email or password. Please try again.');
    }

    return {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: role === 'player' ? 'Alex Johnson' : 'Stadium Pro',
      email: creds.email,
      role,
    };
  },

  async signup(data: SignupData): Promise<AuthUser> {
    await delay(2000);

    if (!data.email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    return {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      role: data.role,
    };
  },

  async socialLogin(provider: 'google' | 'apple'): Promise<AuthUser> {
    await delay(1200);
    return {
      id: 'usr_social_' + Math.random().toString(36).substr(2, 6),
      name: provider === 'google' ? 'Google User' : 'Apple User',
      email: `user@${provider}.com`,
      role: 'player',
    };
  },

  async forgotPassword(email: string): Promise<void> {
    await delay(1000);
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    // Mock: OTP sent to email
  },

  async verifyOTP(email: string, otp: string): Promise<void> {
    await delay(1000);
    // Mock: accept any 6-digit code for demo
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      throw new Error('Invalid OTP. Please check and try again.');
    }
    // Demo: reject 000000 as invalid
    if (otp === '000000') {
      throw new Error('OTP has expired. Please request a new one.');
    }
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await delay(1200);
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
    // Mock: password reset successful
  },
};
