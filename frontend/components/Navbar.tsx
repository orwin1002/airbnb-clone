"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  Moon,
  Sun,
  ShieldCheck,
  User,
  X,
  Building2,
  Home,
  Heart,
  Luggage,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth, DEMO_GUESTS, DEMO_HOSTS } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { useIdentityVerification } from "@/lib/identityVerification";
import { syncInboxMessageNotifications } from "@/lib/inboxNotifications";
import { useNotifications } from "@/lib/notifications";
import AuthModal from "@/components/AuthModal";
import NotificationBell from "@/components/NotificationBell";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9 rounded-full" aria-hidden />;
  const isDark = resolvedTheme === "dark";
  return (
    <button onClick={() => setTheme(isDark ? "light" : "dark")} className="rounded-full p-2 hover:bg-muted" aria-label="Toggle theme">
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export default function Navbar() {
  const { user, demoLogin, logout, loading } = useAuth();
  const { showToast } = useToast();
  const { openVerification } = useIdentityVerification();
  const { addNotification, markReadByDedupePrefix } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleDemoLogin = async (email: string) => {
    try {
      const u = await demoLogin(email);
      showToast("Welcome back!", "success");
      await syncInboxMessageNotifications(u.id, addNotification, markReadByDedupePrefix, {
        toastNewMessages: false,
      });
      addNotification("Signed in", `You're logged in as ${email}`, "system", {
        toast: false,
        read: true,
        userId: u.id,
      });
      if (/^\/inbox\/\d+/.test(pathname)) {
        router.replace("/inbox");
      }
      setMenuOpen(false);
      setProfileOpen(false);
    } catch {
      showToast("Demo login failed", "error");
    }
  };

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setProfileOpen(false);
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const navLink = (href: string, label: string, icon: React.ReactNode) => (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:bg-muted ${
        pathname === href ? "text-primary" : "text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between px-4 py-3.5 sm:px-6 md:px-10">
          <Link href="/" className="flex items-center">
            <svg viewBox="0 0 320.1 99.9" className="h-8 w-auto fill-primary" aria-label="Airbnb">
              <path d="M168.7,25.1c0,3.6-2.9,6.5-6.5,6.5s-6.5-2.9-6.5-6.5s2.8-6.5,6.5-6.5C165.9,18.7,168.7,21.6,168.7,25.1z M141.9,38.2c0,0.6,0,1.6,0,1.6s-3.1-4-9.7-4c-10.9,0-19.4,8.3-19.4,19.8c0,11.4,8.4,19.8,19.4,19.8c6.7,0,9.7-4.1,9.7-4.1v1.7c0,0.8,0.6,1.4,1.4,1.4h8.1V36.8c0,0-7.4,0-8.1,0C142.5,36.8,141.9,37.5,141.9,38.2z M141.9,62.3c-1.5,2.2-4.5,4.1-8.1,4.1c-6.4,0-11.3-4-11.3-10.8s4.9-10.8,11.3-10.8c3.5,0,6.7,2,8.1,4.1V62.3z M157.4,36.8h9.6v37.6h-9.6V36.8z M300.8,35.8c-6.6,0-9.7,4-9.7,4V18.7h-9.6v55.7c0,0,7.4,0,8.1,0c0.8,0,1.4-0.7,1.4-1.4v-1.7l0,0c0,0,3.1,4.1,9.7,4.1c10.9,0,19.4-8.4,19.4-19.8C320.1,44.2,311.6,35.8,300.8,35.8z M299.2,66.3c-3.7,0-6.6-1.9-8.1-4.1V48.8c1.5-2,4.7-4.1,8.1-4.1c6.4,0,11.3,4,11.3,10.8S305.6,66.3,299.2,66.3z M276.5,52.1v22.4h-9.6V53.2c0-6.2-2-8.7-7.4-8.7c-2.9,0-5.9,1.5-7.8,3.7v26.2h-9.6V36.8h7.6c0.8,0,1.4,0.7,1.4,1.4v1.6c2.8-2.9,6.5-4,10.2-4c4.2,0,7.7,1.2,10.5,3.6C275.2,42.2,276.5,45.8,276.5,52.1z M218.8,35.8c-6.6,0-9.7,4-9.7,4V18.7h-9.6v55.7c0,0,7.4,0,8.1,0c0.8,0,1.4-0.7,1.4-1.4v-1.7l0,0c0,0,3.1,4.1,9.7,4.1c10.9,0,19.4-8.4,19.4-19.8C238.2,44.2,229.7,35.8,218.8,35.8z M217.2,66.3c-3.7,0-6.6-1.9-8.1-4.1V48.8c1.5-2,4.7-4.1,8.1-4.1c6.4,0,11.3,4,11.3,10.8S223.6,66.3,217.2,66.3z M191.2,35.8c2.9,0,4.4,0.5,4.4,0.5v8.9c0,0-8-2.7-13,3v26.3h-9.6V36.8c0,0,7.4,0,8.1,0c0.8,0,1.4,0.7,1.4,1.4v1.6C184.3,37.7,188.2,35.8,191.2,35.8z M91.5,71c-0.5-1.2-1-2.5-1.5-3.6c-0.8-1.8-1.6-3.5-2.3-5.1l-0.1-0.1c-6.9-15-14.3-30.2-22.1-45.2l-0.3-0.6c-0.8-1.5-1.6-3.1-2.4-4.7c-1-1.8-2-3.7-3.6-5.5C56,2.2,51.4,0,46.5,0c-5,0-9.5,2.2-12.8,6c-1.5,1.8-2.6,3.7-3.6,5.5c-0.8,1.6-1.6,3.2-2.4,4.7l-0.3,0.6C19.7,31.8,12.2,47,5.3,62l-0.1,0.2c-0.7,1.6-1.5,3.3-2.3,5.1c-0.5,1.1-1,2.3-1.5,3.6c-1.3,3.7-1.7,7.2-1.2,10.8c1.1,7.5,6.1,13.8,13,16.6c2.6,1.1,5.3,1.6,8.1,1.6c0.8,0,1.8-0.1,2.6-0.2c3.3-0.4,6.7-1.5,10-3.4c4.1-2.3,8-5.6,12.4-10.4c4.4,4.8,8.4,8.1,12.4,10.4c3.3,1.9,6.7,3,10,3.4c0.8,0.1,1.8,0.2,2.6,0.2c2.8,0,5.6-0.5,8.1-1.6c7-2.8,11.9-9.2,13-16.6C93.2,78.2,92.8,74.7,91.5,71z M46.4,76.2c-5.4-6.8-8.9-13.2-10.1-18.6c-0.5-2.3-0.6-4.3-0.3-6.1c0.2-1.6,0.8-3,1.6-4.2c1.9-2.7,5.1-4.4,8.8-4.4c3.7,0,7,1.6,8.8,4.4c0.8,1.2,1.4,2.6,1.6,4.2c0.3,1.8,0.2,3.9-0.3,6.1C55.3,62.9,51.8,69.3,46.4,76.2z M86.3,80.9c-0.7,5.2-4.2,9.7-9.1,11.7c-2.4,1-5,1.3-7.6,1c-2.5-0.3-5-1.1-7.6-2.6c-3.6-2-7.2-5.1-11.4-9.7c6.6-8.1,10.6-15.5,12.1-22.1c0.7-3.1,0.8-5.9,0.5-8.5c-0.4-2.5-1.3-4.8-2.7-6.8c-3.1-4.5-8.3-7.1-14.1-7.1s-11,2.7-14.1,7.1c-1.4,2-2.3,4.3-2.7,6.8c-0.4,2.6-0.3,5.5,0.5,8.5c1.5,6.6,5.6,14.1,12.1,22.2c-4.1,4.6-7.8,7.7-11.4,9.7c-2.6,1.5-5.1,2.3-7.6,2.6c-2.7,0.3-5.3-0.1-7.6-1c-4.9-2-8.4-6.5-9.1-11.7c-0.3-2.5-0.1-5,0.9-7.8c0.3-1,0.8-2,1.3-3.2c0.7-1.6,1.5-3.3,2.3-5l0.1-0.2c6.9-14.9,14.3-30.1,22-44.9l0.3-0.6c0.8-1.5,1.6-3.1,2.4-4.6c0.8-1.6,1.7-3.1,2.8-4.4c2.1-2.4,4.9-3.7,8-3.7c3.1,0,5.9,1.3,8,3.7c1.1,1.3,2,2.8,2.8,4.4c0.8,1.5,1.6,3.1,2.4,4.6l0.3,0.6C67.7,34.8,75.1,50,82,64.9L82,65c0.8,1.6,1.5,3.4,2.3,5c0.5,1.2,1,2.2,1.3,3.2C86.4,75.8,86.7,78.3,86.3,80.9z" />
            </svg>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLink("/", "Explore", <Home className="h-4 w-4" />)}
            {navLink("/favorites", "Wishlists", <Heart className="h-4 w-4" />)}
            {navLink("/trips", "Trips", <Luggage className="h-4 w-4" />)}
            {user && navLink("/inbox", "Inbox", <MessageSquare className="h-4 w-4" />)}
            {user?.is_host && navLink("/host", "Hosting", <Building2 className="h-4 w-4" />)}
          </nav>

          {/* Mobile: theme + notif + menu | Desktop: theme + notif + profile + menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {user && <NotificationBell />}

            <div className="relative hidden lg:block">
              {user ? (
                <Link
                  href="/profile"
                  className="flex items-center rounded-full border border-border p-1.5 shadow-sm transition hover:shadow-md"
                  aria-label="Profile"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center rounded-full border border-border p-1.5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                </button>
              )}

              {profileOpen && !user && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-elevated">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <div className="space-y-2">
                      <button onClick={() => openAuth("login")} className="w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background">
                        Log in
                      </button>
                      <button onClick={() => openAuth("signup")} className="w-full rounded-xl border border-border py-2.5 text-sm font-medium">
                        Sign up
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="rounded-full p-2 hover:bg-muted"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-[57px] max-h-[min(75vh,560px)] overflow-y-auto border-b border-border bg-card px-4 py-4 shadow-elevated sm:left-auto sm:right-4 sm:top-[65px] sm:w-full sm:max-w-sm sm:rounded-2xl sm:border md:right-10">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guest accounts</p>
              <div className="space-y-1">
                {DEMO_GUESTS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => handleDemoLogin(u.email)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {u.label}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Host accounts</p>
              <div className="space-y-1">
                {DEMO_HOSTS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => handleDemoLogin(u.email)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {user && (
              <div className="mt-4 space-y-2 border-t border-border pt-4 lg:hidden">
                {user.is_host && (
                  <Link
                    href="/host"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    <Building2 className="h-4 w-4" />
                    Host dashboard
                  </Link>
                )}
                {!user.identity_verified && (
                  <button
                    type="button"
                    onClick={() => {
                      openVerification();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Verify identity
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { logout(); setMenuOpen(false); showToast("Logged out", "info"); }}
                  className="w-full rounded-lg bg-muted py-2 text-sm font-medium"
                >
                  Log out ({user.name})
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
