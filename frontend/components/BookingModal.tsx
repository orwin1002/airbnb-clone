"use client";

import { useEffect, useState } from "react";
import { differenceInDays, format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import type { Booking, ListingDetail } from "@/lib/types";
import { useToast } from "@/lib/toast";
import { useNotifications } from "@/lib/notifications";

type Step = "summary" | "checkout" | "confirmation";

interface Props {
  open: boolean;
  listing: ListingDetail;
  checkIn: string;
  checkOut: string;
  guests: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CLEANING_FEE = 500;
const SERVICE_FEE_RATE = 0.12;

export default function BookingModal({
  open,
  listing,
  checkIn,
  checkOut,
  guests,
  onClose,
  onSuccess,
}: Props) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [step, setStep] = useState<Step>("summary");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setStep("summary");
      setBooking(null);
      setCard({ number: "", expiry: "", cvc: "" });
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const nights = differenceInDays(parseISO(checkOut), parseISO(checkIn));
  const subtotal = listing.price_per_night * nights;
  const serviceFee = subtotal * SERVICE_FEE_RATE;
  const total = subtotal + CLEANING_FEE + serviceFee;
  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const validateCard = () => {
    const next: Record<string, string> = {};
    const digits = card.number.replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits)) next.number = "Enter a 16-digit card number";
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) next.expiry = "Use MM/YY format";
    if (!/^\d{3,4}$/.test(card.cvc)) next.cvc = "Enter 3–4 digit CVC";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePay = async () => {
    if (!validateCard()) return;
    setLoading(true);
    try {
      const result = await api.createBooking({
        listing_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guests,
      });
      setBooking(result);
      setStep("confirmation");
      showToast("Booking confirmed!", "success");
      addNotification(
        "Booking confirmed",
        `${listing.title} · ${checkIn} to ${checkOut}`,
        "booking",
        { toast: false }
      );
      onSuccess();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Booking failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCard = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {step === "summary" && "Booking summary"}
            {step === "checkout" && "Checkout"}
            {step === "confirmation" && "You're all set!"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {step === "summary" && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{listing.title}</p>
                <p className="text-sm text-muted-foreground">
                  {listing.location_area}, {listing.location_city}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Dates</span>
                  <span>
                    {format(parseISO(checkIn), "MMM d")} – {format(parseISO(checkOut), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Guests</span>
                  <span>{guests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nights</span>
                  <span>{nights}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>₹{fmt(listing.price_per_night)} × {nights} nights</span>
                  <span>₹{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning fee</span>
                  <span>₹{fmt(CLEANING_FEE)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>₹{fmt(serviceFee)}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>₹{fmt(total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep("checkout")}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary/90"
              >
                Continue to payment
              </button>
            </div>
          )}

          {step === "checkout" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This is a mocked payment form — no real charges will be made.
              </p>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase">Card number</label>
                <input
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                  placeholder="1234 5678 9012 3456"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                {errors.number && <p className="mt-1 text-xs text-rose-600">{errors.number}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase">Expiry</label>
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/YY"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                  />
                  {errors.expiry && <p className="mt-1 text-xs text-rose-600">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase">CVC</label>
                  <input
                    value={card.cvc}
                    onChange={(e) =>
                      setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })
                    }
                    placeholder="123"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                  />
                  {errors.cvc && <p className="mt-1 text-xs text-rose-600">{errors.cvc}</p>}
                </div>
              </div>
              <div className="flex justify-between rounded-xl bg-muted/50 px-4 py-3 font-semibold">
                <span>Total due</span>
                <span>₹{fmt(total)}</span>
              </div>
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm and pay"}
              </button>
            </div>
          )}

          {step === "confirmation" && booking && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-900">
                ✓
              </div>
              <p className="text-lg font-semibold">Booking confirmed!</p>
              <p className="text-sm text-muted-foreground">
                Reference <span className="font-mono font-medium text-foreground">#{booking.id}</span>
              </p>
              <div className="rounded-xl bg-muted/50 p-4 text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Dates</span>
                  <span>{booking.check_in} → {booking.check_out}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests</span>
                  <span>{booking.guests_count}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total paid</span>
                  <span>₹{booking.total_price.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-white"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
