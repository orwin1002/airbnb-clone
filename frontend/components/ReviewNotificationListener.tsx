"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { syncReviewNotifications } from "@/lib/reviewNotifications";

/** Poll review activity and notify hosts/guests about new reviews, likes, replies, and edits. */
export default function ReviewNotificationListener() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const userId = user?.id ?? null;
  const addNotificationRef = useRef(addNotification);
  const sessionReadyRef = useRef(false);
  addNotificationRef.current = addNotification;

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
        await syncReviewNotifications(userId, addNotificationRef.current, {
          toastNew: !isLoginSync,
        });
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
  }, [userId]);

  return null;
}
