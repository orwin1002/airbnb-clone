"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.error(error);
  }, [error]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        {error.message || "An unexpected error occurred. You can try again."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
