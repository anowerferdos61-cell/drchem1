import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import { Eye, EyeOff, FlaskConical, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeBdPhone, syntheticAuthEmailForPhone } from "@/lib/phone";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/app",
  }),
  component: LoginPage,

  head: () => ({
    meta: [
      { title: "লগইন · Dr. Chem" },
      {
        name: "description",
        content:
          "Log in to Dr. Chem with your phone number or email to continue virtual chemistry experiments, AI tutoring and viva practice for Class 9-10.",
      },
      { property: "og:title", content: "লগইন · Dr. Chem" },
      {
        property: "og:description",
        content:
          "Log in to your Dr. Chem account with phone or email to continue learning chemistry with the virtual lab and AI tutor.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchem.lovable.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://drchem.lovable.app/login" }],
  }),
});

/** Resolve any user-entered identifier (phone or email) into the auth email. */
async function resolveAuthEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  // Looks like an email → use as-is.
  if (trimmed.includes("@")) return trimmed;

  // Otherwise treat as a BD phone number.
  const normalized = normalizeBdPhone(trimmed);
  if (!normalized) return null;

  // First try the synthetic email (phone-only signups).
  const synthetic = syntheticAuthEmailForPhone(normalized);

  // Then look up in profiles for accounts where user provided a real email.
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: string | null; error: { message: string } | null }>
  )("get_auth_email_by_phone", { _phone: normalized });
  if (error) {
    console.warn("phone lookup failed", error);
    return synthetic;
  }
  return data ?? synthetic;
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { isAuthenticated, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void navigate({ to: redirect, replace: true });
    }
  }, [loading, isAuthenticated, navigate, redirect]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const authEmail = await resolveAuthEmail(identifier);
    if (!authEmail) {
      setSubmitting(false);
      toast.error("সঠিক ফোন নাম্বার বা ইমেইল দিন");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });
    setSubmitting(false);
    if (error) {
      toast.error("ফোন/ইমেইল বা পাসওয়ার্ড ভুল");
      return;
    }
    toast.success("স্বাগতম!");
    navigate({ to: redirect, replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Dr. Chem</span>
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">আবার স্বাগতম 👋</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          ভার্চুয়াল কেমিস্ট্রি ল্যাবে লগইন করুন
        </p>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <Label htmlFor="identifier">ফোন নাম্বার বা ইমেইল</Label>
            <Input
              id="identifier"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="01XXXXXXXXX অথবা you@example.com"
              autoComplete="username"
            />
          </div>
          <div>
            <div className="flex justify-between">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Link
                to="/reset-password"
                className="text-xs text-primary hover:underline"
              >
                ভুলে গেছেন?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "পাসওয়ার্ড লুকাও" : "পাসওয়ার্ড দেখাও"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "লগইন"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-3">
          পাসওয়ার্ড রিসেট শুধু ইমেইলে সম্ভব। ফোন-অনলি অ্যাকাউন্টের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।
        </p>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          নতুন এখানে?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            সাইনআপ করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
