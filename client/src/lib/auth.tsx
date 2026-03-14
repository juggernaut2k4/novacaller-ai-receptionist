import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiRequest, setSessionToken, queryClient } from "./queryClient";
import type { Tenant, User } from "@shared/schema";

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; businessName: string; businessType: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [sessionToken, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const applyToken = useCallback((token: string | null) => {
    setToken(token);
    setSessionToken(token);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    applyToken(res.token);
    setUser(res.user);
    setTenant(res.tenant);
    queryClient.clear();
  }, [applyToken]);

  const signup = useCallback(async (data: { email: string; password: string; businessName: string; businessType: string; phone?: string }) => {
    const res = await apiRequest("POST", "/api/auth/signup", data);
    applyToken(res.token);
    setUser(res.user);
    setTenant(res.tenant);
    queryClient.clear();
  }, [applyToken]);

  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
      // ignore logout errors
    }
    applyToken(null);
    setUser(null);
    setTenant(null);
    queryClient.clear();
  }, [applyToken]);

  return (
    <AuthContext.Provider value={{ user, tenant, sessionToken, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
