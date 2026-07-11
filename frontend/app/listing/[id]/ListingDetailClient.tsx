"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Star, MapPin } from "lucide-react";
import Gallery from "@/components/Gallery";
import BookingSummary from "@/components/BookingSummary";
import ListingMobileBookingBar from "@/components/ListingMobileBookingBar";
import BookingModal from "@/components/BookingModal";
import ReviewsSection from "@/components/ReviewsSection";
import MessageHostButton from "@/components/MessageHostButton";
import { api } from "@/lib/api";
import type { AvailabilityRange, ListingDetail, Review } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { useIdentityVerification } from "@/lib/identityVerification";
import { rangeOverlapsBlocked } from "@/lib/dates";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-xl bg-muted" />,
});

interface Props {
  id: number;
}

export default function ListingDetailClient({ id }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { openVerification } = useIdentityVerification();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blocked, setBlocked] = useState<AvailabilityRange[]>([]);
  const [checkIn, setCheckIn] = useState<string>();
  const [checkOut, setCheckOut] = useState<string>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [highlightReviewId, setHighlightReviewId] = useState<number | null>(null);

  const guests = adults + children;

  const load = () => {
    Promise.all([api.getListing(id), api.getReviews(id), api.getAvailability(id)])
      .then(([l, r, a]) => {
        setListing(l);
        setReviews(r);
        setBlocked(a);
      })
      .catch(() => showToast("Failed to load listing", "error"));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const parseHash = () => {
      const match = window.location.hash.match(/^#review-(\d+)$/);
      setHighlightReviewId(match ? Number(match[1]) : null);
    };
    parseHash();
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  }, [id, pathname]);

  useEffect(() => {
    if (reviews.length === 0) return;
    const match = window.location.hash.match(/^#review-(\d+)$/);
    if (match) setHighlightReviewId(Number(match[1]));
  }, [reviews]);

  useEffect(() => {
    const poll = () => {
      api
        .getReviews(id)
        .then((fresh) => setReviews(fresh))
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 3000);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [id]);

  useEffect(() => {
    const refresh = () => api.getAvailability(id).then(setBlocked).catch(() => {});
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [id]);

  const handleReserve = () => {
    if (!user) {
      showToast("Please log in to book", "error");
      return;
    }
    if (!user.identity_verified) {
      showToast("Verify your identity before booking", "error");
      openVerification();
      return;
    }
    if (!checkIn || !checkOut) {
      showToast("Please select check-in and checkout dates", "error");
      return;
    }
    if (rangeOverlapsBlocked(checkIn, checkOut, blocked)) {
      showToast("Some nights in this range are already booked", "error");
      return;
    }
    if (guests < 1) {
      showToast("Please add at least one guest", "error");
      return;
    }
    if (guests > (listing?.max_guests ?? 1)) {
      showToast(`This place fits up to ${listing?.max_guests} guests`, "error");
      return;
    }
    setBookingOpen(true);
  };

  const bookingProps = {
    pricePerNight: listing?.price_per_night ?? 0,
    checkIn,
    checkOut,
    adults,
    children,
    infants,
    maxGuests: listing?.max_guests ?? 1,
    blockedRanges: blocked,
    onDateChange: (ci: string | undefined, co: string | undefined) => {
      setCheckIn(ci);
      setCheckOut(co);
    },
    onGuestsChange: (counts: { adults: number; children: number; infants: number }) => {
      setAdults(counts.adults);
      setChildren(counts.children);
      setInfants(counts.infants);
    },
    onReserve: handleReserve,
  };

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-muted-foreground">
        Loading listing...
      </div>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-[1120px] px-6 py-6 pb-28 md:px-10 md:py-8 lg:pb-8">
        <h1 className="mb-2 text-[26px] font-semibold leading-tight tracking-tight md:text-[28px]">
          {listing.title}
        </h1>
        <div className="mb-5 flex flex-wrap items-center gap-3 text-sm md:mb-6">
          {listing.review_count > 0 && listing.avg_rating != null && (
            <span className="flex items-center gap-1 font-medium">
              <Star className="h-4 w-4 fill-foreground" />
              {listing.avg_rating.toFixed(1)} · {listing.review_count} reviews
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {listing.location_area}, {listing.location_city}
          </span>
        </div>

        <Gallery photos={listing.photos} title={listing.title} />

        <div className="mt-10 grid gap-12 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <div className="border-b border-border/80 pb-8">
              <h2 className="text-[22px] font-semibold">
                {listing.property_type} · {listing.vibe} · hosted by {listing.host.name}
              </h2>
              <div className="mt-3">
                <MessageHostButton listingId={listing.id} hostId={listing.host.id} />
              </div>
              <p className="mt-1 text-muted-foreground">
                {listing.max_guests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds ·{" "}
                {listing.bathrooms} baths
              </p>
            </div>

            <p className="leading-relaxed text-[15px]">{listing.description}</p>

            {listing.amenities.length > 0 && (
              <div>
                <h3 className="mb-5 text-[22px] font-semibold">What this place offers</h3>
                <div className="grid grid-cols-2 gap-4">
                  {listing.amenities.map((a) => (
                    <div key={a.id} className="text-[15px]">
                      {a.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-5 text-[22px] font-semibold">Where you&apos;ll be</h3>
              {listing.lat && listing.lng ? (
                <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                  <ListingMap
                    lat={listing.lat}
                    lng={listing.lng}
                    title={listing.title}
                    pricePerNight={listing.price_per_night}
                  />
                </div>
              ) : (
                <div className="flex h-[320px] items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
                  Map unavailable for this listing
                </div>
              )}
            </div>

            <ReviewsSection
              reviews={reviews}
              avgRating={listing.avg_rating}
              reviewCount={listing.review_count}
              highlightReviewId={highlightReviewId}
              onReviewUpdate={(updated) =>
                setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
              }
            />
          </div>

          <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <BookingSummary {...bookingProps} />
          </div>
        </div>

        {checkIn && checkOut && (
          <BookingModal
            open={bookingOpen}
            listing={listing}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            onClose={() => setBookingOpen(false)}
            onSuccess={() => {
              api.getAvailability(id).then(setBlocked);
            }}
          />
        )}
      </main>

      <ListingMobileBookingBar {...bookingProps} />
    </>
  );
}
