import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth.api";
import { clearSession, getStoredToken, getStoredUser, setUnauthorizedHandler, storeSession } from "../api/httpClient";
import type { AuthUser } from "../types/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getStoredToken() ? getStoredUser<AuthUser>() : null));

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  useEffect(() => {
    // The backend has no token-refresh/"me" endpoint, so an expired or
    // revoked token is only discovered when the next request comes back 401.
    // When that happens anywhere in the app, drop the local session.
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    storeSession(result.token, result.user);
    setUser(result.user);
  }, []);

  // The register endpoint already returns a full token+user payload (same
  // shape as login), so a successful sign-up logs the user in immediately
  // rather than sending them back through a second login round-trip.
  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authApi.register({ name, email, password });
    storeSession(result.token, result.user);
    setUser(result.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
