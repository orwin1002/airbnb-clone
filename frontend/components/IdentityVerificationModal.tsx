"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useIdentityVerification } from "@/lib/identityVerification";
import { useNotifications } from "@/lib/notifications";
import { useToast } from "@/lib/toast";

export default function IdentityVerificationModal() {
  const { open, closeVerification } = useIdentityVerification();
  const { user, refreshSession } = useAuth();
  const { addNotification } = useNotifications();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idFile, setIdFile] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open || !user) return null;

  const reset = () => {
    setStep(1);
    setIdFile(null);
    setSelfieFile(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    closeVerification();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      await api.verifyIdentity();
      await refreshSession();
      setStep(3);
      addNotification(
        "Identity verified",
        "Your account is now verified. You can book stays and message hosts.",
        "verification",
        { toast: true }
      );
      showToast("Identity verified successfully", "success");
    } catch {
      showToast("Verification failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const mockPickFile = (setter: (name: string) => void) => {
    setter("document.jpg");
    showToast("Document uploaded (demo)", "success");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Identity verification</h2>
            <p className="text-sm text-muted-foreground">Required before booking (mock flow)</p>
          </div>
        </div>

        {user.identity_verified || step === 3 ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
            <p className="mt-4 text-lg font-semibold">You&apos;re verified</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your identity has been confirmed. You can now book stays.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background"
            >
              Done
            </button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a government ID (passport, Aadhaar, or driver&apos;s licence). This is a demo — no
              files are sent anywhere.
            </p>
            <button
              type="button"
              onClick={() => mockPickFile(setIdFile)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-sm font-medium hover:bg-muted/50"
            >
              <Upload className="h-5 w-5" />
              {idFile ? idFile : "Upload ID document"}
            </button>
            <button
              type="button"
              disabled={!idFile}
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a selfie to match your ID. In this demo, any upload completes verification instantly.
            </p>
            <button
              type="button"
              onClick={() => mockPickFile(setSelfieFile)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-sm font-medium hover:bg-muted/50"
            >
              <Upload className="h-5 w-5" />
              {selfieFile ? selfieFile : "Upload selfie"}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!selfieFile || loading}
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-40"
              >
                {loading ? "Verifying..." : "Submit for review"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
