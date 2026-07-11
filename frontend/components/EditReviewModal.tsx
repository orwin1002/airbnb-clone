"use client";

import { useEffect, useState } from "react";
import { X, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { markReviewSyncState } from "@/lib/reviewNotifications";
import { useToast } from "@/lib/toast";
import type { GuestReview, Review } from "@/lib/types";

interface Props {
  open: boolean;
  listingTitle: string;
  reviewId: number;
  initialRating: number;
  initialComment: string;
  onClose: () => void;
  onUpdated: (review: Review | GuestReview) => void;
}

export default function EditReviewModal({
  open,
  listingTitle,
  reviewId,
  initialRating,
  initialComment,
  onClose,
  onUpdated,
}: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [open, initialRating, initialComment]);

  if (!open) return null;

  const submit = async () => {
    if (!comment.trim()) {
      showToast("Please write a short comment", "error");
      return;
    }
    setLoading(true);
    try {
      const updated = await api.updateReview(reviewId, {
        rating,
        comment: comment.trim(),
      });
      if (user) {
        markReviewSyncState(user.id, reviewId, {
          like_count: updated.like_count,
          host_reply_at: updated.host_reply_at ?? null,
          created_at: updated.created_at,
          rating: updated.rating,
          comment: updated.comment,
        });
      }
      showToast("Review updated", "success");
      onUpdated(updated);
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update review", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit review</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{listingTitle}</p>
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star
                className={`h-7 w-7 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience..."
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
