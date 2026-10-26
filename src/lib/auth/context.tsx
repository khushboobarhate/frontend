"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LoginCredentials, UserProfile, UserRole } from "@/types";
import { signIn } from "@/lib/api/client";
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionError: string;
  login: (
    role: UserRole,
    credentials: LoginCredentials,
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
const Context = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const refreshProfile = useCallback(async () => {
    setSessionError("");
    const response = await fetch("/api/session", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setSessionError(data.message);
      throw new Error(data.message);
    }
    setUser(data.user);
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!active) return;
        if (response.ok) setUser(data.user);
        else setSessionError(data.message);
      })
      .catch(() => {
        if (active)
          setSessionError("Please check your connection and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => {
      setUser(null);
      setSessionError("Your session has ended. Please sign in again.");
    };
    window.addEventListener("sm:session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("sm:session-expired", expired);
    };
  }, []);
  const login = useCallback(
    async (role: UserRole, credentials: LoginCredentials) => {
      const response = await signIn(role, credentials);
      const identity = response.data.admin || response.data.user;
      if (!identity)
        throw new Error("We couldn’t load your account. Please try again.");
      let profile = {
        ...identity,
        must_change_password: response.data.must_change_password,
      };
      // Restore the complete profile; sign-in returns only an identity summary.
      try {
        const session = await fetch("/api/session", { cache: "no-store" });
        const data = await session.json();
        if (session.ok && data.user) profile = data.user;
      } catch {
        /* The identity can still open the account; restoration can be retried. */
      }
      setUser(profile);
      setSessionError("");
      return profile;
    },
    [],
  );
  const logout = useCallback(async () => {
    const response = await fetch("/api/session", { method: "DELETE" });
    if (!response.ok) throw new Error("Could not sign out. Please try again.");
    setUser(null);
  }, []);
  return (
    <Context.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionError,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}
