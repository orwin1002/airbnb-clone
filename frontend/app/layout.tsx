import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import PageShell from "@/components/PageShell";
import IdentityVerificationModal from "@/components/IdentityVerificationModal";
import MessageNotificationListener from "@/components/MessageNotificationListener";
import ReviewNotificationListener from "@/components/ReviewNotificationListener";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import { NotificationProvider } from "@/lib/notifications";
import { IdentityVerificationProvider } from "@/lib/identityVerification";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airbnb",
  description: "Find places to stay and experiences to enjoy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <IdentityVerificationProvider>
                <Navbar />
                <PageShell>{children}</PageShell>
                <MobileBottomNav />
                <IdentityVerificationModal />
                <MessageNotificationListener />
                <ReviewNotificationListener />
                <Toaster position="bottom-right" richColors closeButton />
              </IdentityVerificationProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
