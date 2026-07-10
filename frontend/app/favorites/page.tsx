"use client";

import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { ListingCard as ListingCardType } from "@/lib/types";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<ListingCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .getFavorites()
      .then(setFavorites)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Wishlists</h1>
        <p className="mt-2 text-muted-foreground">Log in to see your saved listings.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-semibold">Wishlists</h1>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : favorites.length === 0 ? (
        <p className="text-muted-foreground">No saved listings yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((l) => (
            <ListingCard key={l.id} listing={l} isFavorite onFavoriteToggle={() => api.getFavorites().then(setFavorites)} />
          ))}
        </div>
      )}
    </main>
  );
}
