"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { ListingCard } from "@/lib/types";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

function priceIcon(price: number, selected: boolean) {
  const label = formatPrice(price);
  const html = `<div style="
    display:inline-block;
    box-sizing:border-box;
    background:${selected ? "#222222" : "#ffffff"};
    color:${selected ? "#ffffff" : "#222222"};
    border:2px solid ${selected ? "#222222" : "#ffffff"};
    outline:1px solid #dddddd;
    border-radius:9999px;
    padding:7px 12px;
    font-size:13px;
    font-weight:700;
    font-family:system-ui,-apple-system,sans-serif;
    line-height:1;
    white-space:nowrap;
    box-shadow:0 2px 10px rgba(0,0,0,0.18);
    transform:translate(-50%,-50%);
    cursor:pointer;
  ">${label}</div>`;
  return L.divIcon({
    className: "price-marker-icon",
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function FitBounds({ listings }: { listings: ListingCard[] }) {
  const map = useMap();

  useEffect(() => {
    const coords = listings
      .filter((l) => l.lat != null && l.lng != null)
      .map((l) => [l.lat!, l.lng!] as [number, number]);
    if (coords.length === 0) {
      map.setView([20.5937, 78.9629], 5);
      return;
    }
    if (coords.length === 1) {
      map.setView(coords[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(coords), { padding: [56, 56], maxZoom: 14 });
  }, [listings, map]);

  return null;
}

function ListingMarker({
  listing,
  selected,
  onSelect,
}: {
  listing: ListingCard;
  selected: boolean;
  onSelect?: (id: number | null) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (selected) {
      markerRef.current?.openPopup();
    }
  }, [selected]);

  return (
    <Marker
      ref={markerRef}
      position={[listing.lat!, listing.lng!]}
      icon={priceIcon(listing.price_per_night, selected)}
      eventHandlers={{
        click: () => onSelect?.(listing.id),
      }}
    >
      <Popup className="listing-map-popup" minWidth={220} maxWidth={260}>
        <div className="overflow-hidden rounded-lg">
          {listing.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photo_url}
              alt={listing.title}
              className="mb-2 h-32 w-full object-cover"
            />
          ) : (
            <div className="mb-2 flex h-32 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No photo
            </div>
          )}
          <div className="px-1 pb-1 text-sm">
            <p className="font-semibold leading-snug line-clamp-2">{listing.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {listing.location_area}, {listing.location_city}
            </p>
            <p className="mt-1.5 font-semibold">
              {formatPrice(listing.price_per_night)}{" "}
              <span className="font-normal text-muted-foreground">night</span>
            </p>
            <Link
              href={`/listing/${listing.id}`}
              className="mt-2 inline-block text-sm font-medium text-primary underline"
            >
              View listing
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

interface Props {
  listings: ListingCard[];
  selectedId?: number | null;
  onSelect?: (id: number | null) => void;
  className?: string;
  interactive?: boolean;
}

export default function SearchResultsMap({
  listings,
  selectedId = null,
  onSelect,
  className = "h-full w-full rounded-xl",
  interactive = true,
}: Props) {
  const mappable = listings.filter((l) => l.lat != null && l.lng != null);

  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      scrollWheelZoom={interactive}
      className={`z-0 ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds listings={mappable} />
      {mappable.map((listing) => (
        <ListingMarker
          key={`${listing.id}-${selectedId === listing.id}`}
          listing={listing}
          selected={selectedId === listing.id}
          onSelect={onSelect}
        />
      ))}
    </MapContainer>
  );
}
