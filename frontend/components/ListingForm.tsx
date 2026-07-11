"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/lib/toast";
import { api } from "@/lib/api";
import { PROPERTY_TYPE_VALUES } from "@/lib/propertyTypes";
import { VIBE_VALUES } from "@/lib/vibes";
import type { ListingDetail } from "@/lib/types";

const AMENITY_OPTIONS = [
  "WiFi", "Kitchen", "Free parking", "Air conditioning", "Washer", "Dryer",
  "Pool", "Hot tub", "TV", "Workspace", "Pet friendly", "Breakfast",
];

type FormState = {
  title: string;
  description: string;
  location_city: string;
  location_area: string;
  lat: string;
  lng: string;
  price_per_night: string;
  property_type: string;
  vibe: string;
  max_guests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  photo_urls: string;
  amenity_names: string[];
};

function buildFormState(initial?: ListingDetail): FormState {
  return {
    title: initial?.title || "",
    description: initial?.description || "",
    location_city: initial?.location_city || "",
    location_area: initial?.location_area || "",
    lat: initial?.lat?.toString() || "",
    lng: initial?.lng?.toString() || "",
    price_per_night: initial?.price_per_night?.toString() || "",
    property_type: initial?.property_type || "Entire home",
    vibe: initial?.vibe || "Trending",
    max_guests: initial?.max_guests?.toString() || "2",
    bedrooms: initial?.bedrooms?.toString() || "1",
    beds: initial?.beds?.toString() || "1",
    bathrooms: initial?.bathrooms?.toString() || "1",
    photo_urls: initial?.photos?.map((p) => p.url).join("\n") || "",
    amenity_names: initial?.amenities?.map((a) => a.name) || [],
  };
}

function snapshot(form: FormState) {
  return JSON.stringify(form);
}

interface Props {
  initial?: ListingDetail;
}

export default function ListingForm({ initial }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const initialSnapshot = useMemo(() => snapshot(buildFormState(initial)), [initial]);
  const [form, setForm] = useState<FormState>(() => buildFormState(initial));

  const isDirty = snapshot(form) !== initialSnapshot;

  const update = (key: keyof FormState, value: string | string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAmenity = (name: string) => {
    setForm((f) => ({
      ...f,
      amenity_names: f.amenity_names.includes(name)
        ? f.amenity_names.filter((a) => a !== name)
        : [...f.amenity_names, name],
    }));
  };

  const buildPayload = () => ({
    title: form.title,
    description: form.description,
    location_city: form.location_city,
    location_area: form.location_area,
    lat: form.lat ? Number(form.lat) : null,
    lng: form.lng ? Number(form.lng) : null,
    price_per_night: Number(form.price_per_night),
    property_type: form.property_type,
    vibe: form.vibe,
    max_guests: Number(form.max_guests),
    bedrooms: Number(form.bedrooms),
    beds: Number(form.beds),
    bathrooms: Number(form.bathrooms),
    photo_urls: form.photo_urls.split("\n").map((s) => s.trim()).filter(Boolean),
    amenity_names: form.amenity_names,
  });

  const save = async (): Promise<boolean> => {
    setLoading(true);
    const payload = buildPayload();
    try {
      if (initial) {
        await api.updateListing(initial.id, payload);
        showToast("Listing updated", "success");
      } else {
        await api.createListing(payload);
        showToast("Listing created", "success");
      }
      router.push("/host");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save();
  };

  const handleBack = () => {
    if (isDirty) setLeaveOpen(true);
    else router.push("/host");
  };

  const field = (label: string, key: keyof FormState, type = "text") => (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => update(key, e.target.value)}
        required={["title", "description", "location_city", "location_area", "price_per_night"].includes(key)}
        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-8 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full p-2 hover:bg-muted"
            aria-label="Back to hosting"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {initial ? "Edit listing" : "Create a new listing"}
          </h1>
        </div>

        {field("Title", "title")}
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            rows={4}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("City", "location_city")}
          {field("Area / Neighborhood", "location_area")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Latitude (optional)", "lat")}
          {field("Longitude (optional)", "lng")}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {field("Price per night (₹)", "price_per_night", "number")}
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              value={form.property_type}
              onChange={(e) => update("property_type", e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none"
            >
              {PROPERTY_TYPE_VALUES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Vibe</label>
            <select
              value={form.vibe}
              onChange={(e) => update("vibe", e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none"
            >
              {VIBE_VALUES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {field("Max guests", "max_guests", "number")}
          {field("Bedrooms", "bedrooms", "number")}
          {field("Beds", "beds", "number")}
          {field("Bathrooms", "bathrooms", "number")}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Photo URLs (one per line)</label>
          <textarea
            value={form.photo_urls}
            onChange={(e) => update("photo_urls", e.target.value)}
            rows={3}
            placeholder="https://images.unsplash.com/..."
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  form.amenity_names.includes(a)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Saving..." : initial ? "Update listing" : "Create listing"}
        </button>
      </form>

      {leaveOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && setLeaveOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
            <h2 className="text-lg font-semibold">Discard changes?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You have unsaved changes to this listing. Save them before leaving, or discard and go back.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setLeaveOpen(false);
                  router.push("/host");
                }}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  const ok = await save();
                  if (ok) setLeaveOpen(false);
                }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save & exit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
