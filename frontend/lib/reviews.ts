import type { Review } from "@/lib/types";

/** Reviews with host replies appear first, then newest first. */
export function sortReviewsForDisplay(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => {
    const aHasReply = Boolean(a.host_reply?.trim());
    const bHasReply = Boolean(b.host_reply?.trim());
    if (aHasReply !== bHasReply) return aHasReply ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function getVisibleReviews(
  reviews: Review[],
  showAll: boolean,
  highlightReviewId?: number | null
): Review[] {
  const sorted = sortReviewsForDisplay(reviews);
  if (showAll) return sorted;

  const visible = sorted.slice(0, 6);
  const ids = new Set(visible.map((r) => r.id));

  for (const review of sorted) {
    if (review.host_reply?.trim() && !ids.has(review.id)) {
      visible.push(review);
      ids.add(review.id);
    }
  }

  if (highlightReviewId != null) {
    const highlighted = sorted.find((r) => r.id === highlightReviewId);
    if (highlighted && !ids.has(highlighted.id)) {
      visible.push(highlighted);
    }
  }

  return sortReviewsForDisplay(visible);
}

export function hasHiddenHostReplies(reviews: Review[]): boolean {
  const sorted = sortReviewsForDisplay(reviews);
  return sorted.some((r, i) => Boolean(r.host_reply?.trim()) && i >= 6);
}
