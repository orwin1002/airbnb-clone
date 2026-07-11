"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import HostReply from "@/components/HostReply";
import ReviewEngagement from "@/components/ReviewEngagement";
import { sortReviewsForDisplay } from "@/lib/reviews";
import type { Review } from "@/lib/types";

interface Props {
  reviews: Review[];
  avgRating?: number | null;
  reviewCount: number;
  highlightReviewId?: number | null;
  currentUserId?: number | null;
  onReviewUpdate?: (review: Review) => void;
  onReviewDelete?: (reviewId: number) => void;
  onReviewEdit?: (review: Review) => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < rating ? "fill-foreground" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection({
  reviews,
  avgRating,
  reviewCount,
  highlightReviewId = null,
  currentUserId = null,
  onReviewUpdate,
  onReviewDelete,
  onReviewEdit,
}: Props) {
  const sortedReviews = sortReviewsForDisplay(reviews);

  useEffect(() => {
    if (highlightReviewId == null || sortedReviews.length === 0) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`review-${highlightReviewId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [highlightReviewId, sortedReviews]);

  const handleUpdate = (updated: Review) => {
    onReviewUpdate?.(updated);
  };

  return (
    <div id="reviews" className="scroll-mt-24 border-t border-border/80 pt-10">
      <div className="mb-8 flex flex-wrap items-center gap-6">
        {reviewCount > 0 && avgRating != null ? (
          <div className="flex items-center gap-3">
            <span className="text-[48px] font-semibold leading-none">{avgRating.toFixed(1)}</span>
            <div>
              <Stars rating={Math.round(avgRating)} size="lg" />
              <p className="mt-1 text-sm text-muted-foreground">{reviewCount} reviews</p>
            </div>
          </div>
        ) : (
          <h3 className="text-[22px] font-semibold">Reviews</h3>
        )}
      </div>

      {sortedReviews.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/30 px-6 py-10 text-center text-muted-foreground">
          No reviews yet. Be the first to stay and review!
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {sortedReviews.map((r) => {
            const highlighted = highlightReviewId === r.id;
            const hostReply = r.host_reply?.trim();
            return (
              <article
                key={r.id}
                id={`review-${r.id}`}
                className={`scroll-mt-28 rounded-2xl border bg-card p-5 shadow-sm ${
                  highlighted ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {initials(r.guest_name)}
                  </div>
                  <div>
                    <p className="font-semibold">{r.guest_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Stars rating={r.rating} />
                <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{r.comment}</p>
                {hostReply ? <HostReply reply={hostReply} replyAt={r.host_reply_at} className="mt-4" /> : null}
                <ReviewEngagement
                  review={r}
                  canEditReview={currentUserId != null && r.guest_id === currentUserId}
                  onUpdate={(updated) => handleUpdate(updated as Review)}
                  onDelete={onReviewDelete}
                  onEdit={onReviewEdit}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
