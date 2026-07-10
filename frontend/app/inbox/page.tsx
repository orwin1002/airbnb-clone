"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Conversation } from "@/lib/types";
import { useToast } from "@/lib/toast";

export default function InboxPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .getConversations()
      .then(setConversations)
      .catch(() => showToast("Failed to load inbox", "error"))
      .finally(() => setLoading(false));
  }, [user, showToast]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="mt-2 text-muted-foreground">Log in to view your messages.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-10">
      <h1 className="mb-6 text-[28px] font-semibold tracking-tight md:mb-8 md:text-[32px]">Inbox</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No messages yet.</p>
          <Link href="/" className="mt-4 inline-block font-medium text-primary underline">
            Explore stays
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/inbox/${c.id}`}
              className="card-hover flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                <SafeImage src={c.listing_photo} alt="" fill className="object-cover" sizes="56px" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{c.other_user_name}</p>
                  {c.unread_count > 0 && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">{c.listing_title}</p>
                {c.last_message && (
                  <p className="mt-0.5 truncate text-sm">{c.last_message}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
