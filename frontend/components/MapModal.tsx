"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { ListingCard } from "@/lib/types";

const SearchResultsMap = dynamic(() => import("@/components/SearchResultsMap"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-muted" />,
});

interface Props {
  open: boolean;
  listings: ListingCard[];
  selectedId?: number | null;
  onSelect?: (id: number | null) => void;
  onClose: () => void;
}

export default function MapModal({ open, listings, selectedId, onSelect, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold">Map</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-muted"
          aria-label="Close map"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex-1">
        <SearchResultsMap
          listings={listings}
          selectedId={selectedId}
          onSelect={onSelect}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
