"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@/lib/types";
import { useToast } from "@/lib/toast";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { user } = useAuth();
  const prevUserIdRef = useRef<number | null>(null);
  const { showToast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const uid = user?.id;
    if (!uid) return;
    try {
      const [convs, msgs] = await Promise.all([
        api.getConversations(),
        api.getMessages(id),
      ]);
      if (user?.id !== uid) return;
      setConversation(convs.find((c) => c.id === id) ?? null);
      setMessages(msgs);
    } catch {
      showToast("Failed to load conversation", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !id) return;

    if (prevUserIdRef.current !== null && prevUserIdRef.current !== user.id) {
      router.replace("/inbox");
      return;
    }
    prevUserIdRef.current = user.id;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  useEffect(() => {
    if (!user || !id) return;
    const interval = setInterval(load, 5000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(id, body);
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Send failed", "error");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-muted-foreground">Log in to view messages.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border py-4">
        <Link href="/inbox" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-semibold">{conversation?.other_user_name ?? "Messages"}</p>
          <p className="truncate text-sm text-muted-foreground">
            {conversation?.listing_title ?? "..."}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Say hello to {conversation?.other_user_name} about this stay.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const isMine = m.sender_id === user.id;
              return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMine
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-foreground shadow-sm"
                  }`}
                >
                  {!isMine && (
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">{m.sender_name}</p>
                  )}
                  <p className="leading-relaxed">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? "text-white/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-border py-4">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </main>
  );
}
