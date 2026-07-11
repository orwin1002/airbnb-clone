import { api } from "@/lib/api";
import type { ReviewWatch } from "@/lib/types";

const SYNC_KEY = (userId: number) => `review_sync_${userId}`;
const LAST_SYNC_KEY = (userId: number) => `review_last_sync_${userId}`;

export interface ReviewSyncState {
  like_count: number;
  host_reply_at: string | null;
  created_at: string;
}

type ReviewSyncStore = Record<number, ReviewSyncState>;

function readSyncStore(userId: number): ReviewSyncStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SYNC_KEY(userId));
    if (raw) return JSON.parse(raw) as ReviewSyncStore;
  } catch {
    /* ignore */
  }
  return {};
}

function writeSyncStore(userId: number, store: ReviewSyncStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SYNC_KEY(userId), JSON.stringify(store));
}

function hasSyncedBefore(userId: number): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LAST_SYNC_KEY(userId)) != null;
}

function markSynced(userId: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString());
}

export function snapshotReview(review: ReviewWatch): ReviewSyncState {
  return {
    like_count: review.like_count,
    host_reply_at: review.host_reply_at ?? null,
    created_at: review.created_at,
  };
}

/** Call after the current user likes or replies so polling does not self-notify. */
export function markReviewSyncState(userId: number, reviewId: number, snap: ReviewSyncState) {
  const store = readSyncStore(userId);
  store[reviewId] = snap;
  writeSyncStore(userId, store);
}

export function reviewListingHref(listingId: number, reviewId: number) {
  return `/listing/${listingId}#review-${reviewId}`;
}

type AddNotification = (
  title: string,
  body: string,
  type?: "review",
  options?: {
    toast?: boolean;
    userId?: number;
    eventAt?: string;
    dedupeKey?: string;
    read?: boolean;
    href?: string;
  }
) => void;

export function reviewDedupePrefix(userId: number, reviewId: number) {
  return `review:${userId}:${reviewId}:`;
}

/** Sync review activity into the notification bell. */
export async function syncReviewNotifications(
  userId: number,
  addNotification: AddNotification,
  options?: { toastNew?: boolean }
) {
  const toastNew = options?.toastNew ?? false;
  const tracked = await api.getTrackedReviews();
  const store = readSyncStore(userId);
  const nextStore: ReviewSyncStore = { ...store };
  const syncedBefore = hasSyncedBefore(userId);

  for (const review of tracked) {
    const prev = store[review.id];
    const snap = snapshotReview(review);
    const isHost = review.host_id === userId;
    const isGuest = review.guest_id === userId;

    if (!prev) {
      nextStore[review.id] = snap;
      if (isHost && syncedBefore) {
        addNotification(
          "New review on your listing",
          `${review.guest_name} left a ${review.rating}-star review on ${review.listing_title}`,
          "review",
          {
            toast: toastNew,
            userId,
            eventAt: review.created_at,
            dedupeKey: `review:${userId}:new:${review.id}`,
            href: reviewListingHref(review.listing_id, review.id),
          }
        );
      }
      continue;
    }

    if (isHost && review.like_count > prev.like_count) {
      addNotification(
        "Review liked",
        `Someone liked ${review.guest_name}'s review on ${review.listing_title}`,
        "review",
        {
          toast: toastNew,
          userId,
          eventAt: new Date().toISOString(),
          dedupeKey: `review:${userId}:liked:${review.id}:${review.like_count}`,
          href: reviewListingHref(review.listing_id, review.id),
        }
      );
    }

    if (isGuest && review.like_count > prev.like_count) {
      addNotification(
        "Your review was liked",
        `Someone liked your review on ${review.listing_title}`,
        "review",
        {
          toast: toastNew,
          userId,
          eventAt: new Date().toISOString(),
          dedupeKey: `review:${userId}:liked:${review.id}:${review.like_count}`,
          href: reviewListingHref(review.listing_id, review.id),
        }
      );
    }

    const replyAt = review.host_reply_at ?? null;
    const prevReplyAt = prev.host_reply_at ?? null;
    if (isGuest && replyAt && replyAt !== prevReplyAt) {
      addNotification(
        "Host replied to your review",
        `The host responded on ${review.listing_title}`,
        "review",
        {
          toast: toastNew,
          userId,
          eventAt: replyAt,
          dedupeKey: `review:${userId}:reply:${review.id}:${replyAt}`,
          href: reviewListingHref(review.listing_id, review.id),
        }
      );
    }

    nextStore[review.id] = snap;
  }

  writeSyncStore(userId, nextStore);
  markSynced(userId);
}
