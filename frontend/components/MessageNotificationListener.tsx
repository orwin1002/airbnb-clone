"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { syncInboxMessageNotifications } from "@/lib/inboxNotifications";

/** Poll inbox and notify the logged-in user when someone else sends them a message. */
export default function MessageNotificationListener() {
  const { user } = useAuth();
  const { addNotification, markReadByDedupePrefix } = useNotifications();
  const pathname = usePathname();
  const userId = user?.id ?? null;
  const addNotificationRef = useRef(addNotification);
  const markReadByPrefixRef = useRef(markReadByDedupePrefix);
  const sessionReadyRef = useRef(false);
  addNotificationRef.current = addNotification;
  markReadByPrefixRef.current = markReadByDedupePrefix;

  useEffect(() => {
    sessionReadyRef.current = false;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        if (cancelled) return;

        const isLoginSync = !sessionReadyRef.current;
        const openConvMatch = pathname.match(/^\/inbox\/(\d+)/);
        const openConvId = openConvMatch ? Number(openConvMatch[1]) : null;

        await syncInboxMessageNotifications(
          userId,
          addNotificationRef.current,
          markReadByPrefixRef.current,
          { toastNewMessages: !isLoginSync, openConvId }
        );

        sessionReadyRef.current = true;
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
