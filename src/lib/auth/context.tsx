'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AuthSession, UserProfile, UserRole } from '@/types';
import {
  adminLogin,
  buyerLogin,
  farmerLogin,
  getAdminProfile,
  getBuyerProfile,
  getFarmerProfile,
  ApiRequestError,
} from '@/lib/api/client';

const USER_STORAGE_KEY = 'sm_user';

function setTokenCookie(token: string) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  document.cookie = `sm_token=${encodeURIComponent(token)}; path=/; SameSite=Strict${secure ? '; Secure' : ''}; max-age=86400`;
}

function clearSession() {
  document.cookie = 'sm_token=; path=/; max-age=0';
  try {
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Could not clear the saved session:', error);
  }
}

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)sm_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getUserFromStorage(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch (error) {
    console.error('Could not read the saved session:', error);
    return null;
  }
}

function saveUserToStorage(user: UserProfile) {
  try {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Could not save the authenticated profile:', error);
  }
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    role: UserRole,
    credentials: { login_id?: string; email?: string; password: string }
  ) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(role: UserRole) {
  if (role === 'admin') return getAdminProfile();
  if (role === 'farmer') return getFarmerProfile();
  return getBuyerProfile();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getTokenFromCookie();
    const storedUser = getUserFromStorage();
    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    void fetchProfile(storedUser.role)
      .then(({ profile }) => {
        setUser(profile);
        saveUserToStorage(profile);
      })
      .catch((error: unknown) => {
        console.error('Could not restore the authenticated profile:', error);
        if (error instanceof ApiRequestError && [401, 403].includes(error.status)) {
          clearSession();
          setToken(null);
          setUser(null);
        } else {
          setUser(storedUser);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (
    role: UserRole,
    credentials: { login_id?: string; email?: string; password: string }
  ) => {
    let session: AuthSession;
    switch (role) {
      case 'farmer':
        session = await farmerLogin(credentials);
        break;
      case 'buyer':
        session = await buyerLogin(credentials);
        break;
      case 'admin':
        session = await adminLogin(credentials);
        break;
      default:
        throw new Error(`Unknown role: ${role}`);
    }

    setTokenCookie(session.access_token);
    saveUserToStorage(session.profile);
    setToken(session.access_token);
    setUser(session.profile);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user || !token) return;
    try {
      const { profile } = await fetchProfile(user.role);
      setUser(profile);
      saveUserToStorage(profile);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        logout();
      }
      throw error;
    }
  }, [user, token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
