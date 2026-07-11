"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "./auth";

export type NotificationType = "booking" | "message" | "system" | "verification" | "wishlist" | "review";

export interface AppNotification {
  id: string;
  userId: number;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  /** When the underlying event happened (e.g. message sent). Used for display time. */
  eventAt?: string;
  /** Prevents duplicate entries for the same underlying event. */
  dedupeKey?: string;
  /** In-app link when the notification is clicked. */
  href?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (
    title: string,
    body: string,
    type?: NotificationType,
    options?: { toast?: boolean; userId?: number; eventAt?: string; dedupeKey?: string; read?: boolean; href?: string }
  ) => void;
  markRead: (id: string) => void;
  markReadByDedupePrefix: (prefix: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);
const STORAGE_KEY = "app_notifications_by_user";

type NotificationStore = Record<string, AppNotification[]>;

/** Read the logged-in user id from localStorage (source of truth right after login). */
function getActiveUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) return (JSON.parse(raw) as { id: number }).id;
  } catch {
    /* ignore */
  }
  return null;
}

function readStore(): NotificationStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as NotificationStore;
  } catch {
    /* ignore */
  }
  return {};
}

function writeStore(store: NotificationStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [store, setStore] = useState<NotificationStore>({});

  useEffect(() => {
    setStore(readStore());
  }, [userId]);

  const notifications =
    userId != null
      ? (store[String(userId)] ?? []).filter((n) => n.userId === userId)
      : [];

  const updateForUser = useCallback(
    (uid: number, updater: (prev: AppNotification[]) => AppNotification[]) => {
      setStore((prev) => {
        const key = String(uid);
        const next = { ...prev, [key]: updater(prev[key] ?? []) };
        writeStore(next);
        return next;
      });
    },
    []
  );

  const addNotification = useCallback(
    (
      title: string,
      body: string,
      type: NotificationType = "system",
      options?: { toast?: boolean; userId?: number; eventAt?: string; dedupeKey?: string; read?: boolean; href?: string }
    ) => {
      const uid = options?.userId ?? getActiveUserId();
      if (uid == null) return;

      const existing = readStore()[String(uid)] ?? [];
      if (options?.dedupeKey && existing.some((n) => n.dedupeKey === options.dedupeKey)) {
        return;
      }

      if (options?.toast !== false) {
        toast(title, {
          description: body,
          action: options?.href
            ? {
                label: "View",
                onClick: () => {
                  window.location.href = options.href!;
                },
              }
            : undefined,
        });
      }

      const now = new Date().toISOString();
      const item: AppNotification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: uid,
        title,
        body,
        type,
        read: options?.read ?? false,
        createdAt: now,
        eventAt: options?.eventAt ?? now,
        dedupeKey: options?.dedupeKey,
        href: options?.href,
      };
      updateForUser(uid, (prev) => [item, ...prev.filter((n) => n.userId === uid)].slice(0, 50));
    },
    [updateForUser]
  );

  const markRead = useCallback(
    (id: string) => {
      if (userId == null) return;
      updateForUser(userId, (prev) =>
        prev.map((n) => (n.id === id && n.userId === userId ? { ...n, read: true } : n))
      );
    },
    [userId, updateForUser]
  );

  const markReadByDedupePrefix = useCallback(
    (prefix: string) => {
      if (userId == null) return;
      updateForUser(userId, (prev) =>
        prev.map((n) =>
          n.userId === userId && n.dedupeKey?.startsWith(prefix) ? { ...n, read: true } : n
        )
      );
    },
    [userId, updateForUser]
  );

  const markAllRead = useCallback(() => {
    if (userId == null) return;
    updateForUser(userId, (prev) =>
      prev.map((n) => (n.userId === userId ? { ...n, read: true } : n))
    );
  }, [userId, updateForUser]);

  const clearAll = useCallback(() => {
    if (userId == null) return;
    updateForUser(userId, (prev) => prev.filter((n) => n.userId !== userId));
  }, [userId, updateForUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markReadByDedupePrefix, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
