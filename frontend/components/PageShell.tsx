"use client";

import { usePathname } from "next/navigation";

export default function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isListing = pathname.startsWith("/listing/");

  return (
    <div className={isListing ? "" : "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"}>
      {children}
    </div>
  );
}
