"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ListingForm from "@/components/ListingForm";
import { api } from "@/lib/api";
import type { ListingDetail } from "@/lib/types";

export default function EditListingPage() {
  const params = useParams();
  const id = Number(params.id);
  const [listing, setListing] = useState<ListingDetail | null>(null);

  useEffect(() => {
    api.getListing(id).then(setListing).catch(() => {});
  }, [id]);

  if (!listing) {
    return <p className="px-4 py-20 text-center text-muted-foreground">Loading...</p>;
  }

  return <ListingForm initial={listing} />;
}
