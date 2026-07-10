"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { PLACEHOLDER_IMAGE, resolveImageSrc } from "@/lib/images";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
};

export default function SafeImage({ src, alt, onError, className, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() => resolveImageSrc(src));
  const isPlaceholder = currentSrc === PLACEHOLDER_IMAGE;
  const isRemote = currentSrc.startsWith("http");

  useEffect(() => {
    setCurrentSrc(resolveImageSrc(src));
  }, [src]);

  return (
    <Image
      key={currentSrc}
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={isPlaceholder || isRemote}
      className={`${className ?? ""} ${isPlaceholder ? "bg-muted object-contain p-6" : ""}`.trim()}
      onError={(e) => {
        if (currentSrc !== PLACEHOLDER_IMAGE) setCurrentSrc(PLACEHOLDER_IMAGE);
        onError?.(e);
      }}
    />
  );
}
