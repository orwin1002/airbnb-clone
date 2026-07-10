"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import type { ListingCard as ListingCardType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import SafeImage from "@/components/SafeImage";

interface Props {
  listing: ListingCardType;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export default function ListingCard({ listing, isFavorite = false, onFavoriteToggle }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [fav, setFav] = useState(isFavorite);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast("Please log in to save favorites", "error");
      return;
    }
    try {
      if (fav) {
        await api.removeFavorite(listing.id);
        setFav(false);
        showToast("Removed from wishlist", "info");
      } else {
        await api.addFavorite(listing.id);
        setFav(true);
        showToast("Saved to wishlist", "success");
      }
      onFavoriteToggle?.();
    } catch {
      showToast("Could not update wishlist", "error");
    }
  };

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <div className="card-hover relative aspect-[20/19] overflow-hidden rounded-xl bg-muted shadow-card">
        <SafeImage
          src={listing.photo_url}
          alt={listing.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 100vw, 20vw"
        />
        {listing.is_guest_favourite && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#222222] shadow-md">
            Guest favourite
          </span>
        )}
        <button
          onClick={toggleFavorite}
          className="absolute right-3 top-3 rounded-full p-1.5 transition hover:scale-110"
          aria-label="Toggle favorite"
        >
          <Heart
            className={`h-6 w-6 drop-shadow-md ${fav ? "fill-primary text-primary" : "fill-black/40 text-white"}`}
          />
        </button>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug line-clamp-1">
            {listing.location_area}, {listing.location_city}
          </h3>
          {listing.review_count > 0 && listing.avg_rating != null ? (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="h-3.5 w-3.5 fill-foreground" />
              {listing.avg_rating.toFixed(1)}
            </span>
          ) : (
            <span className="shrink-0 text-sm text-muted-foreground">New</span>
          )}
        </div>
        <p className="text-[15px] text-muted-foreground line-clamp-1">{listing.title}</p>
        <p className="text-sm text-muted-foreground">{listing.vibe} · {listing.property_type}</p>
        <p className="pt-0.5 text-[15px]">
          <span className="font-semibold">₹{listing.price_per_night.toLocaleString("en-IN")}</span>
          <span className="font-normal text-muted-foreground"> night</span>
        </p>
      </div>
    </Link>
  );
}
