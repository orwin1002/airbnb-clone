"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Luggage,
  MessageSquare,
  ShieldCheck,
  Star,
  User as UserIcon,
  Users,
} from "lucide-react";
import HostReply from "@/components/HostReply";
import ReviewEngagement from "@/components/ReviewEngagement";
import EditReviewModal from "@/components/EditReviewModal";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useIdentityVerification } from "@/lib/identityVerification";
import { useToast } from "@/lib/toast";
import type { GuestReview } from "@/lib/types";

type ProfileTab = "about" | "trips" | "connections";

function profileInitial(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 1)
    .toUpperCase();
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-foreground" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

export default function ProfilePageClient() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openVerification } = useIdentityVerification();
  const { showToast } = useToast();
  const [tab, setTab] = useState<ProfileTab>("about");
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editReview, setEditReview] = useState<GuestReview | null>(null);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "trips" || t === "connections" || t === "about") setTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setReviewsLoading(true);
    api
      .getMyWrittenReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [user]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-center text-muted-foreground">
        Loading profile...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-muted-foreground">Log in to view and edit your profile.</p>
        <Link href="/" className="mt-6 inline-block font-medium text-primary underline">
          Back to home
        </Link>
      </main>
    );
  }

  const navItem = (id: ProfileTab, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => {
        setTab(id);
        router.replace(`/profile?tab=${id}`, { scroll: false });
      }}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
        tab === id ? "bg-muted" : "hover:bg-muted/60"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
        <aside className="lg:w-56 lg:shrink-0">
          <h1 className="mb-4 text-2xl font-semibold">Profile</h1>
          <nav className="space-y-1">
            {navItem("about", "About me", <UserIcon className="h-5 w-5" />)}
            {navItem("trips", "Past trips", <Luggage className="h-5 w-5" />)}
            {navItem("connections", "Connections", <Users className="h-5 w-5" />)}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {tab === "about" && (
            <div>
              <div className="mb-8 flex items-center gap-3">
                <h2 className="text-[32px] font-semibold tracking-tight">About me</h2>
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-1 text-sm font-medium text-muted-foreground"
                  disabled
                >
                  Edit
                </button>
              </div>

              <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
                <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary">
                    {profileInitial(user.name)}
                  </div>
                  <p className="mt-4 text-xl font-semibold">{user.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{user.is_host ? "Host" : "Guest"}</p>
                </div>

                <div className="max-w-lg">
                  <h3 className="text-lg font-semibold">Complete your profile</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    Your Airbnb profile is an important part of every reservation. Create yours to help
                    other hosts and guests get to know you.
                  </p>
                  {user.identity_verified ? (
                    <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                      <ShieldCheck className="h-4 w-4" />
                      Profile verified
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={openVerification}
                      className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Get started
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      showToast("Logged out", "info");
                      router.push("/");
                    }}
                    className="mt-6 block text-sm font-medium text-muted-foreground underline hover:text-foreground"
                  >
                    Log out
                  </button>
                </div>
              </div>

              <div className="mt-12 border-t border-border pt-8">
                <button
                  type="button"
                  onClick={() => setReviewsOpen((v) => !v)}
                  className="flex w-full items-center gap-3 text-left text-[15px] font-medium hover:opacity-80"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="flex-1">Show reviews I&apos;ve written</span>
                  {reviewsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {reviewsOpen && (
                  <div className="mt-6 space-y-4">
                    {reviewsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        You haven&apos;t written any reviews yet. After a trip, leave one from{" "}
                        <Link href="/trips" className="font-medium text-primary underline">
                          Trips
                        </Link>
                        .
                      </p>
                    ) : (
                      reviews.map((r) => (
                        <article
                          key={r.id}
                          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                        >
                          <Link
                            href={`/listing/${r.listing_id}#review-${r.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {r.listing_title}
                          </Link>
                          <div className="mt-2 flex items-center gap-2">
                            <ReviewStars rating={r.rating} />
                            <span className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString("en-IN", {
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed">{r.comment}</p>
                          {r.host_reply?.trim() ? (
                            <HostReply reply={r.host_reply} replyAt={r.host_reply_at} className="mt-4" />
                          ) : (
                            <p className="mt-3 text-xs text-muted-foreground">No host response yet</p>
                          )}
                          <ReviewEngagement
                            review={r}
                            canEditReview
                            onUpdate={(updated) =>
                              setReviews((prev) =>
                                prev.map((item) =>
                                  item.id === updated.id ? (updated as GuestReview) : item,
                                ),
                              )
                            }
                            onDelete={(reviewId) =>
                              setReviews((prev) => prev.filter((item) => item.id !== reviewId))
                            }
                            onEdit={(review) => setEditReview(review as GuestReview)}
                          />
                        </article>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "trips" && (
            <div>
              <h2 className="mb-6 text-[32px] font-semibold tracking-tight">Past trips</h2>
              <p className="mb-6 text-muted-foreground">
                View and manage your bookings, reviews, and host messages.
              </p>
              <Link
                href="/trips"
                className="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Go to My Trips
              </Link>
            </div>
          )}

          {tab === "connections" && (
            <div>
              <h2 className="mb-6 text-[32px] font-semibold tracking-tight">Connections</h2>
              <p className="text-muted-foreground">
                Connect with hosts and guests you&apos;ve met through Airbnb. This feature is coming soon.
              </p>
            </div>
          )}
        </div>
      </div>

      {editReview && (
        <EditReviewModal
          open
          listingTitle={editReview.listing_title}
          reviewId={editReview.id}
          initialRating={editReview.rating}
          initialComment={editReview.comment}
          onClose={() => setEditReview(null)}
          onUpdated={(updated) => {
            setReviews((prev) =>
              prev.map((item) =>
                item.id === updated.id ? { ...item, ...updated } : item,
              ),
            );
            setEditReview(null);
          }}
        />
      )}
    </main>
  );
}
