"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({ open, onClose, initialMode = "login" }: Props) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  if (!open) return null;

  const reset = () => {
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setIsHost(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register({ name: name.trim(), email: email.trim(), password, is_host: isHost });
      }
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{mode === "login" ? "Log in" : "Sign up"}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex rounded-full border border-border p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${mode === "login" ? "bg-foreground text-background" : ""}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${mode === "signup" ? "bg-foreground text-background" : ""}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {mode === "signup" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isHost} onChange={(e) => setIsHost(e.target.checked)} />
              I want to host properties
            </label>
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
