import type {
  AvailabilityRange,
  Booking,
  ListingCard,
  ListingDetail,
  ListingListResponse,
  Review,
  SearchFilters,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored).id as number;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const userId = getUserId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (userId) headers["X-User-Id"] = String(userId);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { msg?: string }) => d.msg || String(d)).join(", ")
      : detail || "Request failed";
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function normalizeReview(raw: Review): Review {
  return {
    ...raw,
    guest_id: raw.guest_id ?? 0,
    like_count: raw.like_count ?? 0,
    liked_by_me: raw.liked_by_me ?? false,
    host_reply: raw.host_reply ?? null,
    host_reply_at: raw.host_reply_at ?? null,
  };
}

function normalizeGuestReview(raw: import("./types").GuestReview): import("./types").GuestReview {
  return {
    ...normalizeReview(raw),
    listing_id: raw.listing_id,
    listing_title: raw.listing_title,
  };
}

async function requestWithRetry<T>(
  path: string,
  options: RequestInit = {},
  retries = 4,
  delayMs = 8000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await request<T>(path, options);
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export const api = {
  login: (email: string, password: string) =>
    request<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  demoLogin: (email: string) =>
    request<User>("/auth/demo-login", { method: "POST", body: JSON.stringify({ email }) }),

  register: (data: { name: string; email: string; password: string; is_host: boolean }) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<User>("/auth/me"),

  verifyIdentity: () =>
    request<User>("/auth/verify-identity", { method: "POST" }),

  getListings: (filters: SearchFilters = {}) => {
    const params = new URLSearchParams();
    const { adults, children, infants, q, ...apiFilters } = filters;
    if (q) params.set("city", q);
    Object.entries(apiFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
    });
    return requestWithRetry<ListingListResponse>(`/listings?${params}`);
  },

  getListing: (id: number) => request<ListingDetail>(`/listings/${id}`),

  getAvailability: (id: number) =>
    request<AvailabilityRange[]>(`/listings/${id}/availability`),

  getReviews: (id: number) =>
    request<Review[]>(`/listings/${id}/reviews`).then((rows) => rows.map(normalizeReview)),

  createListing: (data: Record<string, unknown>) =>
    request<ListingDetail>("/listings", { method: "POST", body: JSON.stringify(data) }),

  updateListing: (id: number, data: Record<string, unknown>) =>
    request<ListingDetail>(`/listings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteListing: (id: number) =>
    request<void>(`/listings/${id}`, { method: "DELETE" }),

  createBooking: (data: {
    listing_id: number;
    check_in: string;
    check_out: string;
    guests_count: number;
  }) =>
    request<Booking>("/bookings", { method: "POST", body: JSON.stringify(data) }),

  getMyBookings: () => request<Booking[]>("/bookings/me"),

  getHostListings: () => request<ListingCard[]>("/hosts/me/listings"),

  getHostBookings: () => request<Booking[]>("/hosts/me/bookings"),

  getHostReviews: () => request<import("./types").HostReview[]>("/hosts/me/reviews"),

  cancelBooking: (bookingId: number) =>
    request<Booking>(`/bookings/${bookingId}/cancel`, { method: "PATCH" }),

  getRefundPreview: (bookingId: number) =>
    request<import("./types").RefundPreview>(`/bookings/${bookingId}/refund-preview`),

  getConversations: () => request<import("./types").Conversation[]>("/messages/conversations"),

  startConversation: (listingId: number) =>
    request<import("./types").Conversation>("/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId }),
    }),

  startHostConversation: (listingId: number, guestId: number) =>
    request<import("./types").Conversation>("/messages/conversations/for-guest", {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId, guest_id: guestId }),
    }),

  getMessages: (conversationId: number) =>
    request<import("./types").Message[]>(`/messages/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: number, body: string) =>
    request<import("./types").Message>(`/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  addFavorite: (listingId: number) =>
    request<{ message: string }>(`/favorites/${listingId}`, { method: "POST" }),

  removeFavorite: (listingId: number) =>
    request<void>(`/favorites/${listingId}`, { method: "DELETE" }),

  getFavorites: () => request<ListingCard[]>("/favorites/me"),

  createReview: (data: {
    listing_id: number;
    booking_id: number;
    rating: number;
    comment: string;
  }) =>
    request<Review>("/reviews", { method: "POST", body: JSON.stringify(data) }),

  toggleReviewLike: (reviewId: number) =>
    request<Review>(`/reviews/${reviewId}/like`, { method: "POST" }),

  replyToReview: (reviewId: number, body: string) =>
    request<import("./types").HostReview>(`/reviews/${reviewId}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  updateReview: (reviewId: number, data: { rating: number; comment: string }) =>
    request<Review>(`/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then(normalizeReview),

  deleteReview: (reviewId: number) =>
    request<void>(`/reviews/${reviewId}`, { method: "DELETE" }),

  deleteReviewReply: (reviewId: number) =>
    request<import("./types").HostReview>(`/reviews/${reviewId}/reply`, {
      method: "DELETE",
    }),

  getTrackedReviews: () => request<import("./types").ReviewWatch[]>("/reviews/me/tracked"),

  getMyWrittenReviews: () =>
    request<import("./types").GuestReview[]>("/reviews/me/written").then((rows) =>
      rows.map((r) => ({ ...normalizeReview(r), listing_id: r.listing_id, listing_title: r.listing_title }))
    ),
};
