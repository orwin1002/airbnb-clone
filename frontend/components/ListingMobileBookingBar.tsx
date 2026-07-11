"use client";

import { useState } from "react";
import { X } from "lucide-react";
import BookingSummary, { bookingSummaryLabel } from "@/components/BookingSummary";
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
}

export default function ListingMobileBookingBar({
  pricePerNight,
  checkIn,
  checkOut,
  adults,
  children,
  infants,
  maxGuests,
  blockedRanges,
  onDateChange,
  onGuestsChange,
  onReserve,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const handleReserve = () => {
    onReserve();
    setSheetOpen(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setSheetOpen(true)} className="min-w-0 flex-1 text-left">
            <p className="text-lg font-semibold leading-tight">
              ₹{fmt(pricePerNight)}{" "}
              <span className="text-sm font-normal text-muted-foreground">night</span>
            </p>
            <p className="truncate text-xs text-muted-foreground underline">
              {checkIn && checkOut
                ? bookingSummaryLabel(pricePerNight, checkIn, checkOut)
                : "Add dates for prices"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm"
          >
            Reserve
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSheetOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl border border-border bg-background shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-lg font-semibold">Book your stay</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <BookingSummary
                pricePerNight={pricePerNight}
                checkIn={checkIn}
                checkOut={checkOut}
                adults={adults}
                children={children}
                infants={infants}
                maxGuests={maxGuests}
                blockedRanges={blockedRanges}
                onDateChange={onDateChange}
                onGuestsChange={onGuestsChange}
                onReserve={handleReserve}
                className="border-0 p-0 shadow-none"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
