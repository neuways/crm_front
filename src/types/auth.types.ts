/**
 * Authentication and User Types matching backend source conventions
 * (server/src/types/auth.types.ts and models/user.model.ts)
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive?: boolean;
  mustChangePassword?: boolean;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: UserRole;
    mustChangePassword?: boolean;
  };
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearMustChangePassword: () => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}
