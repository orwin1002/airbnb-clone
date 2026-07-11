"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { DayPicker, type DateRange } from "react-day-picker";
import type { AvailabilityRange } from "@/lib/types";
import { isBlockedStayNight, rangeConflictsWithBookings } from "@/lib/dates";
import "react-day-picker/style.css";

interface Props {
  checkIn?: string;
  checkOut?: string;
  blockedRanges?: AvailabilityRange[];
  onChange: (checkIn: string | undefined, checkOut: string | undefined) => void;
  className?: string;
}

function toRange(checkIn?: string, checkOut?: string): DateRange | undefined {
  if (!checkIn) return undefined;
  const from = parseISO(checkIn);
  const to = checkOut ? parseISO(checkOut) : undefined;
  return { from, to };
}

export default function DateRangePopover({
  checkIn,
  checkOut,
  blockedRanges = [],
  onChange,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(() => toRange(checkIn, checkOut));
  const [rangeError, setRangeError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setDraft(toRange(checkIn, checkOut));
      setRangeError(null);
    }
  }, [checkIn, checkOut, open]);

  const today = startOfDay(new Date());

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      if (rangeConflictsWithBookings(range.from, range.to, blockedRanges)) {
        setRangeError("Some nights in this range are already booked. Pick different dates.");
        setDraft({ from: range.from, to: undefined });
        return;
      }
      setRangeError(null);
    } else {
      setRangeError(null);
    }
    setDraft(range);
  };

  const applyDates = () => {
    if (!draft?.from || !draft?.to) return;
    if (rangeConflictsWithBookings(draft.from, draft.to, blockedRanges)) {
      setRangeError("Some nights in this range are already booked. Pick different dates.");
      return;
    }
    onChange(format(draft.from, "yyyy-MM-dd"), format(draft.to, "yyyy-MM-dd"));
    setOpen(false);
  };

  const label = (value: string | undefined, fallback: string) =>
    value ? format(parseISO(value), "MMM d, yyyy") : fallback;

  const statusText = rangeError
    ? rangeError
    : !draft?.from
      ? "Select check-in"
      : !draft?.to
        ? "Select checkout"
        : `${format(draft.from, "MMM d")} – ${format(draft.to, "MMM d")}`;

  const calendar = (months: number) => (
    <>
      <p className={`mb-3 text-sm font-medium ${rangeError ? "text-rose-600" : ""}`}>{statusText}</p>
      <DayPicker
        mode="range"
        selected={draft}
        onSelect={handleSelect}
        numberOfMonths={months}
        disabled={(day) => isBefore(day, today) || isBlockedStayNight(day, blockedRanges)}
        classNames={{
          root: "rdp-root text-sm",
          months: months > 1 ? "flex flex-col gap-4 sm:flex-row sm:gap-6" : undefined,
          month_caption: "font-semibold mb-2",
          day_button: "h-9 w-9 rounded-full hover:bg-muted",
          selected: "bg-foreground text-background rounded-full",
          range_start: "bg-foreground text-background rounded-full",
          range_end: "bg-foreground text-background rounded-full",
          range_middle: "bg-muted rounded-none",
          disabled: "text-muted-foreground/40 line-through opacity-40",
          today: "font-bold",
        }}
      />
      <div className="mt-2 flex justify-end gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => {
            setDraft(undefined);
            setRangeError(null);
          }}
          className="rounded-lg px-3 py-1.5 text-sm underline"
        >
          Clear
        </button>
        {months === 1 ? null : (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={applyDates}
          disabled={!draft?.from || !draft?.to || !!rangeError}
          className="rounded-lg bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
        >
          Done
        </button>
      </div>
    </>
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-2 rounded-xl border border-border text-left transition hover:shadow-sm"
      >
        <div className="border-r border-border px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wide">Check-in</span>
          <span className="text-sm">{label(checkIn, "Add date")}</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wide">Checkout</span>
          <span className="text-sm">{label(checkOut, "Add date")}</span>
        </div>
      </button>

      {checkIn && checkOut && rangeConflictsWithBookings(parseISO(checkIn), parseISO(checkOut), blockedRanges) && (
        <p className="mt-2 text-xs text-rose-600">These dates include nights that are already booked.</p>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[90] max-h-[85vh] overflow-y-auto rounded-t-3xl border border-border bg-card p-4 shadow-elevated sm:hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
            {calendar(1)}
          </div>
          <div
            className="absolute left-0 right-0 z-50 mt-2 hidden rounded-2xl border border-border bg-card p-4 shadow-elevated sm:left-auto sm:right-0 sm:block sm:min-w-[640px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {calendar(2)}
          </div>
        </>
      )}
    </div>
  );
}
