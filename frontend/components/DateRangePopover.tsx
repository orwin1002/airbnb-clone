"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { DayPicker, type DateRange } from "react-day-picker";
import type { AvailabilityRange } from "@/lib/types";
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

function isBlockedDate(day: Date, ranges: AvailabilityRange[]) {
  const d = startOfDay(day);
  return ranges.some((r) => {
    const start = startOfDay(parseISO(r.check_in));
    const end = startOfDay(parseISO(r.check_out));
    return !isBefore(d, start) && isBefore(d, end);
  });
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setDraft(toRange(checkIn, checkOut));
  }, [checkIn, checkOut, open]);

  const today = startOfDay(new Date());

  const applyDates = () => {
    if (!draft?.from || !draft?.to) return;
    onChange(format(draft.from, "yyyy-MM-dd"), format(draft.to, "yyyy-MM-dd"));
    setOpen(false);
  };

  const label = (value: string | undefined, fallback: string) =>
    value ? format(parseISO(value), "MMM d, yyyy") : fallback;

  const statusText = !draft?.from
    ? "Select check-in"
    : !draft?.to
      ? "Select checkout"
      : `${format(draft.from, "MMM d")} – ${format(draft.to, "MMM d")}`;

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

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-border bg-card p-4 shadow-elevated sm:left-auto sm:right-0 sm:min-w-[640px]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="mb-3 text-sm font-medium">{statusText}</p>
          <DayPicker
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={2}
            disabled={(day) => isBefore(day, today) || isBlockedDate(day, blockedRanges)}
            classNames={{
              root: "rdp-root text-sm",
              months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
              month_caption: "font-semibold mb-2",
              day_button: "h-9 w-9 rounded-full hover:bg-muted",
              selected: "bg-foreground text-background rounded-full",
              range_start: "bg-foreground text-background rounded-full",
              range_end: "bg-foreground text-background rounded-full",
              range_middle: "bg-muted rounded-none",
              disabled: "text-muted-foreground/40 line-through",
              today: "font-bold",
            }}
          />
          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setDraft(undefined)}
              className="rounded-lg px-3 py-1.5 text-sm underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyDates}
              disabled={!draft?.from || !draft?.to}
              className="rounded-lg bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
