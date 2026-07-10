"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import SearchBar from "@/components/SearchBar";
import FiltersModal, { countActiveFilters } from "@/components/FiltersModal";
import { api } from "@/lib/api";
import type { ListingCard as ListingCardType, SearchFilters } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>({ page: 1 });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listings, setListings] = useState<ListingCardType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const buildFilters = useCallback(
    (f: SearchFilters, p: number, amenities: string[]) => {
      const guestCount = (f.adults || 0) + (f.children || 0);
      return {
        ...f,
        page: p,
        guests: guestCount > 0 ? guestCount : undefined,
        amenities: amenities.length > 0 ? amenities.join(",") : undefined,
      };
    },
    []
  );

  const fetchPage = useCallback(
    async (f: SearchFilters, p: number, amenities: string[], append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const data = await api.getListings(buildFilters(f, p, amenities));
        setListings((prev) => (append ? [...prev, ...data.items] : data.items));
        setHasMore(data.page < data.total_pages);
        setPage(data.page);
        setFetchError(false);
      } catch {
        if (!append) {
          setListings([]);
          setFetchError(true);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildFilters]
  );

  const resetAndFetch = useCallback(
    (f: SearchFilters, amenities: string[]) => {
      setPage(1);
      setHasMore(true);
      fetchPage(f, 1, amenities, false);
    },
    [fetchPage]
  );

  useEffect(() => {
    resetAndFetch(filters, selectedAmenities);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      api.getFavorites().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id)))).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPage(filters, page + 1, selectedAmenities, true);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, filters, selectedAmenities, fetchPage]);

  const activeFilterCount = countActiveFilters(filters, selectedAmenities);

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-background/95 px-4 py-5 sm:px-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-[1760px]">
          <SearchBar
            filters={filters}
            onChange={setFilters}
            onSearch={() => resetAndFetch({ ...filters, page: 1 }, selectedAmenities)}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 md:px-10 md:py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={`shadow-card inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition hover:shadow-elevated ${
              activeFilterCount > 0
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-background/20 px-1.5 text-xs">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:gap-x-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[20/19] animate-pulse rounded-xl bg-muted shadow-card" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">
              Could not load listings. The backend may be waking up (Render free tier takes ~30–60 seconds).
            </p>
            <button
              type="button"
              onClick={() => resetAndFetch(filters, selectedAmenities)}
              className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <p className="py-24 text-center text-muted-foreground">No listings found. Try adjusting filters.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:gap-x-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={favoriteIds.has(listing.id)}
                  onFavoriteToggle={() =>
                    api.getFavorites().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))))
                  }
                />
              ))}
            </div>
            <div ref={sentinelRef} className="h-10" />
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            {!hasMore && listings.length > 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Showing all {listings.length} stays
              </p>
            )}
          </>
        )}

        <FiltersModal
          open={filtersOpen}
          filters={filters}
          amenities={selectedAmenities}
          onClose={() => setFiltersOpen(false)}
          onApply={(nextFilters, amenities) => {
            setFilters(nextFilters);
            setSelectedAmenities(amenities);
            resetAndFetch(nextFilters, amenities);
          }}
        />
      </div>
    </main>
  );
}
