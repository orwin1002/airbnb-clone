"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface IdentityVerificationContextType {
  open: boolean;
  openVerification: () => void;
  closeVerification: () => void;
}

const IdentityVerificationContext = createContext<IdentityVerificationContextType | null>(null);

export function IdentityVerificationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <IdentityVerificationContext.Provider
      value={{
        open,
        openVerification: () => setOpen(true),
        closeVerification: () => setOpen(false),
      }}
    >
      {children}
    </IdentityVerificationContext.Provider>
  );
}

export function useIdentityVerification() {
  const ctx = useContext(IdentityVerificationContext);
  if (!ctx) throw new Error("useIdentityVerification must be used within IdentityVerificationProvider");
  return ctx;
}
