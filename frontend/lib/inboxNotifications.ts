import { api } from "@/lib/api";
import type { Conversation } from "@/lib/types";

function notifyKey(userId: number, convId: number) {
  return `msg_notify_${userId}_${convId}`;
}

function messageFingerprint(c: Conversation): string {
  return `${c.last_message_at}|${c.last_message ?? ""}`;
}

export function messageDedupeKey(userId: number, convId: number, fingerprint: string) {
  return `message:${userId}:${convId}:${fingerprint}`;
}

export function messageDedupePrefix(userId: number, convId: number) {
  return `message:${userId}:${convId}:`;
}

type AddNotification = (
  title: string,
  body: string,
  type?: "message",
  options?: { toast?: boolean; userId?: number; eventAt?: string; dedupeKey?: string }
) => void;

type MarkReadByPrefix = (prefix: string) => void;

/** Sync inbox threads into the notification bell (no toast on login catch-up). */
export async function syncInboxMessageNotifications(
  userId: number,
  addNotification: AddNotification,
  markReadByDedupePrefix: MarkReadByPrefix,
  options?: { toastNewMessages?: boolean; openConvId?: number | null }
) {
  const toastNewMessages = options?.toastNewMessages ?? false;
  const openConvId = options?.openConvId ?? null;

  const convs = await api.getConversations();

  for (const c of convs) {
    if (!c.last_message) continue;

    const fingerprint = messageFingerprint(c);
    const prefix = messageDedupePrefix(userId, c.id);

    if (openConvId === c.id) {
      localStorage.setItem(notifyKey(userId, c.id), fingerprint);
      markReadByDedupePrefix(prefix);
      continue;
    }

    if (c.unread_count <= 0) {
      localStorage.setItem(notifyKey(userId, c.id), fingerprint);
      markReadByDedupePrefix(prefix);
      continue;
    }

    const prev = localStorage.getItem(notifyKey(userId, c.id));
    const fingerprintChanged = prev !== fingerprint;

    if (fingerprintChanged) {
      localStorage.setItem(notifyKey(userId, c.id), fingerprint);
    }

    addNotification(
      `New message from ${c.other_user_name}`,
      c.last_message.slice(0, 120),
      "message",
      {
        toast: toastNewMessages && fingerprintChanged,
        userId,
        eventAt: c.last_message_at,
        dedupeKey: messageDedupeKey(userId, c.id, fingerprint),
      }
    );
  }
}
