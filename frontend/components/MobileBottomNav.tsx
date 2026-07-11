"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, Heart, Home, Luggage, MessageSquare, User, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { useIdentityVerification } from "@/lib/identityVerification";
import AuthModal from "@/components/AuthModal";

function tabClass(active: boolean) {
  return `flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium ${
    active ? "text-primary" : "text-muted-foreground"
  }`;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const { showToast } = useToast();
  const { openVerification } = useIdentityVerification();
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  if (pathname.startsWith("/listing/")) return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          <Link href="/" className={tabClass(isActive("/"))}>
            <Home className={`h-6 w-6 ${isActive("/") ? "fill-primary/15" : ""}`} />
            Explore
          </Link>
          <Link href="/favorites" className={tabClass(isActive("/favorites"))}>
            <Heart className={`h-6 w-6 ${isActive("/favorites") ? "fill-primary/15" : ""}`} />
            Wishlists
          </Link>
          <Link href="/trips" className={tabClass(isActive("/trips"))}>
            <Luggage className="h-6 w-6" />
            Trips
          </Link>
          {user ? (
            <Link href="/inbox" className={tabClass(isActive("/inbox"))}>
              <MessageSquare className="h-6 w-6" />
              Inbox
            </Link>
          ) : (
            <button type="button" className={tabClass(false)} onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>
              <MessageSquare className="h-6 w-6" />
              Inbox
            </button>
          )}
          {user?.is_host && (
            <Link href="/host" className={tabClass(isActive("/host"))}>
              <Building2 className={`h-6 w-6 ${isActive("/host") ? "fill-primary/15" : ""}`} />
              Hosting
            </Link>
          )}
          <button type="button" className={tabClass(profileOpen)} onClick={() => setProfileOpen(true)}>
            <User className="h-6 w-6" />
            Profile
          </button>
        </div>
      </nav>

      {profileOpen && (
        <div className="fixed inset-0 z-[85] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProfileOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-border bg-card p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Profile</h2>
              <button type="button" onClick={() => setProfileOpen(false)} className="rounded-full p-2 hover:bg-muted" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : user ? (
              <div className="space-y-3">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.is_host && (
                  <Link
                    href="/host"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white"
                  >
                    <Building2 className="h-4 w-4" />
                    Host dashboard
                  </Link>
                )}
                {user.identity_verified ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Identity verified
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => { openVerification(); setProfileOpen(false); }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Verify identity
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { logout(); setProfileOpen(false); showToast("Logged out", "info"); }}
                  className="w-full rounded-xl bg-muted py-2.5 text-sm font-medium"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); setAuthOpen(true); setProfileOpen(false); }}
                  className="w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("signup"); setAuthOpen(true); setProfileOpen(false); }}
                  className="w-full rounded-xl border border-border py-2.5 text-sm font-medium"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
