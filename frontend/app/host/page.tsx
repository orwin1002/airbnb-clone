"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Booking, ListingCard } from "@/lib/types";
import { useToast } from "@/lib/toast";

export default function HostDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.getHostListings(), api.getHostBookings()])
      .then(([l, b]) => {
        setListings(l);
        setBookings(b);
      })
      .catch(() => showToast("Failed to load dashboard", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.is_host) load();
    else setLoading(false);
  }, [user]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await api.deleteListing(id);
      showToast("Listing deleted", "success");
      load();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Host Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Log in as a host to manage listings.</p>
      </div>
    );
  }

  if (!user.is_host) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Host Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Your account is a guest account. Log in as a host demo account (Priya, Sarah, Marcus, James, or David).
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">Host Dashboard</h1>
        <Link
          href="/host/listings/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          New listing
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold">Your listings ({listings.length})</h2>
            {listings.length === 0 ? (
              <p className="text-muted-foreground">No listings yet.</p>
            ) : (
              <div className="space-y-4">
                {listings.map((l) => (
                  <div
                    key={l.id}
                    className="card-hover flex items-center gap-4 rounded-2xl border border-border p-4 shadow-sm"
                  >
                    <div className="relative h-[72px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-muted">
                      <SafeImage src={l.photo_url} alt="" fill className="object-cover" sizes="96px" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{l.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {l.location_city} · ₹{l.price_per_night.toLocaleString("en-IN")}/night
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/host/listings/${l.id}/edit`}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="rounded-lg border border-border p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Bookings on your listings</h2>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="rounded-2xl border border-border p-4">
                    <p className="font-semibold">{b.listing_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.check_in} → {b.check_out} · {b.guests_count} guests · ₹{b.total_price.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
