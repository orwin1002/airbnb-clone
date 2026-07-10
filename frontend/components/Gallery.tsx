"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";
import SafeImage from "@/components/SafeImage";

interface Props {
  photos: Photo[];
  title: string;
}

export default function Gallery({ photos, title }: Props) {
  const [selected, setSelected] = useState(0);
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);

  if (sorted.length === 0) {
    return (
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl bg-muted">
        <SafeImage src={null} alt={title} fill className="object-cover" sizes="100vw" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        <SafeImage
          src={sorted[selected].url}
          alt={`${title} - photo ${selected + 1}`}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setSelected(i)}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg ${
                i === selected ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
              }`}
            >
              <SafeImage src={photo.url} alt="" fill className="object-cover" sizes="112px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
