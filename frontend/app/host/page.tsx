"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { CalendarDays, Home, MessageSquare, Plus, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { formatMessageTimestamp } from "@/lib/dates";
import type { Booking, HostReview, ListingCard } from "@/lib/types";
import { useToast } from "@/lib/toast";
import ReviewEngagement from "@/components/ReviewEngagement";

type HostTab = "listings" | "bookings" | "reviews";

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-foreground" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

export default function HostDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<HostTab>("listings");
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<HostReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ListingCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [messagingId, setMessagingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.getHostListings(), api.getHostBookings(), api.getHostReviews()])
      .then(([l, b, r]) => {
        setListings(l);
        setBookings(b);
        setReviews(r);
      })
      .catch(() => showToast("Failed to load dashboard", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.is_host) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user?.is_host || tab !== "reviews") return;
    const poll = () => {
      api.getHostReviews().then(setReviews).catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 4000);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, tab]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteListing(deleteTarget.id);
      showToast("Listing deleted", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleMessageGuest = async (booking: Booking) => {
    setMessagingId(booking.id);
    try {
      const conv = await api.startHostConversation(booking.listing_id, booking.guest_id);
      router.push(`/inbox/${conv.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not open conversation", "error");
    } finally {
      setMessagingId(null);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Host Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Log in as a host to manage listings.</p>
      </div>
    );
  }

  if (!user.is_host) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Host Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Your account is a guest account. Log in as a host demo account (Priya, Sarah, Marcus, James, or David).
        </p>
      </div>
    );
  }

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      active
        ? "bg-foreground text-background shadow-sm"
        : "border border-border bg-card text-foreground hover:bg-muted/50"
    }`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-10 md:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">Hosting</h1>
        {tab === "listings" && (
          <Link
            href="/host/listings/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            New listing
          </Link>
        )}
      </div>

      <div className="mb-8 grid grid-cols-3 gap-2">
        <button type="button" className={tabClass(tab === "listings")} onClick={() => setTab("listings")}>
          <Home className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Your listings</span>
          <span className="sm:hidden">Listings</span>
          {!loading && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === "listings" ? "bg-background/20" : "bg-muted"}`}>
              {listings.length}
            </span>
          )}
        </button>
        <button type="button" className={tabClass(tab === "bookings")} onClick={() => setTab("bookings")}>
          <CalendarDays className="h-4 w-4 shrink-0" />
          Bookings
          {!loading && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === "bookings" ? "bg-background/20" : "bg-muted"}`}>
              {bookings.length}
            </span>
          )}
        </button>
        <button type="button" className={tabClass(tab === "reviews")} onClick={() => setTab("reviews")}>
          <Star className="h-4 w-4 shrink-0" />
          Reviews
          {!loading && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === "reviews" ? "bg-background/20" : "bg-muted"}`}>
              {reviews.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tab === "listings" ? (
        listings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
            <Home className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No listings yet.</p>
            <Link
              href="/host/listings/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((l) => (
              <div
                key={l.id}
                className="card-hover flex items-center gap-4 rounded-2xl border border-border p-4 shadow-sm"
              >
                <div className="relative h-[72px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-muted">
                  <SafeImage src={l.photo_url} alt="" fill className="object-cover" sizes="96px" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{l.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {l.location_city} · ₹{l.price_per_night.toLocaleString("en-IN")}/night
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/host/listings/${l.id}/edit`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(l)}
                    className="rounded-lg border border-border p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    aria-label="Delete listing"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "bookings" ? (
        bookings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No bookings on your listings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{b.listing_title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Guest: {b.guest_name} · {b.check_in} → {b.check_out} · {b.guests_count} guests
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    ₹{b.total_price.toLocaleString("en-IN")} ·{" "}
                    <span className="capitalize text-muted-foreground">{b.status}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={messagingId === b.id}
                  onClick={() => handleMessageGuest(b)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  {messagingId === b.id ? "Opening..." : "Message guest"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
          <Star className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No reviews on your listings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/listing/${r.listing_id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {r.listing_title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.guest_name} · {formatMessageTimestamp(r.created_at)}
                  </p>
                </div>
                <ReviewStars rating={r.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.comment}</p>
              <ReviewEngagement
                review={r}
                canReply
                onUpdate={(updated) =>
                  setReviews((prev) =>
                    prev.map((item) => (item.id === updated.id ? (updated as HostReview) : item)),
                  )
                }
              />
            </article>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setDeleteTarget(null)} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
            <h2 className="text-lg font-semibold">Delete listing?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{deleteTarget.title}</span> will be permanently
              removed, along with its bookings, reviews, and messages. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
