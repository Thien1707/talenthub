"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  getStoredAccessToken,
  setAccessToken,
  type MeResponse,
} from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/client";

export type { AuthUser };

type AuthContextValue = {
  user: MeResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const { data } = await api.get<MeResponse>("/auth/me");
    setUser(data);
  }, []);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (token) setAccessToken(token);
    refreshMe()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
      "/auth/login",
      { email, password },
    );
    setAccessToken(data.accessToken);
    await refreshMe();
    return data.user;
  }, [refreshMe]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function dashboardPath(role: AuthUser["role"]) {
  switch (role) {
    case "STUDENT":
      return "/sinh-vien/ho-so";
    case "COMPANY":
      return "/cong-ty/tin-tuyen-dung";
    case "STAFF":
      return "/staff/tin-cho-duyet";
    case "SUPER_ADMIN":
      return "/staff/tin-cho-duyet";
    default:
      return "/";
  }
}
