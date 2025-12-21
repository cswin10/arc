import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    session,
    isLoading,
    isInitialized,
    error,
    initialize,
    login,
    register,
    logout,
    sendPasswordReset,
    changePassword,
    updateSettings,
    removeAccount,
    refreshProfile,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const isAuthenticated = !!session && !!user;

  return {
    user,
    session,
    isLoading,
    isInitialized,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    sendPasswordReset,
    changePassword,
    updateSettings,
    removeAccount,
    refreshProfile,
    clearError,
  };
};
