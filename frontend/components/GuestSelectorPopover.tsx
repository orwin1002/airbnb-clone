"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

interface Props {
  adults?: number;
  children?: number;
  infants?: number;
  onChange: (counts: { adults?: number; children?: number; infants?: number }) => void;
}

function CounterRow({
  label,
  sublabel,
  value,
  onDecrement,
  onIncrement,
  disableDecrement,
  disableIncrement,
}: {
  label: string;
  sublabel: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disableDecrement: boolean;
  disableIncrement?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disableDecrement}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border disabled:opacity-30"
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-sm">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disableIncrement}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border disabled:opacity-30"
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function guestLabel(adults = 0, children = 0, infants = 0) {
  const total = adults + children;
  if (total === 0 && infants === 0) return "Add guests";
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} adult${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} child${children > 1 ? "ren" : ""}`);
  if (infants > 0) parts.push(`${infants} infant${infants > 1 ? "s" : ""}`);
  return parts.join(", ");
}

export default function GuestSelectorPopover({ adults = 0, children = 0, infants = 0, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draftAdults, setDraftAdults] = useState(adults);
  const [draftChildren, setDraftChildren] = useState(children);
  const [draftInfants, setDraftInfants] = useState(infants);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setDraftAdults(adults);
      setDraftChildren(children);
      setDraftInfants(infants);
    }
  }, [adults, children, infants, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const apply = () => {
    onChange({
      adults: draftAdults || undefined,
      children: draftChildren || undefined,
      infants: draftInfants || undefined,
    });
    setOpen(false);
  };

  const clear = () => {
    setDraftAdults(0);
    setDraftChildren(0);
    setDraftInfants(0);
    onChange({});
    setOpen(false);
  };

  const panel = (
    <div className="w-full sm:w-[340px]">
      <CounterRow
        label="Adults"
        sublabel="Ages 13 or above"
        value={draftAdults}
        onDecrement={() => setDraftAdults(Math.max(0, draftAdults - 1))}
        onIncrement={() => setDraftAdults(draftAdults + 1)}
        disableDecrement={draftAdults <= 0}
      />
      <CounterRow
        label="Children"
        sublabel="Ages 2–12"
        value={draftChildren}
        onDecrement={() => setDraftChildren(Math.max(0, draftChildren - 1))}
        onIncrement={() => setDraftChildren(draftChildren + 1)}
        disableDecrement={draftChildren <= 0}
      />
      <CounterRow
        label="Infants"
        sublabel="Under 2"
        value={draftInfants}
        onDecrement={() => setDraftInfants(Math.max(0, draftInfants - 1))}
        onIncrement={() => setDraftInfants(draftInfants + 1)}
        disableDecrement={draftInfants <= 0}
      />
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-4">
        <button type="button" onClick={clear} className="rounded-lg px-3 py-2 text-sm font-medium underline">
          Clear guests
        </button>
        <button
          type="button"
          onClick={apply}
          className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-2.5 text-left transition hover:bg-muted/40 sm:py-2"
      >
        <span className="block text-xs font-semibold">Who</span>
        <span className="text-sm">{guestLabel(adults, children, infants)}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 sm:bg-black/20" onClick={() => setOpen(false)} aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl border border-border bg-card p-4 shadow-elevated sm:hidden">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
            {panel}
          </div>
          <div
            className="absolute right-0 top-full z-[70] mt-3 hidden rounded-2xl border border-border bg-card p-5 shadow-elevated sm:block"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {panel}
          </div>
        </>
      )}
    </div>
  );
}
