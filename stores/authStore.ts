import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { signIn, signUp, signOut, resetPassword, updatePassword, getUserProfile, updateUserSettings, deleteAccount } from '../lib/auth';
import type { User, UserSettings } from '../types/database';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>;
  removeAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const profile = await getUserProfile();
        set({ session, user: profile, isInitialized: true, isLoading: false });
      } else {
        set({ session: null, user: null, isInitialized: true, isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session) {
          const profile = await getUserProfile();
          set({ session, user: profile });
        } else if (event === 'SIGNED_OUT') {
          set({ session: null, user: null });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          set({ session });
        }
      });
    } catch (error) {
      set({ isLoading: false, isInitialized: true, error: 'Failed to initialize auth' });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const result = await signIn({ email, password });

    if (result.success) {
      const profile = await getUserProfile();
      set({ user: profile, isLoading: false });
    } else {
      set({ isLoading: false, error: result.error });
    }

    return result;
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const result = await signUp({ email, password });

    if (result.success) {
      // Note: User might need to verify email depending on Supabase settings
      set({ isLoading: false });
    } else {
      set({ isLoading: false, error: result.error });
    }

    return result;
  },

  logout: async () => {
    set({ isLoading: true });
    await signOut();
    set({ user: null, session: null, isLoading: false });
  },

  sendPasswordReset: async (email: string) => {
    set({ isLoading: true, error: null });
    const result = await resetPassword(email);
    set({ isLoading: false, error: result.error || null });
    return result;
  },

  changePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });
    const result = await updatePassword(newPassword);
    set({ isLoading: false, error: result.error || null });
    return result;
  },

  updateSettings: async (settings: Partial<UserSettings>) => {
    set({ isLoading: true, error: null });
    const result = await updateUserSettings(settings);

    if (result.success) {
      const profile = await getUserProfile();
      set({ user: profile, isLoading: false });
    } else {
      set({ isLoading: false, error: result.error });
    }

    return result;
  },

  removeAccount: async () => {
    set({ isLoading: true, error: null });
    const result = await deleteAccount();

    if (result.success) {
      set({ user: null, session: null, isLoading: false });
    } else {
      set({ isLoading: false, error: result.error });
    }

    return result;
  },

  refreshProfile: async () => {
    const profile = await getUserProfile();
    if (profile) {
      set({ user: profile });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
