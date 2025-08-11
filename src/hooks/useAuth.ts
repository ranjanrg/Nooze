import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AuthService, { AuthUser } from '../services/AuthService';
import CloudSyncService from '../services/CloudSyncService';

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false to make buttons clickable
  const [error, setError] = useState<string | null>(null);
  const authService = AuthService.getInstance();
  const cloudSyncService = CloudSyncService.getInstance();

  useEffect(() => {
    console.log('useAuth: Setting up auth state listener');
    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (authUser) => {
      console.log('useAuth: Auth state changed:', authUser ? 'User signed in' : 'No user');
      setUser(authUser);
      setIsLoading(false);

      if (authUser) {
        // User signed in, initialize cloud sync
        console.log('useAuth: User signed in, initializing cloud sync...');
        try {
          await cloudSyncService.initializeCloudSync();
          console.log('useAuth: Cloud sync initialized successfully for user:', authUser.uid);
        } catch (error) {
          console.error('useAuth: Failed to initialize cloud sync:', error);
          console.error('useAuth: Cloud sync error details:', JSON.stringify(error, null, 2));
          // Don't block the user, but show a warning
          Alert.alert(
            'Sync Warning',
            `Cloud sync could not be initialized: ${error.message}. Your data will be saved locally only.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // User signed out, cleanup cloud sync
        console.log('useAuth: User signed out, cleaning up cloud sync...');
        try {
          cloudSyncService.cleanup();
        } catch (error) {
          console.log('useAuth: Error cleaning up cloud sync:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAuthError = useCallback((error: any, defaultMessage: string) => {
    console.error('Auth error:', error);
    let errorMessage = defaultMessage;
    
    if (error?.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signInWithGoogle();
    } catch (error) {
      handleAuthError(error, 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [authService, handleAuthError]);

  const signInWithApple = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signInWithApple();
    } catch (error) {
      handleAuthError(error, 'Apple sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [authService, handleAuthError]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signInWithEmail(email, password);
    } catch (error) {
      handleAuthError(error, 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  }, [authService, handleAuthError]);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signUpWithEmail(email, password, displayName);
    } catch (error) {
      handleAuthError(error, 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [authService, handleAuthError]);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signOut();
    } catch (error) {
      handleAuthError(error, 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [authService, handleAuthError]);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    error,
    clearError,
  };
};
