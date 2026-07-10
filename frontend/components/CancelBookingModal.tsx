"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Booking, RefundPreview } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onCancelled: (updated: Booking) => void;
}

export default function CancelBookingModal({ booking, open, onClose, onCancelled }: Props) {
  const [preview, setPreview] = useState<RefundPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .getRefundPreview(booking.id)
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setLoading(false));
  }, [open, booking.id]);

  if (!open) return null;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await api.cancelBooking(booking.id);
      onCancelled(updated);
      onClose();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">Cancel this booking?</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">{booking.listing_title}</p>
        <p className="mt-1 text-sm">
          {booking.check_in} → {booking.check_out}
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Calculating refund...</p>
        ) : preview ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Refund: ₹{preview.refund_amount.toLocaleString("en-IN")} ({preview.refund_percent}%)
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {preview.late_cancel
                ? "Cancellations within 24 hours of check-in receive a 50% refund."
                : "Full refund — you're cancelling more than 24 hours before check-in."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Original total: ₹{preview.total_price.toLocaleString("en-IN")}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling || loading}
            className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Confirm cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
