"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

interface Props {
  checkIn?: string;
  checkOut?: string;
  onChange: (checkIn: string | undefined, checkOut: string | undefined) => void;
  className?: string;
}

function toRange(checkIn?: string, checkOut?: string): DateRange | undefined {
  if (!checkIn) return undefined;
  return { from: parseISO(checkIn), to: checkOut ? parseISO(checkOut) : undefined };
}

export default function WhenDatePopover({ checkIn, checkOut, onChange, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(() => toRange(checkIn, checkOut));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setDraft(toRange(checkIn, checkOut));
  }, [checkIn, checkOut, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const today = startOfDay(new Date());

  const handleSelect = (next: DateRange | undefined) => {
    setDraft(next);
  };

  const applyDates = () => {
    if (!draft?.from || !draft?.to) return;
    onChange(format(draft.from, "yyyy-MM-dd"), format(draft.to, "yyyy-MM-dd"));
    setOpen(false);
  };

  const label = () => {
    if (checkIn && checkOut) {
      return `${format(parseISO(checkIn), "MMM d")} – ${format(parseISO(checkOut), "MMM d")}`;
    }
    if (checkIn) return format(parseISO(checkIn), "MMM d");
    return "Add dates";
  };

  const statusText = !draft?.from
    ? "Select your check-in date"
    : !draft?.to
      ? "Now select your checkout date"
      : `${format(draft.from, "MMM d")} – ${format(draft.to, "MMM d")}`;

  const calendarPanel = (
    <>
      <p className="mb-3 text-sm font-medium">{statusText}</p>
      <div className="overflow-x-auto">
        <DayPicker
          mode="range"
          selected={draft}
          onSelect={handleSelect}
          numberOfMonths={typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2}
          disabled={(day) => isBefore(day, today)}
          classNames={{
            root: "rdp-root mx-auto text-sm",
            months: "flex flex-col gap-4 sm:flex-row sm:gap-8",
            month_caption: "mb-3 font-semibold",
            day_button: "h-9 w-9 rounded-full hover:bg-muted",
            selected: "bg-foreground text-background rounded-full",
            range_start: "bg-foreground text-background rounded-full",
            range_end: "bg-foreground text-background rounded-full",
            range_middle: "bg-muted rounded-none",
            disabled: "text-muted-foreground/40 line-through",
            today: "font-bold",
          }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setDraft(undefined)}
          className="rounded-lg px-3 py-2 text-sm font-medium underline"
        >
          Clear dates
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyDates}
            disabled={!draft?.from || !draft?.to}
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div ref={ref} className={`relative flex-1 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-2.5 text-left transition hover:bg-muted/40 sm:py-2"
      >
        <span className="block text-xs font-semibold">When</span>
        <span className="text-sm">{label()}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 sm:bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[90vh] overflow-y-auto rounded-t-3xl border border-border bg-card p-4 shadow-elevated sm:hidden">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
            {calendarPanel}
          </div>
          <div
            className="absolute left-1/2 top-full z-[70] mt-3 hidden w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-border bg-card p-5 shadow-elevated sm:block"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {calendarPanel}
          </div>
        </>
      )}
    </div>
  );
}
