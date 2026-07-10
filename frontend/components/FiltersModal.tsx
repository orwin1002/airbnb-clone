"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AMENITY_OPTIONS } from "@/lib/amenities";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/propertyTypes";
import { VIBE_OPTIONS } from "@/lib/vibes";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import type { SearchFilters } from "@/lib/types";

export interface FilterDraft {
  property_type?: string;
  vibe?: string;
  min_price?: number;
  max_price?: number;
  amenities: string[];
}

interface Props {
  open: boolean;
  filters: SearchFilters;
  amenities: string[];
  onClose: () => void;
  onApply: (filters: SearchFilters, amenities: string[]) => void;
}

function toDraft(filters: SearchFilters, amenities: string[]): FilterDraft {
  return {
    property_type: filters.property_type,
    vibe: filters.vibe,
    min_price: filters.min_price,
    max_price: filters.max_price,
    amenities: [...amenities],
  };
}

function PillRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[];
  value?: string;
  onChange: (next: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value: optValue, label, icon: Icon }) => {
        const active = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(active ? undefined : optValue)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:border-foreground/30"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function FiltersModal({ open, filters, amenities, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<FilterDraft>(() => toDraft(filters, amenities));

  useEffect(() => {
    if (open) setDraft(toDraft(filters, amenities));
  }, [open, filters, amenities]);

  if (!open) return null;

  const toggleAmenity = (name: string) => {
    setDraft((d) => ({
      ...d,
      amenities: d.amenities.includes(name)
        ? d.amenities.filter((a) => a !== name)
        : [...d.amenities, name],
    }));
  };

  const handleClear = () => {
    setDraft({ amenities: [] });
  };

  const handleApply = () => {
    onApply(
      {
        ...filters,
        property_type: draft.property_type,
        vibe: draft.vibe,
        min_price: draft.min_price,
        max_price: draft.max_price,
        page: 1,
      },
      draft.amenities
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="mb-4 text-base font-semibold">Type of place</h3>
            <PillRow
              options={PROPERTY_TYPE_OPTIONS}
              value={draft.property_type}
              onChange={(property_type) => setDraft((d) => ({ ...d, property_type }))}
            />
          </section>

          <section className="border-t border-border pt-8">
            <h3 className="mb-4 text-base font-semibold">Vibe</h3>
            <PillRow
              options={VIBE_OPTIONS}
              value={draft.vibe}
              onChange={(vibe) => setDraft((d) => ({ ...d, vibe }))}
            />
          </section>

          <section className="border-t border-border pt-8">
            <h3 className="mb-4 text-base font-semibold">Price range</h3>
            <p className="mb-4 text-sm text-muted-foreground">Nightly prices before fees and taxes</p>
            <PriceRangeSlider
              minValue={draft.min_price}
              maxValue={draft.max_price}
              onChange={(min_price, max_price) => setDraft((d) => ({ ...d, min_price, max_price }))}
            />
          </section>

          <section className="border-t border-border pt-8">
            <h3 className="mb-4 text-base font-semibold">Amenities</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {AMENITY_OPTIONS.map((name) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    checked={draft.amenities.includes(name)}
                    onChange={() => toggleAmenity(name)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{name}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button type="button" onClick={handleClear} className="text-sm font-medium underline">
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            Show stays
          </button>
        </div>
      </div>
    </div>
  );
}

export function countActiveFilters(filters: SearchFilters, amenities: string[]) {
  let count = 0;
  if (filters.property_type) count++;
  if (filters.vibe) count++;
  if (filters.min_price != null) count++;
  if (filters.max_price != null) count++;
  count += amenities.length;
  return count;
}
