import { Suspense } from "react";
import ProfilePageClient from "./ProfilePageClient";

export default function ProfilePage() {
  return (
    <Suspense fallback={<main className="px-6 py-16 text-center text-muted-foreground">Loading profile...</main>}>
      <ProfilePageClient />
    </Suspense>
  );
}
