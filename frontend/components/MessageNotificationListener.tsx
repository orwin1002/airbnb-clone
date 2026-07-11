"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useNotifications } from "@/lib/notifications";
import type { Conversation } from "@/lib/types";

function notifyKey(userId: number, convId: number) {
  return `msg_notify_${userId}_${convId}`;
}

function messageFingerprint(c: Conversation): string {
  return `${c.last_message_at}|${c.last_message ?? ""}`;
}

/** Poll inbox and notify the logged-in user when someone else sends them a message. */
export default function MessageNotificationListener() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const pathname = usePathname();
  const userId = user?.id ?? null;
  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const convs = await api.getConversations();
        if (cancelled) return;

        const openConvMatch = pathname.match(/^\/inbox\/(\d+)/);
        const openConvId = openConvMatch ? Number(openConvMatch[1]) : null;

        for (const c of convs) {
          if (!c.last_message) continue;

          const fingerprint = messageFingerprint(c);

          if (openConvId === c.id) {
            localStorage.setItem(notifyKey(userId, c.id), fingerprint);
            continue;
          }

          if (c.unread_count <= 0) {
            localStorage.setItem(notifyKey(userId, c.id), fingerprint);
            continue;
          }

          const prev = localStorage.getItem(notifyKey(userId, c.id));
          if (prev === fingerprint) continue;

          localStorage.setItem(notifyKey(userId, c.id), fingerprint);
          addNotificationRef.current(
            `New message from ${c.other_user_name}`,
            c.last_message.slice(0, 120),
            "message",
            { toast: true, userId }
          );
        }
      } catch {
        /* ignore poll errors */
      }
    };

    poll();
    const interval = setInterval(poll, 4000);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, pathname]);

  return null;
}
