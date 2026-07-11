"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import ReviewEngagement from "@/components/ReviewEngagement";
import { formatMessageTimestamp } from "@/lib/dates";
import type { Review } from "@/lib/types";

interface Props {
  reviews: Review[];
  avgRating?: number | null;
  reviewCount: number;
  highlightReviewId?: number | null;
  onReviewUpdate?: (review: Review) => void;
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

function HostReply({ reply, replyAt }: { reply: string; replyAt?: string | null }) {
  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Host response</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">{reply}</p>
      {replyAt && (
        <p className="mt-2 text-xs text-muted-foreground">{formatMessageTimestamp(replyAt)}</p>
      )}
    </div>
  );
}

export default function ReviewsSection({
  reviews,
  avgRating,
  reviewCount,
  highlightReviewId = null,
  onReviewUpdate,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (highlightReviewId == null) return;
    const idx = reviews.findIndex((r) => r.id === highlightReviewId);
    if (idx >= 6) setShowAll(true);
  }, [highlightReviewId, reviews]);

  useEffect(() => {
    if (highlightReviewId == null || reviews.length === 0) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`review-${highlightReviewId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [highlightReviewId, reviews, showAll]);

  const visible = showAll ? reviews : reviews.slice(0, 6);

  const handleUpdate = (updated: Review) => {
    onReviewUpdate?.(updated);
  };

  return (
    <div id="reviews" className="scroll-mt-24 border-t border-border/80 pt-10">
      <div className="mb-8 flex flex-wrap items-center gap-6">
        {reviewCount > 0 && avgRating != null ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-[48px] font-semibold leading-none">{avgRating.toFixed(1)}</span>
              <div>
                <Stars rating={Math.round(avgRating)} size="lg" />
                <p className="mt-1 text-sm text-muted-foreground">{reviewCount} reviews</p>
              </div>
            </div>
          </>
        ) : (
          <h3 className="text-[22px] font-semibold">Reviews</h3>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/30 px-6 py-10 text-center text-muted-foreground">
          No reviews yet. Be the first to stay and review!
        </p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            {visible.map((r) => {
              const highlighted = highlightReviewId === r.id;
              return (
                <article
                  key={r.id}
                  id={`review-${r.id}`}
                  className={`scroll-mt-28 rounded-2xl border bg-card p-5 shadow-sm ${
                    highlighted
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border"
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
                  {r.host_reply && (
                    <HostReply reply={r.host_reply} replyAt={r.host_reply_at} />
                  )}
                  <ReviewEngagement
                    review={r}
                    onUpdate={(updated) => handleUpdate(updated as Review)}
                  />
                </article>
              );
            })}
          </div>
          {reviews.length > 6 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-6 rounded-xl border border-foreground px-5 py-2.5 text-sm font-semibold hover:bg-muted/50"
            >
              Show all {reviews.length} reviews
            </button>
          )}
        </>
      )}
    </div>
  );
}
