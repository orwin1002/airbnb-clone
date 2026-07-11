"use client";

import { useState } from "react";
import { Heart, MessageSquareReply } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { formatMessageTimestamp } from "@/lib/dates";
import { useToast } from "@/lib/toast";
import { markReviewSyncState } from "@/lib/reviewNotifications";
import type { HostReview, Review } from "@/lib/types";

interface Props {
  review: Review;
  canReply?: boolean;
  onUpdate: (review: Review | HostReview) => void;
}

export default function ReviewEngagement({ review, canReply = false, onUpdate }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [liking, setLiking] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.host_reply ?? "");
  const [replying, setReplying] = useState(false);

  const handleLike = async () => {
    if (!user) {
      showToast("Log in to like reviews", "error");
      return;
    }
    setLiking(true);
    try {
      const updated = await api.toggleReviewLike(review.id);
      const merged = { ...review, ...updated };
      markReviewSyncState(user.id, review.id, {
        like_count: merged.like_count,
        host_reply_at: merged.host_reply_at ?? null,
        created_at: merged.created_at,
      });
      onUpdate(merged);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update like", "error");
    } finally {
      setLiking(false);
    }
  };

  const handleReply = async () => {
    const body = replyText.trim();
    if (!body) {
      showToast("Write a reply first", "error");
      return;
    }
    setReplying(true);
    try {
      const updated = await api.replyToReview(review.id, body);
      if (user) {
        markReviewSyncState(user.id, review.id, {
          like_count: updated.like_count,
          host_reply_at: updated.host_reply_at ?? null,
          created_at: updated.created_at,
        });
      }
      onUpdate(updated);
      setReplyOpen(false);
      showToast("Reply posted", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not post reply", "error");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={liking}
          onClick={handleLike}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            review.liked_by_me
              ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
              : "border-border hover:bg-muted/50"
          }`}
        >
          <Heart className={`h-4 w-4 ${review.liked_by_me ? "fill-current" : ""}`} />
          {review.like_count > 0 ? review.like_count : "Like"}
        </button>

        {canReply && (
          <button
            type="button"
            onClick={() => {
              setReplyText(review.host_reply ?? "");
              setReplyOpen((open) => !open);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted/50"
          >
            <MessageSquareReply className="h-4 w-4" />
            {review.host_reply ? "Edit reply" : "Reply"}
          </button>
        )}
      </div>

      {canReply && review.host_reply && (
        <div className="rounded-xl bg-muted/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your response</p>
          <p className="mt-1 text-sm leading-relaxed">{review.host_reply}</p>
          {review.host_reply_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatMessageTimestamp(review.host_reply_at)}
            </p>
          )}
        </div>
      )}

      {canReply && replyOpen && (
        <div className="space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Thank your guest or address their feedback..."
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={replying}
              onClick={handleReply}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {replying ? "Posting..." : review.host_reply ? "Update reply" : "Post reply"}
            </button>
            <button
              type="button"
              disabled={replying}
              onClick={() => setReplyOpen(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
