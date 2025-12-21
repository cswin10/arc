import { supabase } from './supabase';
import type { User, UserSettings } from '../types/database';

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Sign up with email and password
export const signUp = async ({ email, password }: SignUpData): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Create user profile in users table
      const defaultSettings: UserSettings = {
        dark_mode: false,
        notification_preferences: {
          daily_reminder: true,
          daily_reminder_time: '09:00',
          weekly_planning_reminder: true,
          monthly_planning_reminder: true,
        },
      };

      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email || email,
        settings: defaultSettings,
      });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't fail the signup if profile creation fails
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Sign in with email and password
export const signIn = async ({ email, password }: SignInData): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Sign out
export const signOut = async (): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'arc://reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Update password
export const updatePassword = async (newPassword: string): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Get current user profile
export const getUserProfile = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;

    return data;
  } catch (err) {
    return null;
  }
};

// Update user settings
export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<AuthResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current settings
    const { data: profile } = await supabase
      .from('users')
      .select('settings')
      .eq('id', user.id)
      .single();

    const currentSettings = profile?.settings || {};
    const mergedSettings = { ...currentSettings, ...settings };

    const { error } = await supabase
      .from('users')
      .update({ settings: mergedSettings })
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Delete user account
export const deleteAccount = async (): Promise<AuthResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Delete all user data (cascade should handle related tables)
    await supabase.from('habits').delete().eq('user_id', user.id);
    await supabase.from('habit_logs').delete().eq('user_id', user.id);
    await supabase.from('weekly_targets').delete().eq('user_id', user.id);
    await supabase.from('streak_freezes').delete().eq('user_id', user.id);
    await supabase.from('daily_tasks').delete().eq('user_id', user.id);
    await supabase.from('weekly_goals').delete().eq('user_id', user.id);
    await supabase.from('monthly_goals').delete().eq('user_id', user.id);
    await supabase.from('yearly_goals').delete().eq('user_id', user.id);
    await supabase.from('users').delete().eq('id', user.id);

    // Sign out after deleting data
    await supabase.auth.signOut();

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};
