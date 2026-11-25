/**
 * Nueways CRM - Authentication Context & Provider
 * 
 * Provides centralized session state, login/logout operations,
 * token persistence, and explicit demonstration mode toggles.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, LoginCredentials, AuthContextType } from '../types/auth.types.js';
import { authService } from '../services/auth.service.js';
import { api } from '../services/api.js';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'nueways_auth_token';
const USER_KEY = 'nueways_user';
const DEMO_MODE_KEY = 'nueways_demo_mode';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return sessionStorage.getItem(DEMO_MODE_KEY) === 'true';
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Centralized logout: Clears client-side session and invalidates server-side cookie
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(DEMO_MODE_KEY);
    api.setToken(null);
    setToken(null);
    setUser(null);
    setIsDemoMode(false);

    // Concurrently trigger backend logout to clear the HttpOnly session cookie
    authService.logout().catch((err) => {
      console.error('Logout error clearing session cookie on server:', err);
    });
  }, []);

  // Restore session on application startup via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      // If user is currently in demo mode, preserve demo context
      if (sessionStorage.getItem(DEMO_MODE_KEY) === 'true') {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await authService.getMe();
        if (!isMounted) return;

        if (res.success && res.data?.user) {
          const restoredUser: UserProfile = {
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
            role: res.data.user.role,
            isActive: res.data.user.isActive ?? true,
            mustChangePassword: Boolean(res.data.user.mustChangePassword),
            avatarUrl: res.data.user.avatarUrl,
          };

          setUser(restoredUser);
          localStorage.setItem(USER_KEY, JSON.stringify(restoredUser));
          // Proactively remove any legacy long-lived token from localStorage
          localStorage.removeItem(TOKEN_KEY);
        } else {
          // No valid session cookie found or session expired
          setUser(null);
          setToken(null);
          api.setToken(null);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        if (!isMounted) return;
        setUser(null);
        setToken(null);
        api.setToken(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to 401 Unauthorized interceptor from API client
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      // Clear invalid or expired session automatically
      logout();
    });
  }, [logout]);

  // Listen to 403 PasswordChangeRequired interceptor: Enforce tamper-proof security state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePasswordChangeRequired = () => {
      setUser((prev) => {
        if (!prev || prev.mustChangePassword) return prev;
        const updated = { ...prev, mustChangePassword: true };
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('nueways:password-change-required', handlePasswordChangeRequired);
    return () => window.removeEventListener('nueways:password-change-required', handlePasswordChangeRequired);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);

      if (!res.success || !res.data) {
        return {
          success: false,
          error: res.message || res.error || 'Invalid credentials or server error.'
        };
      }

      const receivedToken = res.data.token;
      const receivedUser: UserProfile = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
        isActive: true,
        mustChangePassword: Boolean(res.data.user.mustChangePassword),
      };

      // Do not store sensitive JWT in localStorage; session is securely persisted in HttpOnly cookie
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
      sessionStorage.removeItem(DEMO_MODE_KEY);

      api.setToken(receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setIsDemoMode(false);

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during login.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await authService.loginWithGoogle(idToken);

      if (!res.success || !res.data) {
        return {
          success: false,
          error: res.message || res.error || 'Google authentication failed.'
        };
      }

      const receivedToken = res.data.token;
      const receivedUser: UserProfile = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
        isActive: true,
        mustChangePassword: Boolean(res.data.user.mustChangePassword),
      };

      // Do not store sensitive JWT in localStorage; session is securely persisted in HttpOnly cookie
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
      sessionStorage.removeItem(DEMO_MODE_KEY);

      api.setToken(receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setIsDemoMode(false);

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during Google authentication.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const clearMustChangePassword = useCallback(() => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, mustChangePassword: false };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const enterDemoMode = () => {
    sessionStorage.setItem(DEMO_MODE_KEY, 'true');
    setIsDemoMode(true);
    // Neutral demo user representation
    setUser({
      id: 'demo-agent',
      name: 'Demo Sales Agent',
      email: 'sales.agent@nueways.local',
      role: 'SALES',
      isActive: true,
    });
  };

  const exitDemoMode = () => {
    sessionStorage.removeItem(DEMO_MODE_KEY);
    setIsDemoMode(false);
    setUser(null);
    setToken(null);
    api.setToken(null);
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isDemoMode,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        clearMustChangePassword,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
