"use client";

import { toast } from "sonner";

type ToastType = "success" | "error" | "info";

export function showToast(message: string, type: ToastType = "info") {
  if (type === "success") toast.success(message);
  else if (type === "error") toast.error(message);
  else toast(message);
}

export function useToast() {
  return { showToast };
}
