"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import CancelBookingModal from "@/components/CancelBookingModal";
import MessageHostButton from "@/components/MessageHostButton";
import ReviewModal from "@/components/ReviewModal";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { useToast } from "@/lib/toast";

export default function TripsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  const loadBookings = () => {
    if (!user) return;
    api
      .getMyBookings()
      .then(setBookings)
      .catch(() => showToast("Failed to load trips", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancelled = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    showToast(
      updated.refund_amount != null
        ? `Cancelled. Refund: ₹${updated.refund_amount.toLocaleString("en-IN")} (${updated.refund_percent}%)`
        : "Booking cancelled",
      "success"
    );
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">My Trips</h1>
        <p className="mt-2 text-muted-foreground">Log in to see your bookings.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 md:px-10 md:py-10">
      <h1 className="mb-8 text-[28px] font-semibold tracking-tight md:mb-10 md:text-[32px]">My Trips</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-border p-12 text-center shadow-sm">
          <p className="text-muted-foreground">No trips booked yet.</p>
          <Link href="/" className="mt-4 inline-block font-medium text-primary underline">
            Start exploring
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="card-hover flex flex-col gap-4 rounded-2xl border border-border p-5 shadow-sm sm:flex-row sm:items-start"
            >
              <Link href={`/listing/${b.listing_id}`} className="flex flex-1 gap-4">
                <div className="relative h-[88px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-muted">
                  <SafeImage src={b.listing_photo} alt="" fill className="object-cover" sizes="128px" />
                </div>
                <div>
                  <h3 className="font-semibold">{b.listing_title}</h3>
                  <p className="text-sm text-muted-foreground">{b.location_city}</p>
                  <p className="mt-1 text-sm">
                    {b.check_in} → {b.check_out} · {b.guests_count} guests
                  </p>
                  <p className="mt-1 font-semibold">₹{b.total_price.toLocaleString("en-IN")}</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      b.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.status}
                  </span>
                  {b.status === "cancelled" && b.refund_amount != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Refunded ₹{b.refund_amount.toLocaleString("en-IN")} ({b.refund_percent}%)
                    </p>
                  )}
                </div>
              </Link>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                {b.status === "confirmed" && (
                  <MessageHostButton listingId={b.listing_id} hostId={b.host_id} className="w-full sm:w-auto" />
                )}
                {b.can_review && (
                  <button
                    type="button"
                    onClick={() => setReviewTarget(b)}
                    className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
                  >
                    Leave a review
                  </button>
                )}
                {b.has_review && (
                  <span className="text-xs text-muted-foreground">Review submitted</span>
                )}
                {b.status === "confirmed" && new Date(b.check_out) >= new Date() && (
                  <button
                    type="button"
                    onClick={() => setCancelTarget(b)}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                  >
                    Cancel booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          open={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={handleCancelled}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          listingId={reviewTarget.listing_id}
          listingTitle={reviewTarget.listing_title}
          bookingId={reviewTarget.id}
          onClose={() => setReviewTarget(null)}
          onSubmitted={loadBookings}
        />
      )}
    </main>
  );
}
