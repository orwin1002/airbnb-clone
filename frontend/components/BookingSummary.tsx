"use client";

import { differenceInDays, parseISO } from "date-fns";
import DateRangePopover from "@/components/DateRangePopover";
import type { AvailabilityRange } from "@/lib/types";

interface Props {
  pricePerNight: number;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  maxGuests: number;
  blockedRanges?: AvailabilityRange[];
  onDateChange: (checkIn: string | undefined, checkOut: string | undefined) => void;
  onGuestsChange: (n: number) => void;
  onReserve: () => void;
  loading?: boolean;
}

const CLEANING_FEE = 500;
const SERVICE_FEE_RATE = 0.12;

export default function BookingSummary({
  pricePerNight,
  checkIn,
  checkOut,
  guests,
  maxGuests,
  blockedRanges = [],
  onDateChange,
  onGuestsChange,
  onReserve,
  loading,
}: Props) {
  const nights =
    checkIn && checkOut ? differenceInDays(parseISO(checkOut), parseISO(checkIn)) : 0;
  const subtotal = nights > 0 ? pricePerNight * nights : 0;
  const serviceFee = subtotal * SERVICE_FEE_RATE;
  const total = nights > 0 ? subtotal + CLEANING_FEE + serviceFee : 0;

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-border p-6 shadow-lg">
      <div className="mb-4 flex items-baseline gap-1">
        <span className="text-2xl font-semibold">₹{fmt(pricePerNight)}</span>
        <span className="text-muted-foreground">night</span>
      </div>

      <div className="mb-4">
        <DateRangePopover
          checkIn={checkIn}
          checkOut={checkOut}
          blockedRanges={blockedRanges}
          onChange={onDateChange}
        />
      </div>

      <div className="mb-4 rounded-xl border border-border p-3">
        <label className="text-xs font-semibold uppercase">Guests</label>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm">{guests} guest{guests !== 1 ? "s" : ""}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onGuestsChange(Math.max(1, guests - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => onGuestsChange(Math.min(maxGuests, guests + 1))}
              disabled={guests >= maxGuests}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {nights > 0 && (
        <div className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="underline">
              ₹{fmt(pricePerNight)} × {nights} nights
            </span>
            <span>₹{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="underline">Cleaning fee</span>
            <span>₹{fmt(CLEANING_FEE)}</span>
          </div>
          <div className="flex justify-between">
            <span className="underline">Service fee</span>
            <span>₹{fmt(serviceFee)}</span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{fmt(total)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onReserve}
        disabled={!checkIn || !checkOut || nights <= 0 || loading}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Booking..." : "Reserve"}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">You won&apos;t be charged yet</p>
    </div>
  );
}
