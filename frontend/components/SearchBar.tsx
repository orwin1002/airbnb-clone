"use client";

import { Search } from "lucide-react";
import WhenDatePopover from "@/components/WhenDatePopover";
import GuestSelectorPopover from "@/components/GuestSelectorPopover";
import type { SearchFilters } from "@/lib/types";

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

export default function SearchBar({ filters, onChange, onSearch }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="shadow-search hover:shadow-search-hover mx-auto flex w-full max-w-[850px] flex-col gap-0 rounded-[40px] border border-border/80 bg-card transition-shadow duration-200 sm:flex-row sm:items-stretch sm:rounded-full sm:p-2">
      <div className="flex flex-1 flex-col border-b border-border/80 px-4 py-3 sm:border-b-0 sm:border-r sm:py-2">
        <label className="text-xs font-semibold">Where</label>
        <input
          type="text"
          placeholder="Search destinations, areas, or listings"
          value={filters.q || ""}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          onKeyDown={handleKeyDown}
          className="mt-0.5 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="relative flex flex-1 border-b border-border/80 sm:border-b-0 sm:border-r">
        <WhenDatePopover
          checkIn={filters.check_in}
          checkOut={filters.check_out}
          onChange={(check_in, check_out) => onChange({ ...filters, check_in, check_out })}
        />
      </div>

      <div className="flex flex-1 items-center gap-2 px-4 py-3 sm:py-2">
        <GuestSelectorPopover
          adults={filters.adults}
          children={filters.children}
          infants={filters.infants}
          onChange={({ adults, children, infants }) =>
            onChange({ ...filters, adults, children, infants })
          }
        />
        <button
          onClick={onSearch}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary/90 hover:shadow-lg"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
