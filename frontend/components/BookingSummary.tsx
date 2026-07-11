"use client";

import { differenceInDays, format, parseISO } from "date-fns";
import DateRangePopover from "@/components/DateRangePopover";
import GuestSelectorPopover from "@/components/GuestSelectorPopover";
import { rangeOverlapsBlocked } from "@/lib/dates";
import type { AvailabilityRange } from "@/lib/types";

interface Props {
  pricePerNight: number;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  children: number;
  infants: number;
  maxGuests: number;
  blockedRanges?: AvailabilityRange[];
  onDateChange: (checkIn: string | undefined, checkOut: string | undefined) => void;
  onGuestsChange: (counts: { adults: number; children: number; infants: number }) => void;
  onReserve: () => void;
  loading?: boolean;
  className?: string;
}

const CLEANING_FEE = 500;
const SERVICE_FEE_RATE = 0.12;

export default function BookingSummary({
  pricePerNight,
  checkIn,
  checkOut,
  adults,
  children,
  infants,
  maxGuests,
  blockedRanges = [],
  onDateChange,
  onGuestsChange,
  onReserve,
  loading,
  className = "",
}: Props) {
  const nights =
    checkIn && checkOut ? differenceInDays(parseISO(checkOut), parseISO(checkIn)) : 0;
  const datesInvalid =
    !!checkIn && !!checkOut && rangeOverlapsBlocked(checkIn, checkOut, blockedRanges);
  const subtotal = nights > 0 && !datesInvalid ? pricePerNight * nights : 0;
  const serviceFee = subtotal * SERVICE_FEE_RATE;
  const total = nights > 0 ? subtotal + CLEANING_FEE + serviceFee : 0;

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className={`rounded-2xl border border-border p-6 shadow-lg ${className}`}>
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

      <div className="mb-4">
        <GuestSelectorPopover
          variant="field"
          adults={adults}
          children={children}
          infants={infants}
          minAdults={1}
          maxGuestCapacity={maxGuests}
          onChange={(counts) =>
            onGuestsChange({
              adults: counts.adults ?? 1,
              children: counts.children ?? 0,
              infants: counts.infants ?? 0,
            })
          }
        />
      </div>

      {nights > 0 && !datesInvalid && (
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
        disabled={!checkIn || !checkOut || nights <= 0 || datesInvalid || loading}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {datesInvalid ? "Dates unavailable" : loading ? "Booking..." : "Reserve"}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">You won&apos;t be charged yet</p>
    </div>
  );
}

export function bookingSummaryLabel(
  pricePerNight: number,
  checkIn?: string,
  checkOut?: string
) {
  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  if (checkIn && checkOut) {
    return `${format(parseISO(checkIn), "MMM d")} – ${format(parseISO(checkOut), "MMM d")}`;
  }
  return `₹${fmt(pricePerNight)} night`;
}
