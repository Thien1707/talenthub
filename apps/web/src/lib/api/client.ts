import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) sessionStorage.setItem("talenthub_access", token);
    else sessionStorage.removeItem("talenthub_access");
  }
}

export function getStoredAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("talenthub_access");
  }
  return null;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ accessToken: string }>("/auth/refresh")
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/login") &&
      !original.url?.includes("/auth/refresh")
    ) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "COMPANY" | "STAFF" | "SUPER_ADMIN";
};

export type MeResponse = AuthUser & {
  phone?: string | null;
  emailVerifiedAt?: string | null;
  status: string;
  studentProfile?: Record<string, unknown> | null;
  companyProfile?: Record<string, unknown> | null;
};
