"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { api } from "@/lib/api";

interface Props {
  listingId: number;
  hostId: number;
  className?: string;
  variant?: "primary" | "outline";
}

export default function MessageHostButton({
  listingId,
  hostId,
  className = "",
  variant = "outline",
}: Props) {
  const { user, refreshSession } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  if (user && user.id === hostId) return null;

  const handleClick = async () => {
    if (!user) {
      showToast("Please log in to message the host", "error");
      return;
    }
    try {
      await refreshSession();
      const conv = await api.startConversation(listingId);
      router.push(`/inbox/${conv.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start conversation";
      if (msg.includes("Not authenticated") || msg.includes("User not found")) {
        showToast("Session expired — please log in again", "error");
      } else {
        showToast(msg, "error");
      }
    }
  };

  const styles =
    variant === "primary"
      ? "bg-foreground text-background hover:opacity-90"
      : "border border-border bg-card hover:bg-muted/50";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${styles} ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      Message host
    </button>
  );
}
