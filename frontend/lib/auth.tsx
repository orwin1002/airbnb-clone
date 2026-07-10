"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; is_host: boolean }) => Promise<void>;
  demoLogin: (email: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const DEMO_GUESTS = [
  { email: "alex@example.com", label: "Alex (Guest)" },
  { email: "emma@example.com", label: "Emma (Guest)" },
  { email: "liam@example.com", label: "Liam (Guest)" },
  { email: "noah@example.com", label: "Noah (Guest)" },
  { email: "olivia@example.com", label: "Olivia (Guest)" },
];

export const DEMO_HOSTS = [
  { email: "priya@example.com", label: "Priya (Host)" },
  { email: "sarah@example.com", label: "Sarah (Host)" },
  { email: "marcus@example.com", label: "Marcus (Host)" },
  { email: "james@example.com", label: "James (Host)" },
  { email: "david@example.com", label: "David (Host)" },
];

export const DEMO_USERS = [...DEMO_GUESTS, ...DEMO_HOSTS];

function persistUser(u: User) {
  localStorage.setItem("user", JSON.stringify(u));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const u = await api.me();
      persistUser(u);
      setUser(u);
    } catch {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        refreshSession().finally(() => setLoading(false));
        return;
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const u = await api.login(email, password);
    persistUser(u);
    setUser(u);
  };

  const register = async (data: { name: string; email: string; password: string; is_host: boolean }) => {
    const u = await api.register(data);
    persistUser(u);
    setUser(u);
  };

  const demoLogin = async (email: string) => {
    const u = await api.demoLogin(email);
    persistUser(u);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demoLogin, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
