"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

interface Props {
  reviews: Review[];
  avgRating?: number | null;
  reviewCount: number;
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

export default function ReviewsSection({ reviews, avgRating, reviewCount }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 6);

  return (
    <div className="border-t border-border/80 pt-10">
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
            {visible.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
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
              </article>
            ))}
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
