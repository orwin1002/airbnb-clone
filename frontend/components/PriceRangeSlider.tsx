"use client";

import { clampPrice, formatPrice, PRICE_MAX, PRICE_MIN, PRICE_STEP } from "@/lib/priceRange";

interface Props {
  minValue?: number;
  maxValue?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

export default function PriceRangeSlider({ minValue, maxValue, onChange }: Props) {
  const min = minValue ?? PRICE_MIN;
  const max = maxValue ?? PRICE_MAX;
  const minPct = ((min - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const maxPct = ((max - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const setMin = (next: number) => {
    const clamped = clampPrice(Math.min(next, max - PRICE_STEP));
    onChange(clamped <= PRICE_MIN ? undefined : clamped, maxValue);
  };

  const setMax = (next: number) => {
    const clamped = clampPrice(Math.max(next, min + PRICE_STEP));
    onChange(minValue, clamped >= PRICE_MAX ? undefined : clamped);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <div className="rounded-xl border border-border px-4 py-3">
          <span className="block text-xs text-muted-foreground">Minimum</span>
          <span className="font-semibold">{formatPrice(min)}</span>
        </div>
        <span className="text-muted-foreground">—</span>
        <div className="rounded-xl border border-border px-4 py-3">
          <span className="block text-xs text-muted-foreground">Maximum</span>
          <span className="font-semibold">{formatPrice(max)}+</span>
        </div>
      </div>

      <div className="relative h-8 px-1">
        <div className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="range-thumb pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="range-thumb pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
}
